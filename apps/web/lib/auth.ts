import crypto from 'crypto';
import { cookies } from 'next/headers';
import { sessionRepo } from '@scopeshield/db';


const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'ss_session';
const TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? '30');


function now(): Date {
  return new Date();
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

/**
 * Generate a random session token that goes to the browser cookie.
 * Store only its hash in DB.
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('base64url'); // URL-safe
}

function hashToken(token: string): string {
  // SHA-256 is fine here; store hex in DB.
  return crypto.createHash('sha256').update(token).digest('hex');
}

export type AuthSession = {
  userId: string;
  sessionId: string;
  expiresAt: Date;
};

/**
 * Creates a DB session and sets an HTTP-only cookie.
 * Returns session metadata (not the raw token).
 */
export async function createSession(userId: string): Promise<AuthSession> {
  if (!userId) throw new Error('userId is required');

  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = addDays(now(), TTL_DAYS);

  const session = await sessionRepo.createSession({
    userId,
    tokenHash,
    expiresAt,
  });


  // HTTP-only cookie: JS cannot read it. Extension also doesn't store tokens.
  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return {
    userId: session.userId,
    sessionId: session.id,
    expiresAt: session.expiresAt,
  };
}

/**
 * Reads session cookie, validates against DB.
 * Returns userId if valid, otherwise null.
 */
export async function validateSession(): Promise<{
  userId: string;
  sessionId: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);

  const session = await sessionRepo.findSessionByHash(tokenHash);


  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt <= now()) return null;

  return { userId: session.userId, sessionId: session.id };
}

/**
 * Optional: log out by revoking current session and clearing cookie.
 * Not required for Mission 1.2, but useful for testing.
 */
export async function revokeCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return;

  const tokenHash = hashToken(token);

  await sessionRepo.revokeSessionByHash(tokenHash, now());


  cookieStore.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
}
