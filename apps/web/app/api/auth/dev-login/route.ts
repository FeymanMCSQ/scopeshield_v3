import { NextResponse } from 'next/server';
import { prisma } from '@scopeshield/db';
import { createSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  try {
    // Dev-only: creates/gets a user and sets session cookie.
    // No UI. No OAuth. No email. Pure plumbing test.

    const email = 'dev@scopeshield.local';

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name: 'Dev User' },
      select: { id: true, email: true },
    });

    const session = await createSession(user.id);

    return NextResponse.json({
      ok: true,
      user,
      session: {
        userId: session.userId,
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;

    console.error('Dev Login Error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        stack: stack,
      },
      { status: 500 }
    );
  }
}
