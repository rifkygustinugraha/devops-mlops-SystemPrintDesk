import { createTicket, getQueueState } from "@/lib/queue";

export async function GET() {
  return Response.json(getQueueState(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const serviceId =
    typeof body === "object" && body !== null && "serviceId" in body
      ? body.serviceId
      : undefined;
  if (typeof serviceId !== "string" || serviceId.length > 40) {
    return Response.json(
      { error: "Pilih layanan yang tersedia." },
      { status: 400 },
    );
  }

  const customerName =
    typeof body === "object" &&
    body !== null &&
    "customerName" in body &&
    typeof body.customerName === "string"
      ? body.customerName.trim()
      : "";
  const phoneNumber =
    typeof body === "object" &&
    body !== null &&
    "phoneNumber" in body &&
    typeof body.phoneNumber === "string"
      ? body.phoneNumber.trim()
      : "";
  if (customerName.length < 2 || customerName.length > 100) {
    return Response.json(
      { error: "Nama lengkap wajib diisi (2-100 karakter)." },
      { status: 400 },
    );
  }
  if (!/^\+?[0-9\s().-]{8,20}$/.test(phoneNumber)) {
    return Response.json(
      { error: "Nomor telepon/WhatsApp tidak valid." },
      { status: 400 },
    );
  }

  const reservationAt =
    typeof body === "object" &&
    body !== null &&
    "reservationAt" in body &&
    body.reservationAt !== null
      ? body.reservationAt
      : null;
  if (
    reservationAt !== null &&
    (typeof reservationAt !== "number" ||
      !Number.isSafeInteger(reservationAt) ||
      reservationAt <= Date.now())
  ) {
    return Response.json(
      { error: "Pilih slot reservasi yang masih tersedia." },
      { status: 400 },
    );
  }

  try {
    return Response.json(
      createTicket(serviceId, customerName, phoneNumber, reservationAt),
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nomor antrean gagal dibuat.",
      },
      { status: 400 },
    );
  }
}
