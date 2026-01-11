import { NextResponse } from 'next/server';
import { prisma } from '@scopeshield/db';
import { validateSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const s = await validateSession();
  if (!s) return NextResponse.json({ ok: false, user: null }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: s.userId },
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json({ ok: true, user });
}
