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

  try {
    return Response.json(createTicket(serviceId), {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
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
