import Database, { type Database as DatabaseType } from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

const globalForDatabase = globalThis as typeof globalThis & {
  queueDatabase?: DatabaseType;
};

function createDatabase() {
  const dataDirectory = path.join(process.cwd(), "data");
  mkdirSync(dataDirectory, { recursive: true });

  const database = new Database(path.join(dataDirectory, "queue.db"));
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  database.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      prefix TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      average_minutes INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS desks (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      lookup_token TEXT NOT NULL UNIQUE,
      date_key TEXT NOT NULL,
      sequence_number INTEGER NOT NULL,
      number TEXT NOT NULL,
      service_id TEXT NOT NULL REFERENCES services(id),
      status TEXT NOT NULL CHECK (status IN ('waiting', 'called', 'completed', 'skipped', 'cancelled')),
      desk_id TEXT REFERENCES desks(id),
      created_at INTEGER NOT NULL,
      called_at INTEGER,
      completed_at INTEGER,
      UNIQUE (service_id, date_key, sequence_number)
    );

    CREATE INDEX IF NOT EXISTS tickets_queue_order
      ON tickets(service_id, date_key, status, created_at, sequence_number);
    CREATE INDEX IF NOT EXISTS tickets_lookup
      ON tickets(lookup_token);

    CREATE TABLE IF NOT EXISTS staff_login_attempts (
      client_key TEXT NOT NULL,
      attempted_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS staff_login_window
      ON staff_login_attempts(client_key, attempted_at);
  `);

  const seedService = database.prepare(`
    INSERT OR IGNORE INTO services (id, name, prefix, description, average_minutes)
    VALUES (?, ?, ?, ?, ?)
  `);
  seedService.run("photocopy", "Fotokopi", "F", "Hitam putih atau berwarna", 3);
  seedService.run("print", "Cetak dokumen", "C", "Cetak dari file PDF", 4);
  seedService.run(
    "binding",
    "Jilid & laminasi",
    "J",
    "Jilid, sampul, dan laminasi",
    8,
  );
  seedService.run("scan", "Pindai dokumen", "S", "Pindai ke format digital", 5);

  const seedDesk = database.prepare(
    "INSERT OR IGNORE INTO desks (id, label) VALUES (?, ?)",
  );
  seedDesk.run("desk-1", "Loket 1");
  seedDesk.run("desk-2", "Loket 2");
  seedDesk.run("desk-3", "Loket 3");

  return database;
}

export const database = globalForDatabase.queueDatabase ?? createDatabase();

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.queueDatabase = database;
}

export function getJakartaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}
