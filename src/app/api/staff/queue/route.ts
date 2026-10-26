import { isStaffAuthenticated } from "@/lib/auth";
import { controlQueue, getStaffQueueState } from "@/lib/queue";

export async function GET() {
  if (!(await isStaffAuthenticated())) {
    return Response.json({ error: "Sesi petugas berakhir." }, { status: 401 });
  }
  return Response.json(getStaffQueueState(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  if (!(await isStaffAuthenticated())) {
    return Response.json({ error: "Sesi petugas berakhir." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || !("action" in body)) {
    return Response.json(
      { error: "Tindakan antrean tidak valid." },
      { status: 400 },
    );
  }
  const action = body.action;
  if (action !== "call-next" && action !== "complete" && action !== "skip") {
    return Response.json(
      { error: "Tindakan antrean tidak valid." },
      { status: 400 },
    );
  }

  const serviceId =
    "serviceId" in body && typeof body.serviceId === "string"
      ? body.serviceId
      : undefined;
  const deskId =
    "deskId" in body && typeof body.deskId === "string"
      ? body.deskId
      : undefined;
  const ticketId =
    "ticketId" in body && typeof body.ticketId === "string"
      ? body.ticketId
      : undefined;

  try {
    const result = controlQueue({ action, serviceId, deskId, ticketId });
    return Response.json(
      { result, queue: getStaffQueueState() },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Tindakan antrean gagal.",
      },
      { status: 409 },
    );
  }
}
