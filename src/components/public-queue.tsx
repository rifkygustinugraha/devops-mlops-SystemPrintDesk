"use client";

import {
  ArrowRight,
  Bell,
  BellRing,
  Check,
  Clock3,
  Printer,
  RefreshCw,
  TicketCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Service = {
  id: string;
  name: string;
  prefix: string;
  description: string;
  waitingCount: number;
  estimatedWaitMinutes: number;
};

type QueueState = {
  date: string;
  dateLabel: string;
  services: Service[];
  desks: {
    id: string;
    label: string;
    currentTicket: {
      number: string;
      serviceName: string;
      serviceId: string;
      calledAt: number;
    } | null;
  }[];
  recentCalls: {
    number: string;
    serviceName: string;
    deskLabel: string;
    calledAt: number;
  }[];
};

type Ticket = {
  token: string;
  number: string;
  serviceName: string;
};

type TicketStatus = {
  id: string;
  number: string;
  serviceName: string;
  status: "waiting" | "called" | "completed" | "skipped" | "cancelled";
  deskLabel: string | null;
  aheadCount: number;
  estimatedWaitMinutes: number;
};

const ticketStorageKey = "systemprint-ticket-v1";

function formatClock(timestamp: number) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(timestamp);
}

export function PublicQueue() {
  const [queue, setQueue] = useState<QueueState | null>(null);
  const [selectedService, setSelectedService] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [ticketStatus, setTicketStatus] = useState<TicketStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const previousStatus = useRef<TicketStatus["status"] | null>(null);

  async function refreshQueue() {
    try {
      const response = await fetch("/api/queue", { cache: "no-store" });
      if (!response.ok) throw new Error("Status antrean belum dapat dimuat.");
      const nextQueue = (await response.json()) as QueueState;
      setQueue(nextQueue);
      setSelectedService(
        (current) => current || nextQueue.services[0]?.id || "",
      );
    } catch {
      setMessage("Koneksi antrean terputus. Mencoba menyambungkan kembali.");
    }
  }

  useEffect(() => {
    const restoreTimeout = window.setTimeout(() => {
      const storedTicket = window.localStorage.getItem(ticketStorageKey);
      if (storedTicket) {
        try {
          setTicket(JSON.parse(storedTicket) as Ticket);
        } catch {
          window.localStorage.removeItem(ticketStorageKey);
        }
      }
    }, 0);
    const refreshTimeout = window.setTimeout(() => void refreshQueue(), 0);
    const interval = window.setInterval(() => void refreshQueue(), 8000);
    return () => {
      window.clearTimeout(restoreTimeout);
      window.clearTimeout(refreshTimeout);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!ticket) {
      previousStatus.current = null;
      return;
    }

    let active = true;
    const refreshTicket = async () => {
      try {
        const response = await fetch(`/api/tickets/${ticket.token}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          if (active && response.status === 404) {
            window.localStorage.removeItem(ticketStorageKey);
            setTicket(null);
            setTicketStatus(null);
            setMessage("Tiket sebelumnya sudah tidak aktif.");
          }
          return;
        }
        const nextStatus = (await response.json()) as TicketStatus;
        if (!active) return;
        if (
          previousStatus.current === "waiting" &&
          nextStatus.status === "called"
        ) {
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification(`Antrean ${nextStatus.number}`, {
              body: `Silakan menuju ${nextStatus.deskLabel ?? "loket"}.`,
              tag: nextStatus.id,
            });
          }
        }
        previousStatus.current = nextStatus.status;
        setTicketStatus(nextStatus);
      } catch {
        // The regular queue refresh will report connectivity issues.
      }
    };

    void refreshTicket();
    const interval = window.setInterval(() => void refreshTicket(), 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [ticket]);

  async function takeTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedService || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService,
          customerName,
          phoneNumber,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Nomor antrean gagal dibuat.");
      const savedTicket = {
        token: result.token as string,
        number: result.number as string,
        serviceName: result.serviceName as string,
      };
      window.localStorage.setItem(
        ticketStorageKey,
        JSON.stringify(savedTicket),
      );
      previousStatus.current = null;
      setTicketStatus(null);
      setTicket(savedTicket);
      setCustomerFormOpen(false);
      setCustomerName("");
      setPhoneNumber("");
      await refreshQueue();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Nomor antrean gagal dibuat.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function cancelTicket() {
    if (!ticket || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.token}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Antrean tidak dapat dibatalkan.");
      window.localStorage.removeItem(ticketStorageKey);
      setTicket(null);
      setTicketStatus(null);
      setMessage("Antrean berhasil dibatalkan.");
      await refreshQueue();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Antrean tidak dapat dibatalkan.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setMessage("Browser ini belum mendukung notifikasi.");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
    if (permission !== "granted")
      setMessage("Izin notifikasi belum diaktifkan.");
  }

  const activeCalls = queue?.desks.filter((desk) => desk.currentTicket) ?? [];
  const selected = queue?.services.find(
    (service) => service.id === selectedService,
  );
  const completedTicket =
    ticketStatus &&
    ["completed", "skipped", "cancelled"].includes(ticketStatus.status);

  function clearTicket() {
    window.localStorage.removeItem(ticketStorageKey);
    setTicket(null);
    setTicketStatus(null);
    setMessage("");
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="PrintDesk, beranda">
          <span className="brand-mark">
            <Printer size={21} strokeWidth={2.2} />
          </span>
          <span className="brand-copy">
            <strong>printdesk</strong>
            <small>LAYANAN CETAK KAMPUS</small>
          </span>
        </Link>
        <div className="topbar-right">
          <span className="open-indicator">
            <i /> LAYANAN AKTIF
          </span>
          <Link className="staff-link" href="/petugas">
            Masuk petugas <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <section className="page-heading">
        <div>
          <p className="eyebrow">
            <span>01</span> ANTREAN DIGITAL · KAMPUS
          </p>
          <h1>
            Ambil nomor,
            <br />
            <em>lanjutkan harimu.</em>
          </h1>
          <p className="heading-note">
            Pilih layanan cetak. Kami kabari saat giliranmu tiba.
          </p>
        </div>
        <div className="today-stamp">
          <span>HARI INI</span>
          <strong>{queue?.dateLabel ?? "Memuat..."}</strong>
          <small>Antrean aktif hari ini</small>
        </div>
      </section>

      {message && (
        <div className="notice" role="status">
          <span>{message}</span>
          <button aria-label="Tutup pesan" onClick={() => setMessage("")}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="student-layout">
        <section className="service-panel" aria-labelledby="service-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PILIH KEBUTUHAN</p>
              <h2 id="service-title">Mau cetak apa?</h2>
            </div>
            <span className="live-caption">
              <i /> LANGSUNG
            </span>
          </div>

          {ticket && !completedTicket ? (
            <TicketPanel
              ticket={ticket}
              status={ticketStatus}
              busy={busy}
              notificationsEnabled={notificationsEnabled}
              onCancel={cancelTicket}
              onEnableNotifications={enableNotifications}
            />
          ) : ticket ? (
            <div className="ticket-finished">
              <span className="ticket-icon">
                <Check size={22} />
              </span>
              <div>
                <strong>
                  {ticketStatus?.status === "completed"
                    ? "Pesanan selesai"
                    : "Antrean berakhir"}
                </strong>
                <p>
                  {ticket.number} · {ticket.serviceName}
                </p>
              </div>
              <button className="text-button" onClick={clearTicket}>
                Tutup
              </button>
            </div>
          ) : (
            <>
              <div
                className="service-list"
                role="radiogroup"
                aria-label="Pilih layanan"
              >
                {queue?.services.map((service, index) => (
                  <button
                    key={service.id}
                    className={`service-option ${selectedService === service.id ? "is-selected" : ""}`}
                    role="radio"
                    aria-checked={selectedService === service.id}
                    onClick={() => setSelectedService(service.id)}
                  >
                    <span className="service-index">0{index + 1}</span>
                    <span className="service-copy">
                      <strong>{service.name}</strong>
                      <small>{service.description}</small>
                    </span>
                    <span className="service-wait">
                      <strong>
                        {service.estimatedWaitMinutes}
                        <small> mnt</small>
                      </strong>
                      <small>{service.waitingCount} menunggu</small>
                    </span>
                    <span className="radio-mark" aria-hidden="true">
                      <i />
                    </span>
                  </button>
                )) ?? (
                  <div className="loading-row">
                    <RefreshCw size={16} className="spin" /> Memuat layanan...
                  </div>
                )}
              </div>
              <div className="take-row">
                <div className="estimate-copy">
                  <Clock3 size={16} />
                  <span>
                    Estimasi menunggu
                    <strong>
                      {selected?.estimatedWaitMinutes ?? "—"} menit
                    </strong>
                  </span>
                </div>
                <button
                  className="primary-button"
                  onClick={() => setCustomerFormOpen(true)}
                  disabled={!selectedService || busy}
                >
                  {busy ? "Menyiapkan..." : "Ambil nomor antrean"}
                  <ArrowRight size={17} />
                </button>
              </div>
            </>
          )}
        </section>

        <aside className="queue-aside" aria-label="Informasi antrean berjalan">
          <div className="aside-topline">
            <span>
              <i /> PANGGILAN BERJALAN
            </span>
            <RefreshCw size={15} />
          </div>
          {activeCalls.length > 0 ? (
            <div className="active-call-list">
              {activeCalls.map((desk) => (
                <div className="active-call" key={desk.id}>
                  <span className="call-number">
                    {desk.currentTicket?.number}
                  </span>
                  <span className="call-details">
                    <strong>{desk.currentTicket?.serviceName}</strong>
                    <small>{desk.label}</small>
                  </span>
                  <ArrowRight size={17} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-call">
              <span className="empty-call-mark">—</span>
              <strong>Belum ada panggilan</strong>
              <small>Nomor berikutnya akan tampil di sini.</small>
            </div>
          )}
          <div className="aside-divider" />
          <div className="aside-bottomline">
            <span>ANTREAN MENUNGGU</span>
            <strong>
              {queue?.services.reduce(
                (sum, service) => sum + service.waitingCount,
                0,
              ) ?? "—"}
              <small> nomor</small>
            </strong>
          </div>
          <div className="call-history-heading">
            <span>BARU DIPANGGIL</span>
          </div>
          <div className="call-history">
            {queue?.recentCalls.length ? (
              queue.recentCalls.slice(0, 3).map((call) => (
                <div
                  className="history-row"
                  key={`${call.number}-${call.calledAt}`}
                >
                  <strong>{call.number}</strong>
                  <span>{call.deskLabel}</span>
                  <small>{formatClock(call.calledAt)}</small>
                </div>
              ))
            ) : (
              <p className="history-empty">
                Panggilan terbaru akan muncul di sini.
              </p>
            )}
          </div>
          <p className="privacy-note">
            <TicketCheck size={14} /> Nomor antrean tersimpan di perangkat ini.
          </p>
        </aside>
      </div>

      {customerFormOpen && (
        <div className="modal-backdrop" role="presentation">
          <form
            className="customer-modal"
            onSubmit={takeTicket}
            aria-labelledby="customer-modal-title"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">DATA PEMESAN</p>
                <h2 id="customer-modal-title">Sebelum ambil nomor</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                aria-label="Tutup formulir"
                onClick={() => setCustomerFormOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <p className="modal-description">
              Isi data berikut agar petugas dapat menghubungi Anda bila
              diperlukan.
            </p>
            <label className="form-field">
              <span>Nama lengkap</span>
              <input
                autoFocus
                required
                minLength={2}
                maxLength={100}
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Masukkan nama lengkap"
              />
            </label>
            <label className="form-field">
              <span>Nomor telepon / WhatsApp</span>
              <input
                required
                type="tel"
                maxLength={20}
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="Contoh: 081234567890"
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setCustomerFormOpen(false)}
              >
                Batal
              </button>
              <button type="submit" className="primary-button" disabled={busy}>
                {busy ? "Menyiapkan..." : "Konfirmasi & ambil nomor"}
                <ArrowRight size={17} />
              </button>
            </div>
          </form>
        </div>
      )}

      <footer className="page-footer">
        <span>PRINTDESK · PUSAT LAYANAN CETAK</span>
        <span>
          Data antrean diperbarui otomatis <i />
        </span>
      </footer>
    </main>
  );
}

function TicketPanel({
  ticket,
  status,
  busy,
  notificationsEnabled,
  onCancel,
  onEnableNotifications,
}: {
  ticket: Ticket;
  status: TicketStatus | null;
  busy: boolean;
  notificationsEnabled: boolean;
  onCancel: () => void;
  onEnableNotifications: () => void;
}) {
  const isCalled = status?.status === "called";
  return (
    <div className={`ticket-panel ${isCalled ? "ticket-called" : ""}`}>
      <div className="ticket-topline">
        <span>
          <i /> {isCalled ? "GILIRANMU SEKARANG" : "NOMOR ANTREANMU"}
        </span>
        <TicketCheck size={17} />
      </div>
      <div className="ticket-number">{ticket.number}</div>
      <div className="ticket-service-name">
        {ticket.serviceName}
        {status?.deskLabel ? <strong>· {status.deskLabel}</strong> : null}
      </div>
      <div className="ticket-stats">
        <div>
          <small>DI DEPANMU</small>
          <strong>
            {status?.aheadCount ?? "—"}
            <span> orang</span>
          </strong>
        </div>
        <div>
          <small>ESTIMASI TUNGGU</small>
          <strong>
            {status?.estimatedWaitMinutes ?? "—"}
            <span> menit</span>
          </strong>
        </div>
      </div>
      <div className="ticket-actions">
        <button
          className="notification-button"
          onClick={onEnableNotifications}
          disabled={notificationsEnabled}
        >
          {notificationsEnabled ? <BellRing size={16} /> : <Bell size={16} />}
          {notificationsEnabled ? "Notifikasi aktif" : "Aktifkan notifikasi"}
        </button>
        {!isCalled && (
          <button className="cancel-button" onClick={onCancel} disabled={busy}>
            Batalkan
          </button>
        )}
      </div>
      <p className="ticket-footnote">
        Biarkan halaman ini terbuka agar status dan notifikasi tetap diperbarui.
      </p>
    </div>
  );
}
