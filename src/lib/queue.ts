import { randomBytes, randomUUID } from "node:crypto";
import { database, getJakartaDateKey } from "@/lib/db";

type TicketStatus =
  | "waiting"
  | "called"
  | "completed"
  | "skipped"
  | "cancelled";

type ServiceRow = {
  id: string;
  name: string;
  prefix: string;
  description: string;
  average_minutes: number;
};

export type QueueTicket = {
  id: string;
  number: string;
  serviceId: string;
  serviceName: string;
  status: TicketStatus;
  deskId: string | null;
  deskLabel: string | null;
  createdAt: number;
  calledAt: number | null;
  aheadCount: number;
  estimatedWaitMinutes: number;
};

function estimateWait(
  aheadCount: number,
  averageMinutes: number,
  availableDeskCount: number,
) {
  if (aheadCount === 0) return 0;
  return Math.ceil(
    (aheadCount * averageMinutes) / Math.max(1, availableDeskCount),
  );
}

function getOpenDeskCount(dateKey = getJakartaDateKey()) {
  const activeDesks = (
    database
      .prepare("SELECT COUNT(*) AS count FROM desks WHERE active = 1")
      .get() as { count: number }
  ).count;
  const occupiedDesks = (
    database
      .prepare(
        "SELECT COUNT(DISTINCT desk_id) AS count FROM tickets WHERE date_key = ? AND status = 'called'",
      )
      .get(dateKey) as { count: number }
  ).count;
  return Math.max(1, activeDesks - occupiedDesks);
}

export function getQueueState() {
  const dateKey = getJakartaDateKey();
  const services = database
    .prepare(
      `
      SELECT id, name, prefix, description, average_minutes FROM services WHERE active = 1
      ORDER BY CASE id WHEN 'photocopy' THEN 0 WHEN 'print' THEN 1 WHEN 'binding' THEN 2 ELSE 3 END, name
    `,
    )
    .all() as ServiceRow[];
  const deskRows = database
    .prepare("SELECT id, label FROM desks WHERE active = 1 ORDER BY id")
    .all() as { id: string; label: string }[];
  const calledTickets = database
    .prepare(
      `
      SELECT tickets.id, tickets.number, tickets.service_id, services.name AS service_name,
        tickets.desk_id, tickets.called_at
      FROM tickets
      JOIN services ON services.id = tickets.service_id
      WHERE tickets.date_key = ? AND tickets.status = 'called'
      ORDER BY tickets.called_at DESC
    `,
    )
    .all(dateKey) as {
    id: string;
    number: string;
    service_id: string;
    service_name: string;
    desk_id: string;
    called_at: number;
  }[];
  const waitingCounts = database
    .prepare(
      `
      SELECT service_id, COUNT(*) AS count FROM tickets
      WHERE date_key = ? AND status = 'waiting' GROUP BY service_id
    `,
    )
    .all(dateKey) as { service_id: string; count: number }[];
  const countByService = new Map(
    waitingCounts.map((row) => [row.service_id, row.count]),
  );
  const calledByDesk = new Map(
    calledTickets.map((ticket) => [ticket.desk_id, ticket]),
  );
  const openDeskCount = Math.max(
    1,
    deskRows.filter((desk) => !calledByDesk.has(desk.id)).length,
  );

  return {
    date: dateKey,
    dateLabel: new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      timeZone: "Asia/Jakarta",
    }).format(new Date(`${dateKey}T00:00:00+07:00`)),
    services: services.map((service) => {
      const waitingCount = countByService.get(service.id) ?? 0;
      return {
        id: service.id,
        name: service.name,
        prefix: service.prefix,
        description: service.description,
        waitingCount,
        estimatedWaitMinutes: estimateWait(
          waitingCount,
          service.average_minutes,
          openDeskCount,
        ),
      };
    }),
    desks: deskRows.map((desk) => {
      const ticket = calledByDesk.get(desk.id);
      return {
        id: desk.id,
        label: desk.label,
        currentTicket: ticket
          ? {
              id: ticket.id,
              number: ticket.number,
              serviceId: ticket.service_id,
              serviceName: ticket.service_name,
              calledAt: ticket.called_at,
            }
          : null,
      };
    }),
    recentCalls: calledTickets.slice(0, 6).map((ticket) => ({
      number: ticket.number,
      serviceName: ticket.service_name,
      deskLabel:
        deskRows.find((desk) => desk.id === ticket.desk_id)?.label ?? "Loket",
      calledAt: ticket.called_at,
    })),
  };
}

