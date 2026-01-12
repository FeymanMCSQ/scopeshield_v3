# Auth Invariants (ScopeShield v3)

This repo uses **DB-backed sessions** with an **HTTP-only cookie**.
Auth must remain simple, explicit, and hard to bypass accidentally.

If a change makes private data accessible without a valid session, that change is a bug.

---

## 1) Source of Truth

- Auth state is derived from:
  - the **HTTP-only cookie** (`ss_session` by default)
  - the **Session** row in Postgres (tokenHash + expiry + revokedAt)

There is no localStorage auth state.
There is no extension token storage.
There is no "frontend auth" that can override the server.

---

## 2) Where Auth Logic Is Allowed

Auth logic may exist only in these places:

### A) Session utilities (single home)

- `apps/web/lib/auth.ts`
  - `createSession(userId)`
  - `validateSession()`
  - `revokeCurrentSession()`

### B) Auth guard helpers (optional thin layer)

- `apps/web/lib/authGuard.ts`
  - `requireSession()` (wraps validateSession)

### C) Boundary enforcement points

- Server Actions that set cookies (allowed)
- API routes that require auth (allowed _only_ via requireSession / validateSession)
- Server Components/pages that gate private pages (allowed _only_ via validateSession)

Everything else must treat auth as a black box.

---

## 3) Where Auth Logic Is NOT Allowed (Hard Bans)

❌ Never instantiate `PrismaClient` for auth anywhere outside `packages/db`.

❌ Never read or interpret session cookies in:

- `packages/domain`
- `apps/extension`
- random UI components
- shared utility files

❌ Never write new “auth helpers” scattered across:

- `utils/auth.ts`
- `helpers/session.ts`
- `middleware.ts` (until explicitly justified)

❌ Never treat client state as auth:

- no localStorage tokens
- no “isLoggedIn” boolean that gates server data
- no trusting client-provided userId

---

## 4) Private vs Public Surface Area

### Private surfaces (must enforce auth)

- Any dashboard API route: `/api/dashboard/*`
- Any route returning non-public user data
- Any mutation routes (create/update/delete)
- Any admin or internal analytics endpoints

Enforcement rule:

- API routes must call `requireSession()` at the top.
- Private pages must call `validateSession()` and redirect if null.

### Public surfaces (must stay public)

- `/login`
- `/t/[ticketId]` (public ticket pages)
- any marketing pages

Public pages must never import `requireSession()`.

---

## 5) Bypass Prevention Rules (Practical)

### Rule 5.1 — Centralize enforcement

Protected API routes MUST start with:

```ts
const s = await requireSession();
```

No exceptions.

Rule 5.2 — No "optional auth" for private data

If data is private, auth is mandatory.
Do not “sometimes return data” if session exists.
That pattern creates accidental leaks.

Rule 5.3 — Cookie write location

Only these functions may set/clear cookies:

createSession

revokeCurrentSession

No other code calls cookies().set().

6. Manual Checklist (Run this after any auth-related change)
   A) Unauthenticated requests fail

Fresh browser / incognito:

GET /api/dashboard returns 401

GET /dashboard redirects to /login

B) Authenticated requests succeed

Login (dev stub is fine)

Refresh /dashboard — still logged in

GET /api/dashboard returns 200 with user payload

C) Logout kills session deterministically

Logout

GET /api/dashboard returns 401

/dashboard redirects to /login

D) Public routes remain public

In incognito:

Visit /t/test-ticket-123 — returns 200 (no redirect)

Visit /login — returns 200

7. "Red Flag" Review Questions (catch leaks early)

Before merging any PR touching auth or dashboard endpoints:

Did we add any new file containing auth logic outside apps/web/lib/auth\*.ts?

Did we add any new protected API route that does NOT call requireSession() first?

Did we add any new public page that imports requireSession()?

Did we add any new cookie name, token format, or session parsing logic outside auth.ts?

Did we store anything auth-related in localStorage/sessionStorage/extension storage?

If any answer is "yes", the change is suspicious and should be reworked.

8. Minimal Contract Summary

createSession(userId) sets cookie + writes session row.

validateSession() checks cookie → hash → DB → expiry/revocation.

Protected routes use requireSession() at the top.

Public pages never require auth.
