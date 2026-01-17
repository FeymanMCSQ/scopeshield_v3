import { NextResponse } from 'next/server';
import { userRepo } from '@scopeshield/db';

import { validateSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const s = await validateSession();
  if (!s) return NextResponse.json({ ok: false, user: null }, { status: 401 });

  const user = await userRepo.findUserById(s.userId);


  return NextResponse.json({ ok: true, user });
}