export function getStaffQueueState() {
  const dateKey = getJakartaDateKey();
  const waitingTickets = database
    .prepare(
      `
    SELECT tickets.id, tickets.number, tickets.service_id AS serviceId,
      services.name AS serviceName, tickets.created_at AS createdAt
    FROM tickets
    JOIN services ON services.id = tickets.service_id
    WHERE tickets.date_key = ? AND tickets.status = 'waiting'
    ORDER BY tickets.created_at, tickets.sequence_number
  `,
    )
    .all(dateKey) as {
    id: string;
    number: string;
    serviceId: string;
    serviceName: string;
    createdAt: number;
  }[];
  const completedCount = (
    database
      .prepare(
        `
    SELECT COUNT(*) AS count FROM tickets
    WHERE date_key = ? AND status = 'completed'
  `,
      )
      .get(dateKey) as { count: number }
  ).count;

  return { ...getQueueState(), waitingTickets, completedCount };
}

export function createTicket(serviceId: string) {
  const dateKey = getJakartaDateKey();
  const create = database.transaction(() => {
    const service = database
      .prepare(
        "SELECT id, name, prefix FROM services WHERE id = ? AND active = 1",
      )
      .get(serviceId) as Pick<ServiceRow, "id" | "name" | "prefix"> | undefined;
    if (!service) throw new Error("Layanan tidak ditemukan atau sedang tutup.");

    const sequence = database
      .prepare(
        "SELECT COALESCE(MAX(sequence_number), 0) + 1 AS next FROM tickets WHERE service_id = ? AND date_key = ?",
      )
      .get(serviceId, dateKey) as { next: number };
    const number = `${service.prefix}-${String(sequence.next).padStart(3, "0")}`;
    const lookupToken = randomBytes(24).toString("base64url");
    const id = randomUUID();
    const createdAt = Date.now();

    database
      .prepare(
        `
      INSERT INTO tickets (id, lookup_token, date_key, sequence_number, number, service_id, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'waiting', ?)
    `,
      )
      .run(
        id,
        lookupToken,
        dateKey,
        sequence.next,
        number,
        serviceId,
        createdAt,
      );

    const aheadCount = (
      database
        .prepare(
          `
      SELECT COUNT(*) AS count FROM tickets
      WHERE service_id = ? AND date_key = ? AND status = 'waiting' AND sequence_number < ?
    `,
        )
        .get(serviceId, dateKey, sequence.next) as { count: number }
    ).count;
    const averageMinutes = (
      database
        .prepare("SELECT average_minutes FROM services WHERE id = ?")
        .get(serviceId) as { average_minutes: number }
    ).average_minutes;
    const availableDeskCount = getOpenDeskCount();

    return {
      token: lookupToken,
      number,
      serviceName: service.name,
      status: "waiting" as const,
      aheadCount,
      estimatedWaitMinutes: estimateWait(
        aheadCount,
        averageMinutes,
        availableDeskCount,
      ),
      createdAt,
    };
  });

  return create.immediate();
}

