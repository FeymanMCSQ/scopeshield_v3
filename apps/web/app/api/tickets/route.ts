import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/authGuard';
import { tickets } from '@scopeshield/domain';
import { ticketWriter } from '@scopeshield/db';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const s = await requireSession();
    const body = await req.json();

    const ticket = await tickets.createTicketFromEvidence(ticketWriter, {
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

    return NextResponse.json({ ok: true, ticket }, { status: 201 });
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status === 401 ? 401 : 400;
    const message = e instanceof Error ? e.message : 'BAD_REQUEST';

    return NextResponse.json(
      { ok: false, error: message },
      { status }
    );
  }
}
