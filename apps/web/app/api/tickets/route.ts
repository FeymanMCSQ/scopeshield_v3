import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { tickets } from '@scopeshield/domain';
import { ticketRepo, listTicketsForOwner } from '@scopeshield/db';

export const runtime = 'nodejs';

function getOrigin(req: Request) {
  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!host) return null;
  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  try {
    const s = await getCurrentUser();
    if (!s) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();

    const ticket = await tickets.createTicketFromEvidence(ticketRepo, {
      ownerUserId: s.id,
      evidence: {
        platform: body.platform,
        text: body.text,
        evidenceAt: new Date(body.evidenceAt),
        evidenceUrl: body.evidenceUrl,
        assetUrl: body.assetUrl,
      },
      pricing: body.pricing,
    });

    const origin = getOrigin(req);
    const sharePath = `/t/${ticket.id}`;
    const shareUrl = origin ? `${origin}${sharePath}` : sharePath;

    return NextResponse.json({ ok: true, ticket, shareUrl }, { status: 201 });
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status === 401 ? 401 : 400;
    const message = e instanceof Error ? e.message : 'BAD_REQUEST';

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}


function parseLimit(v: string | null): number {
  if (!v) return 20;
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw new Error('BAD_LIMIT');
  if (n < 1 || n > 100) throw new Error('BAD_LIMIT');
  return n;
}

export async function GET(req: Request) {
  try {
    const s = await getCurrentUser();
    if (!s) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const limit = parseLimit(url.searchParams.get('limit'));
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const status = url.searchParams.get('status') ?? undefined;

    // Optional status filter, but keep it strict.
    if (status && !tickets.isTicketStatus(status)) {
      return NextResponse.json(
        { ok: false, error: 'BAD_STATUS' },
        { status: 400 }
      );
    }

    const { items, nextCursor } = await listTicketsForOwner({
      ownerUserId: s.id,
      limit,
      cursor,
      status: status as tickets.TicketStatus,
    });

    return NextResponse.json(
      {
        ok: true,
        items,
        nextCursor,
      },
      { status: 200 }
    );
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status === 401 ? 401 : 400;
    const message = e instanceof Error ? e.message : 'UNKNOWN_ERROR';
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
