import { NextResponse } from 'next/server';
import { userRepo } from '@scopeshield/db';

import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }


    return NextResponse.json({ ok: true, user });
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status === 401 ? 401 : 500;
    return NextResponse.json(
      { ok: false, error: status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}
