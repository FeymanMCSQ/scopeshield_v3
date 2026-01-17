import { NextResponse } from 'next/server';
import { userRepo } from '@scopeshield/db';

import { requireSession } from '@/lib/authGuard';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const s = await requireSession();

    // Minimal payload for boundary test: return the user
    const user = await userRepo.findUserById(s.userId);


    return NextResponse.json({ ok: true, user });
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status === 401 ? 401 : 500;
    return NextResponse.json(
      { ok: false, error: status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}
