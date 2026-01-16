# Dashboard Invariants (ScopeShield v3)

The dashboard exists to **observe** the system, not to mutate it.

If the dashboard becomes a control panel that performs writes, it will gradually accumulate business logic and violate module boundaries.

This document locks the dashboard into a **read-only surface**.

---

## 1) Prime Rule

**Dashboard code must be read-only.**

That means:

- No DB writes
- No ticket transitions
- No checkout creation
- No auth/session mutations
- No webhook logic
- No “admin actions” hidden behind buttons

Dashboard UI may render links to other pages that perform actions, but it must not perform actions itself.

---

## 2) What “Read-Only” Means (Allowed)

Dashboard may:

- Fetch paginated ticket lists (scoped to the authenticated user)
- Fetch aggregate metrics computed in DB (count/sum/group)
- Render status tables and summaries
- Provide filtering and pagination controls via URL query params
- Use server components to read from DB repos
- Use GET APIs that do not write

Allowed DB operations (examples):

- `findMany`, `findUnique` (read-only selects)
- `count`
- `aggregate` (`_sum`, `_count`)
- read-only projections

---

## 3) What is Forbidden (Hard Bans)

### ❌ Mutations from dashboard surfaces

Dashboard code must not:

- call `fetch(..., { method: 'POST' })` for any reason
- include Server Actions (`"use server"`) that write
- call any mutating API endpoints
- import Stripe SDK or create checkout sessions
- call ticket transition use-cases (`approve`, `reject`, `markPaid`, etc.)
- call DB repo write methods (`update`, `create`, `delete`)

### ❌ Business logic in dashboard

Dashboard must not implement:

- ticket transition rules (`if (status === ...)`)
- billing truth logic (“if payment succeeded, mark paid”)
- any decision logic beyond UX presentation (sorting/filter UI)

### ❌ “Convenient admin button” creep

Do not add buttons like:

- “Approve”
- “Mark Paid”
- “Create Checkout”
- “Fix Ticket”
- “Refund”

If an operational control surface is required later, it must live in a separate bounded module and be explicitly justified.

---

## 4) Approved Data Sources

Dashboard may read only from these sources:

- `packages/db` read-only repo functions (lists, projections, aggregates)
- read-only API routes that themselves do only reads

Preferred pattern (DB-direct, server component):

- `requireSession()`
- call repo read functions
- render

If the dashboard calls an API route, that route must be **GET + read-only**.

---

## 5) DTO Rules (No Domain Leakage)

Dashboard outputs must use **clean DTOs**.

Dashboard must never render full Prisma models containing:

- `ownerUserId`
- `evidenceText`
- `evidenceUrl`
- platform identifiers
- internal notes

List DTOs should include only:

- `id`
- `status`
- `priceCents` + `currency`
- `createdAt` / `updatedAt`

Metrics must come from DB aggregates, not UI `reduce()`.

---

## 6) Audit Checklist (Run after any dashboard change)

### A) Static scan

Search within `apps/web/app/dashboard/**` for red flags:

- `method: 'POST'`
- `use server`
- `action=`
- `stripe`
- `checkout`
- `approve`
- `updateTicketStatus`
- `createSession`

Any match is suspicious and must be reviewed.

### B) Route classification sanity check

Confirm that dashboard calls only:

- read-only DB functions, or
- read-only GET endpoints

### C) Runtime sanity checks

- Opening the dashboard must not create or update any rows.
- Network tab: dashboard page load should produce only GET requests (if any).
- Refreshing dashboard must be side-effect free.

---

## 7) PR Gate Questions

Before merging a PR touching dashboard code:

1. Did we add any POST call or Server Action?
2. Did we add any import of Stripe, checkout creation, ticket transitions, or DB write methods?
3. Did we add any logic that decides what ticket state should become?
4. Did we add any new endpoint used by dashboard that is not strictly GET + read-only?
5. Did we accidentally render private ticket evidence fields?

If any answer is “yes”, the change violates dashboard invariants.

---

## 8) Minimal Contract Summary

- Dashboard observes.
- Domain decides.
- DB aggregates compute metrics.
- No mutations occur from dashboard surfaces.
- Dashboard changes must remain localized and side-effect free.

End.
