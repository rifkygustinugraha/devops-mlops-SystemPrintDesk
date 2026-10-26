import { cancelTicket, getTicket } from "@/lib/queue";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!/^[A-Za-z0-9_-]{32}$/.test(token)) {
    return Response.json({ error: "Tiket tidak ditemukan." }, { status: 404 });
  }

  const ticket = getTicket(token);
  if (!ticket)
    return Response.json({ error: "Tiket tidak ditemukan." }, { status: 404 });
  return Response.json(ticket, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!/^[A-Za-z0-9_-]{32}$/.test(token) || !cancelTicket(token)) {
    return Response.json(
      { error: "Antrean tidak dapat dibatalkan." },
      { status: 409 },
    );
  }
  return Response.json({ cancelled: true });
}
