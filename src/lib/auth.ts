import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { database } from "@/lib/db";

const cookieName = "print-queue-staff";
const sessionLifetimeSeconds = 60 * 60 * 8;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (
    process.env.NODE_ENV === "production" &&
    (!secret || secret.length < 32 || secret.startsWith("local-development-"))
  ) {
    throw new Error(
      "SESSION_SECRET production harus unik dan minimal 32 karakter.",
    );
  }
  return secret ?? "local-development-only-change-before-deploy";
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function verifyStaffPin(pin: string) {
  const expected = process.env.STAFF_PIN;
  if (
    process.env.NODE_ENV === "production" &&
    (!expected || !/^\d{8,12}$/.test(expected))
  ) {
    throw new Error(
      "STAFF_PIN production harus terdiri dari 8 sampai 12 digit.",
    );
  }
  return safeEqual(pin, expected ?? "246810");
}

function clientKey(clientAddress: string) {
  return createHmac("sha256", getSecret())
    .update(clientAddress)
    .digest("base64url");
}

export function registerStaffLoginAttempt(
  clientAddress: string,
  succeeded: boolean,
) {
  const now = Date.now();
  const cutoff = now - 15 * 60 * 1000;
  const key = clientKey(clientAddress);
  const record = database.transaction(() => {
    database
      .prepare("DELETE FROM staff_login_attempts WHERE attempted_at < ?")
      .run(cutoff);
    const attempts = (
      database
        .prepare(
          `
      SELECT COUNT(*) AS count FROM staff_login_attempts
      WHERE client_key = ? AND attempted_at >= ?
    `,
        )
        .get(key, cutoff) as { count: number }
    ).count;
    if (attempts >= 5) return false;

    if (succeeded) {
      database
        .prepare("DELETE FROM staff_login_attempts WHERE client_key = ?")
        .run(key);
      return true;
    }
    database
      .prepare(
        "INSERT INTO staff_login_attempts (client_key, attempted_at) VALUES (?, ?)",
      )
      .run(key, now);
    return true;
  });
  return record.immediate();
}

export async function createStaffSession() {
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const value = `${issuedAt}.${sign(issuedAt)}`;
  const cookieStore = await cookies();
  cookieStore.set(cookieName, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: sessionLifetimeSeconds,
  });
}

export async function clearStaffSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function isStaffAuthenticated() {
  const cookieStore = await cookies();
  const value = cookieStore.get(cookieName)?.value;
  if (!value) return false;

  const [issuedAt, signature] = value.split(".");
  const issuedAtSeconds = Number(issuedAt);
  if (!Number.isFinite(issuedAtSeconds)) return false;
  const age = Math.floor(Date.now() / 1000) - issuedAtSeconds;
  if (age < 0 || age > sessionLifetimeSeconds) return false;
  return safeEqual(signature ?? "", sign(issuedAt));
}
