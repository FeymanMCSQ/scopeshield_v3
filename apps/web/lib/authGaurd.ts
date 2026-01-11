import { validateSession } from './auth';

/**
 * Use in API routes that must require auth.
 * Returns { userId, sessionId } or throws a 401-ish error shape.
 */
export async function requireSession() {
  const s = await validateSession();
  if (!s) {
    const err = new Error('UNAUTHORIZED') as Error & { status: number };
    err.status = 401;
    throw err;
  }
  return s;
}