export function getTicket(lookupToken: string): QueueTicket | null {
  const dateKey = getJakartaDateKey();
  const ticket = database
    .prepare(
      `
    SELECT tickets.id, tickets.number, tickets.service_id, services.name AS service_name,
      services.average_minutes, tickets.status, tickets.desk_id, desks.label AS desk_label,
      tickets.created_at, tickets.sequence_number, tickets.called_at
    FROM tickets
    JOIN services ON services.id = tickets.service_id
    LEFT JOIN desks ON desks.id = tickets.desk_id
    WHERE tickets.lookup_token = ? AND tickets.date_key = ?
  `,
    )
    .get(lookupToken, dateKey) as
    | {
        id: string;
        number: string;
        service_id: string;
        service_name: string;
        average_minutes: number;
        status: TicketStatus;
        desk_id: string | null;
        desk_label: string | null;
        created_at: number;
        sequence_number: number;
        called_at: number | null;
      }
    | undefined;

  if (!ticket) return null;

  const aheadCount =
    ticket.status === "waiting"
      ? (
          database
            .prepare(
              `
        SELECT COUNT(*) AS count FROM tickets
        WHERE service_id = ? AND date_key = ? AND status = 'waiting'
            AND sequence_number < ?
          `,
            )
            .get(ticket.service_id, dateKey, ticket.sequence_number) as {
            count: number;
          }
        ).count
      : 0;
  return {
    id: ticket.id,
    number: ticket.number,
    serviceId: ticket.service_id,
    serviceName: ticket.service_name,
    status: ticket.status,
    deskId: ticket.desk_id,
    deskLabel: ticket.desk_label,
    createdAt: ticket.created_at,
    calledAt: ticket.called_at,
    aheadCount,
    estimatedWaitMinutes: estimateWait(
      aheadCount,
      ticket.average_minutes,
      getOpenDeskCount(),
    ),
  };
}

export function cancelTicket(lookupToken: string) {
  const result = database
    .prepare(
      `
    UPDATE tickets SET status = 'cancelled'
    WHERE lookup_token = ? AND date_key = ? AND status = 'waiting'
  `,
    )
    .run(lookupToken, getJakartaDateKey());
  return result.changes > 0;
}

export function controlQueue(input: {
  action: "call-next" | "complete" | "skip";
  serviceId?: string;
  deskId?: string;
  ticketId?: string;
}) {
  const change = database.transaction(() => {
    if (input.action === "call-next") {
      if (!input.serviceId || !input.deskId)
        throw new Error("Pilih layanan dan loket.");
      const desk = database
        .prepare("SELECT id FROM desks WHERE id = ? AND active = 1")
        .get(input.deskId);
      if (!desk) throw new Error("Loket tidak tersedia.");

      const occupied = database
        .prepare(
          `
        SELECT number FROM tickets WHERE desk_id = ? AND date_key = ? AND status = 'called'
      `,
        )
        .get(input.deskId, getJakartaDateKey()) as
        | { number: string }
        | undefined;
      if (occupied)
        throw new Error(`Selesaikan ${occupied.number} terlebih dahulu.`);

      const ticket = database
        .prepare(
          `
        SELECT id, number FROM tickets
        WHERE service_id = ? AND date_key = ? AND status = 'waiting'
        ORDER BY created_at, sequence_number LIMIT 1
      `,
        )
        .get(input.serviceId, getJakartaDateKey()) as
        | { id: string; number: string }
        | undefined;
      if (!ticket) throw new Error("Belum ada antrean untuk layanan ini.");

      database
        .prepare(
          `
        UPDATE tickets SET status = 'called', desk_id = ?, called_at = ? WHERE id = ?
      `,
        )
        .run(input.deskId, Date.now(), ticket.id);
      return { ...ticket, status: "called" as const };
    }

    if (!input.ticketId) throw new Error("Nomor antrean tidak valid.");
    const status = input.action === "complete" ? "completed" : "skipped";
    const result = database
      .prepare(
        `
      UPDATE tickets SET status = ?, completed_at = ?
      WHERE id = ? AND status = 'called'
    `,
      )
      .run(status, Date.now(), input.ticketId);
    if (result.changes === 0)
      throw new Error("Antrean sudah berubah atau tidak ditemukan.");
    return { id: input.ticketId, status };
  });

  return change.immediate();
}
