import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/authGuard';
import { tickets } from '@scopeshield/domain';
import { ticketRepo } from '@scopeshield/db';

export const runtime = 'nodejs';

function getOrigin(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return null;
  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  try {
    const s = await requireSession();
    const body = await req.json();

    const ticket = await tickets.createTicketFromEvidence(ticketRepo, {
      ownerUserId: s.userId,
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

    return NextResponse.json(
      { ok: false, error: message },
      { status }
    );
  }
}
