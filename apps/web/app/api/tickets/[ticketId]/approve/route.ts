import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { tickets } from '@scopeshield/domain';
import { ticketRepo } from '@scopeshield/db';

export const runtime = 'nodejs';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const s = await getCurrentUser();
    if (!s) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    // Ownership enforcement (simple, not perfect, but prevents obvious leakage)
    const existing = await ticketRepo.getTicketById(ticketId);
    if (!existing)
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND' },
        { status: 404 }
      );
    if (existing.ownerUserId !== s.id) {
      return NextResponse.json(
        { ok: false, error: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const ticket = await tickets.approveTicket(ticketRepo, ticketId);
    return NextResponse.json({ ok: true, ticket });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'BAD_REQUEST';
    return NextResponse.json(
      { ok: false, error: message },
      { status: 400 }
    );
  }
}
