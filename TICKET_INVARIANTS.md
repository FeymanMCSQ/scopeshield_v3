# Ticket Invariants (ScopeShield v3)

Tickets are the core object. If ticket rules scatter across UI/API/DB, the product becomes unmaintainable.
This document defines where ticket logic lives and what is forbidden.

---

## 1) Single Source of Truth: Ticket Rules Live in Domain

All ticket _behavior_ lives in:

- `packages/domain/src/tickets/tickets.ts`

This includes:

- status enum (domain representation)
- allowed status transitions (state machine)
- guard functions
- use-cases that decide what changes are permitted:
  - `createTicketFromEvidence(...)`
  - `approveTicket(ticketId)`
  - (later) `rejectTicket`, `markPaid`, `setPrice`, etc.

Domain code:

- must be pure business logic
- must not import Prisma
- must not import Next.js
- must not import cookies/headers
- must not parse HTTP requests

**If a rule changes, it changes in domain first.**

---

## 2) Persistence Rule: DB Layer Persists, It Does Not Decide

DB code lives in:

- `packages/db/src/*`

DB is allowed to:

- translate between domain types and Prisma models
- read/write tickets
- expose projection helpers (public views)

DB is NOT allowed to:

- decide whether a transition is legal
- enforce business rules like “only pending can be approved”
- embed ticket workflows in SQL/Prisma calls

DB should not contain logic like:

- “if status is pending then … else throw”
  That belongs in domain.

---

## 3) Boundary Rule: UI Does Not Touch Ticket State

UI includes:

- server components/pages in `apps/web/app/*`
- client components
- extension UI (later)

UI is allowed to:

- render current ticket state
- submit user intent (approve/reject/etc.)
- display errors returned by the server

UI is NOT allowed to:

- set `ticket.status = ...`
- implement “allowed transitions” logic
- decide “should this be allowed” beyond superficial UX (e.g., disable a button)

**UI expresses intent; domain decides.**

---

## 4) API Rule: Handlers Are Thin Pipes

API routes (Next.js route handlers) must be:

- auth check (if required)
- input parsing/validation (shape + types)
- call a domain use-case
- return result

API routes must NOT:

- implement ticket transition rules
- set status directly in Prisma
- re-encode business logic via conditionals

Bad (forbidden):

```ts
// if pending -> approved else 400
```

5. What Counts as “Ticket Logic” (must be domain)

Any rule that could change due to product decisions belongs in domain, e.g.:

which status transitions are legal

whether approval requires pricing

who is allowed to approve (role rules)

timing rules (expiry windows)

invariants like “paid implies approved happened earlier”

Anything that looks like “if/else around status” is usually ticket logic.

6. Public vs Private Data (leak prevention rule)

There are two ticket views:

Private (owner/internal)

May include:

evidence text

platform

evidence URLs

attachments

owner identity

Public (client-facing)

Must include only:

ticket id

status

price (if set)

created/updated timestamps

Public projections must never include:

ownerUserId

evidenceText

platform

evidenceUrl

internal notes

Implementation guideline:

public projection is a separate query/projection function

never return Prisma’s full Ticket model from public endpoints
