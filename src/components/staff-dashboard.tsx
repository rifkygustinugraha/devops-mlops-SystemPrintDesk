"use client";

import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  DoorOpen,
  LockKeyhole,
  LogIn,
  LogOut,
  MonitorCheck,
  Printer,
  RefreshCw,
  SkipForward,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type QueueState = {
  services: {
    id: string;
    name: string;
    prefix: string;
    description: string;
    waitingCount: number;
    estimatedWaitMinutes: number;
    displayWaitingCount: number | null;
    displayWaitMinutes: number | null;
  }[];
  desks: {
    id: string;
    label: string;
    currentTicket: {
      id: string;
      number: string;
      serviceId: string;
      serviceName: string;
      calledAt: number;
    } | null;
  }[];
  recentCalls: {
    number: string;
    serviceName: string;
    deskLabel: string;
    calledAt: number;
  }[];
  waitingTickets: {
    id: string;
    number: string;
    serviceId: string;
    serviceName: string;
    customerName: string;
    phoneNumber: string;
    createdAt: number;
  }[];
  completedCount: number;
};

function formatClock(timestamp: number) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(timestamp);
}

export function StaffDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [pin, setPin] = useState("");
  const [queue, setQueue] = useState<QueueState | null>(null);
  const [selectedService, setSelectedService] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [displayWaitingCount, setDisplayWaitingCount] = useState("");
  const [displayWaitMinutes, setDisplayWaitMinutes] = useState("");

  async function loadQueue() {
    const response = await fetch("/api/staff/queue", { cache: "no-store" });
    if (response.status === 401) {
      setAuthenticated(false);
      return;
    }
    if (!response.ok) throw new Error("Data antrean gagal dimuat.");
    const nextQueue = (await response.json()) as QueueState;
    setQueue(nextQueue);
    setSelectedService((current) => {
      const nextSelected = current || nextQueue.services[0]?.id || "";
      if (!current) {
        const service = nextQueue.services.find(
          (item) => item.id === nextSelected,
        );
        setDisplayWaitingCount(
          service?.displayWaitingCount == null
            ? ""
            : String(service.displayWaitingCount),
        );
        setDisplayWaitMinutes(
          service?.displayWaitMinutes == null
            ? ""
            : String(service.displayWaitMinutes),
        );
      }
      return nextSelected;
    });
  }

  useEffect(() => {
    let active = true;
    fetch("/api/staff/session", { cache: "no-store" })
      .then((response) => response.json())
      .then(async (result: { authenticated: boolean }) => {
        if (!active) return;
        setAuthenticated(result.authenticated);
        if (result.authenticated) await loadQueue();
      })
      .catch(() => setMessage("Tidak dapat menghubungi server antrean."))
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const interval = window.setInterval(() => {
      void loadQueue().catch(() =>
        setMessage("Koneksi terputus. Data akan dicoba ulang."),
      );
    }, 5000);
    return () => window.clearInterval(interval);
  }, [authenticated]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !pin) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/staff/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "PIN tidak sesuai.");
      setAuthenticated(true);
      setPin("");
      await loadQueue();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/staff/session", { method: "DELETE" });
    setAuthenticated(false);
    setQueue(null);
  }

  async function runAction(body: {
    action: "call-next" | "complete" | "skip" | "update-display";
    serviceId?: string;
    deskId?: string;
    ticketId?: string;
    waitingCount?: number | null;
    waitMinutes?: number | null;
  }) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/staff/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (response.status === 401) {
        setAuthenticated(false);
        throw new Error("Sesi berakhir. Silakan masuk kembali.");
      }

      if (!response.ok)
        throw new Error(result.error ?? "Tindakan antrean gagal.");
      setQueue(result.queue as QueueState);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Tindakan antrean gagal.",
      );
    } finally {
      setBusy(false);
    }
  }

  function selectDisplayService(serviceId: string) {
    setSelectedService(serviceId);
    const service = queue?.services.find((item) => item.id === serviceId);
    setDisplayWaitingCount(
      service?.displayWaitingCount == null
        ? ""
        : String(service.displayWaitingCount),
    );
    setDisplayWaitMinutes(
      service?.displayWaitMinutes == null
        ? ""
        : String(service.displayWaitMinutes),
    );
  }

  async function saveDisplaySettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const waitingCount =
      displayWaitingCount === "" ? null : Number(displayWaitingCount);
    const waitMinutes =
      displayWaitMinutes === "" ? null : Number(displayWaitMinutes);
    await runAction({
      action: "update-display",
      serviceId: selectedService,
      waitingCount,
      waitMinutes,
    });
  }

  const activeCount =
    queue?.desks.filter((desk) => desk.currentTicket).length ?? 0;
  const selectedServiceHasTickets =
    queue?.waitingTickets.some(
      (ticket) => ticket.serviceId === selectedService,
    ) ?? false;

  return (
    <main className="staff-shell">
      <header className="topbar staff-topbar">
        <Link className="brand" href="/" aria-label="PrintDesk, beranda">
          <span className="brand-mark">
            <Printer size={21} strokeWidth={2.2} />
          </span>
          <span className="brand-copy">
            <strong>printdesk</strong>
            <small>PANEL PETUGAS</small>
          </span>
        </Link>
        <div className="topbar-right">
          <Link className="staff-link" href="/">
            <ArrowLeft size={15} /> Layar mahasiswa
          </Link>
          {authenticated && (
            <button className="logout-button" onClick={logout}>
              <LogOut size={15} /> Keluar
            </button>
          )}
        </div>
      </header>

      {checkingSession ? (
        <div className="staff-loading">
          <RefreshCw size={18} className="spin" /> Memeriksa sesi...
        </div>
      ) : !authenticated ? (
        <section className="login-layout">
          <div className="login-aside">
            <p className="eyebrow">
              <span>AREA TERBATAS</span> · PETUGAS
            </p>
            <h1>
              Ritme layanan
              <br />
              <em>ada di tanganmu.</em>
            </h1>
            <p>
              Kelola antrean aktif, panggilan loket, dan alur layanan cetak
              kampus.
            </p>
            <div className="login-illustration">
              <span className="illustration-line line-one" />
              <span className="illustration-line line-two" />
              <span className="illustration-ticket">
                <Printer size={25} />
                <strong>F-024</strong>
                <small>PRINTDESK</small>
              </span>
              <span className="illustration-dot dot-one" />
              <span className="illustration-dot dot-two" />
            </div>
          </div>
          <form className="login-form" onSubmit={login}>
            <span className="login-lock">
              <LockKeyhole size={21} />
            </span>
            <p className="eyebrow">SELAMAT DATANG KEMBALI</p>
            <h2>Masuk ke panel</h2>
            <label htmlFor="staff-pin">PIN petugas</label>
            <input
              id="staff-pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={64}
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="Masukkan PIN"
              required
            />
            {message && (
              <p className="form-error" role="alert">
                {message}
              </p>
            )}
            <button
              className="primary-button login-submit"
              disabled={busy || !pin}
            >
              {busy ? "Memeriksa..." : "Masuk"}
              <LogIn size={17} />
            </button>
            <small className="login-security">
              <LockKeyhole size={13} /> Sesi aman, berakhir otomatis setelah 8
              jam.
            </small>
          </form>
        </section>
      ) : (
        <div className="dashboard-wrap">
          <section className="dashboard-heading">
            <div>
              <p className="eyebrow">
                <span>RUANG OPERASIONAL</span> · HARI INI
              </p>
              <h1>Selamat bertugas.</h1>
              <p>Pantau antrean dan jaga layanan tetap bergerak.</p>
            </div>
            <div className="dashboard-live">
              <i /> SINKRON LANGSUNG{" "}
              <span>
                <RefreshCw size={13} /> 5 dtk
              </span>
            </div>
          </section>

          {message && (
            <div className="notice staff-notice" role="status">
              <span>{message}</span>
              <button aria-label="Tutup pesan" onClick={() => setMessage("")}>
                <X size={16} />
              </button>
            </div>
          )}

          <section className="metric-row" aria-label="Ringkasan antrean">
            <div className="metric">
              <span className="metric-icon metric-icon-green">
                <Users size={18} />
              </span>
              <span className="metric-label">MENUNGGU</span>
              <strong>
                {queue?.waitingTickets.length ?? "—"}
                <small>orang</small>
              </strong>
              <span className="metric-foot">Semua layanan</span>
            </div>
            <div className="metric">
              <span className="metric-icon metric-icon-orange">
                <MonitorCheck size={18} />
              </span>
              <span className="metric-label">DILAYANI</span>
              <strong>
                {activeCount}
                <small>loket aktif</small>
              </strong>
              <span className="metric-foot">Sedang berlangsung</span>
            </div>
            <div className="metric">
              <span className="metric-icon metric-icon-blue">
                <Check size={18} />
              </span>
              <span className="metric-label">SELESAI HARI INI</span>
              <strong>
                {queue?.completedCount ?? "—"}
                <small>pesanan</small>
              </strong>
              <span className="metric-foot">Berhasil diselesaikan</span>
            </div>
          </section>

          <section className="desk-section">
            <div className="dashboard-section-heading">
              <div>
                <p className="eyebrow">KENDALI LOKET</p>
                <h2>Loket layanan</h2>
              </div>
              <span className="dashboard-count">
                {queue?.desks.length ?? 0} LOKET
              </span>
            </div>
            <div className="desk-grid">
              {queue?.desks.map((desk) => (
                <article
                  className={`desk-card ${desk.currentTicket ? "desk-busy" : ""}`}
                  key={desk.id}
                >
                  <div className="desk-card-head">
                    <span>
                      <DoorOpen size={16} /> {desk.label}
                    </span>
                    <span
                      className={`desk-state ${desk.currentTicket ? "is-busy" : ""}`}
                    >
                      <i /> {desk.currentTicket ? "MELAYANI" : "TERSEDIA"}
                    </span>
                  </div>
                  {desk.currentTicket ? (
                    <div className="desk-ticket">
                      <span className="desk-number">
                        {desk.currentTicket.number}
                      </span>
                      <span className="desk-service">
                        {desk.currentTicket.serviceName}
                        <small>
                          Dipanggil {formatClock(desk.currentTicket.calledAt)}
                        </small>
                      </span>
                    </div>
                  ) : (
                    <div className="desk-empty">
                      <span>—</span>
                      <strong>Siap melayani</strong>
                    </div>
                  )}
                  {desk.currentTicket ? (
                    <div className="desk-actions">
                      <button
                        className="complete-button"
                        disabled={busy}
                        onClick={() =>
                          runAction({
                            action: "complete",
                            ticketId: desk.currentTicket!.id,
                          })
                        }
                      >
                        <Check size={15} /> Selesai
                      </button>
                      <button
                        className="skip-button"
                        disabled={busy}
                        onClick={() =>
                          runAction({
                            action: "skip",
                            ticketId: desk.currentTicket!.id,
                          })
                        }
                      >
                        <SkipForward size={15} /> Lewati
                      </button>
                    </div>
                  ) : (
                    <div className="call-controls">
                      <label className="select-field">
                        <span className="sr-only">
                          Pilih layanan {desk.label}
                        </span>
                        <select
                          value={selectedService}
                          onChange={(event) =>
                            selectDisplayService(event.target.value)
                          }
                        >
                          {queue?.services.map((service) => (
                            <option value={service.id} key={service.id}>
                              {service.name} · {service.waitingCount}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} />
                      </label>
                      <button
                        className="call-button"
                        disabled={
                          busy ||
                          !selectedService ||
                          !selectedServiceHasTickets
                        }
                        onClick={() =>
                          runAction({
                            action: "call-next",
                            serviceId: selectedService,
                            deskId: desk.id,
                          })
                        }
                      >
                        Panggil berikutnya <ArrowRight size={15} />
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="display-settings">
            <div className="dashboard-section-heading">
              <div>
                <p className="eyebrow">INFORMASI PUBLIK</p>
                <h2>Atur antrean yang ditampilkan</h2>
              </div>
            </div>
            <form className="display-settings-form" onSubmit={saveDisplaySettings}>
              <label>
                <span>Layanan</span>
                <select
                  value={selectedService}
                  onChange={(event) => selectDisplayService(event.target.value)}
                >
                  {queue?.services.map((service) => (
                    <option value={service.id} key={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Orang di depan</span>
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={displayWaitingCount}
                  onChange={(event) => setDisplayWaitingCount(event.target.value)}
                  placeholder="Otomatis"
                />
              </label>
              <label>
                <span>Estimasi (menit)</span>
                <input
                  type="number"
                  min={0}
                  max={1440}
                  value={displayWaitMinutes}
                  onChange={(event) => setDisplayWaitMinutes(event.target.value)}
                  placeholder="Otomatis"
                />
              </label>
              <button className="primary-button" disabled={busy || !selectedService}>
                Simpan informasi
              </button>
            </form>
            <p className="display-settings-help">
              Kosongkan salah satu kolom untuk kembali menggunakan perhitungan otomatis dari tiket.
            </p>
          </section>

          <section className="waiting-section">
            <div className="dashboard-section-heading">
              <div>
                <p className="eyebrow">URUTAN MASUK</p>
                <h2>Daftar menunggu</h2>
              </div>
              <span className="dashboard-count">
                {queue?.waitingTickets.length ?? 0} NOMOR
              </span>
            </div>
            <div className="waiting-table-wrap">
              <table className="waiting-table">
                <thead>
                  <tr>
                    <th>NO. ANTREAN</th>
                    <th>LAYANAN</th>
                    <th>PELANGGAN</th>
                    <th>MASUK</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {queue?.waitingTickets.length ? (
                    queue.waitingTickets.map((ticket, index) => (
                      <tr key={ticket.id}>
                        <td>
                          <span className="table-position">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <strong>{ticket.number}</strong>
                        </td>
                        <td>{ticket.serviceName}</td>
                        <td>
                          <strong>{ticket.customerName || "—"}</strong>
                          <small className="table-customer-phone">
                            {ticket.phoneNumber || "Nomor tidak tersedia"}
                          </small>
                        </td>
                        <td>
                          <Clock3 size={14} /> {formatClock(ticket.createdAt)}
                        </td>
                        <td>
                          <span className="waiting-badge">
                            <i /> Menunggu
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="table-empty" colSpan={5}>
                        <ArrowDownToLine size={18} /> Belum ada nomor yang
                        menunggu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="page-footer">
            <span>PRINTDESK · PANEL OPERASIONAL</span>
            <span>
              <RefreshCw size={13} /> DATA DIPERBARUI OTOMATIS <i />
            </span>
          </footer>
        </div>
      )}
    </main>
  );
}
