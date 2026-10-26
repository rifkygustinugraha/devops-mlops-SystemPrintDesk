import {
  clearStaffSession,
  createStaffSession,
  isStaffAuthenticated,
  registerStaffLoginAttempt,
  verifyStaffPin,
} from "@/lib/auth";

export async function GET() {
  return Response.json(
    { authenticated: await isStaffAuthenticated() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const clientAddress =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const pin =
    typeof body === "object" && body !== null && "pin" in body
      ? body.pin
      : undefined;
  const validPin =
    typeof pin === "string" && pin.length <= 64 && verifyStaffPin(pin);
  const allowed = registerStaffLoginAttempt(clientAddress, validPin);
  if (!allowed) {
    return Response.json(
      { error: "Terlalu banyak percobaan. Coba lagi 15 menit lagi." },
      { status: 429, headers: { "Retry-After": "900" } },
    );
  }
  if (!validPin) {
    return Response.json({ error: "PIN tidak sesuai." }, { status: 401 });
  }

  await createStaffSession();
  return Response.json({ authenticated: true });
}

export async function DELETE() {
  await clearStaffSession();
  return Response.json({ authenticated: false });
}
