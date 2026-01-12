import { NextResponse } from 'next/server';
import { getPublicTicketById } from '@scopeshield/db';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;
  if (!ticketId) {
    return NextResponse.json(
      { ok: false, error: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  const ticket = await getPublicTicketById(ticketId);
  if (!ticket) {
    return NextResponse.json(
      { ok: false, error: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, ticket });
}
