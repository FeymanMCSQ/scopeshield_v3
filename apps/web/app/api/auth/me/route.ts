import { NextResponse } from 'next/server';
import { userRepo } from '@scopeshield/db';

import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, user: null }, { status: 401 });


  return NextResponse.json({ ok: true, user });
}
