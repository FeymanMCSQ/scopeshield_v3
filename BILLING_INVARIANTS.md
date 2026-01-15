# Billing Invariants (ScopeShield v3)

Billing exists to make one statement true:

> A ticket is “paid” only when Stripe says it is paid.

Everything else is implementation detail.

This repo treats billing as a **truth pipeline**, not a UI feature.

---

## 1) Source of Truth

### Stripe is the payment oracle

Payment state is derived from Stripe webhook events.

- UI must never mark a ticket paid.
- API routes must never mark a ticket paid based on client input.
- Database writes may persist “paid”, but only as a consequence of a verified Stripe event.

**Rule:** If Stripe did not send a verified event, the ticket is not paid.

---

## 2) Allowed Places for Billing Logic

Billing logic may exist only in these places:

### A) Domain billing rules (decision layer)

- `packages/domain/src/billing/billing.ts`
  - Derives what a checkout should look like (amount, currency, metadata)
  - Interprets Stripe outcomes into domain intents (e.g., “this ticket can be marked paid”)

### B) Domain ticket transition rules (state machine)

- `packages/domain/src/tickets/tickets.ts`
  - Contains `markPaid(...)` / `markPaidIdempotent(...)`
  - Enforces allowed transitions (approved -> paid)

### C) Stripe webhook transport (wiring layer)

- `apps/web/app/api/stripe/webhook/route.ts`
  - Verifies Stripe signature
  - Parses the event
  - Calls domain transition + DB persistence

### D) DB persistence (storage layer)

- `packages/db/src/*`
  - Reads tickets
  - Writes status updates
  - Exposes projections

Everything else must treat billing as a black box.

---

## 3) Hard Bans (No Fake Paid)

The following are forbidden:

### ❌ UI-driven paid state

- No UI button may directly set `ticket.status = 'paid'`
- No UI route may call a “markPaid” endpoint that accepts user input as proof

### ❌ Client-provided payment claims

Any endpoint accepting:

- `paymentStatus: "paid"`
- `stripeSessionId` from the client as proof
- `paymentIntentId` from the client as proof

…is a bug.

Client input is not proof of payment.

### ❌ “Success page flips paid”

A common trap: “Stripe redirects to success_url, so mark paid.”

Redirects are not proof.
Only webhooks are proof.

### ❌ DB-level rule enforcement

No Prisma repo may implement:

- `if (status === 'approved') update to paid`
  This belongs in domain.

### ❌ LocalStorage / extension storage for billing

- No localStorage
- No chrome.storage
- No client-side “paid cache”

Billing truth must survive reloads via Postgres + Stripe.

---

## 4) Billing Truth Pipeline (The Only Valid Flow)

### Checkout creation (pre-payment)

1. User intent: “Pay this ticket”
2. Server creates Checkout Session for a specific ticket
3. Stripe Checkout occurs off-site
4. Stripe later sends webhook event

Checkout creation does NOT mark paid.

### Payment confirmation (truth)

1. Stripe sends `checkout.session.completed` (or other configured success event)
2. Webhook route verifies signature
3. Route extracts ticket id from `metadata.ss_ticket_id` (or `client_reference_id`)
4. Route loads ticket from DB
5. Route verifies amount/currency match expected
6. Route calls domain: `markPaidIdempotent(ticket)`
7. Route persists: `updateTicketStatus(ticketId, 'paid')`

If any step fails, do NOT mark paid.

---

## 5) Required Metadata (for reconciliation)

Every Checkout Session created for a ticket MUST include:

- `client_reference_id = <ticketId>` (recommended)
- `metadata.ss_ticket_id = <ticketId>`
- `metadata.ss_owner_user_id = <ownerUserId>`
- `metadata.ss_expected_amount_cents = <priceCents>`
- `metadata.ss_currency = <currency>`
- `metadata.ss_kind = "ticket_checkout"`

If metadata is missing, reconciliation becomes unreliable.

---

## 6) Idempotency Requirements

Stripe retries events. The webhook must be safe under repeats.

Rules:

- Marking paid must be idempotent.
- If ticket is already `paid`, webhook should no-op.

Implementation note:

- Use domain helper like `markPaidIdempotent`.
- (Later hardening) optionally persist Stripe event ids to dedupe.

---

## 7) Manual Regression Checklist (Run after billing changes)

### A) UI cannot fake paid

- Open ticket in UI
- Complete payment flow WITHOUT webhook forwarding (Stripe CLI stopped)
- Ticket must NOT become `paid`

### B) Webhook flips paid

- Start `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Create checkout for an approved ticket
- Complete payment
- Ticket must become `paid` in DB

### C) Idempotency

- Resend the same Stripe event:
  - `stripe events resend <evt_...>`
- Ticket stays `paid`, no errors

### D) Amount mismatch defense

- Create checkout, then change ticket price in DB
- Complete payment
- Ticket must NOT become `paid` (mismatch logged)

---

## 8) Red Flag Review Questions (PR Gate)

Before merging any PR touching billing:

1. Did we add code that marks paid outside the webhook path?
2. Did we add any endpoint that accepts “paid” from the client?
3. Did we add UI logic that treats redirect success as proof?
4. Did we add Prisma repo logic that enforces payment transitions?
5. Did we remove/skip Stripe signature verification?
6. Did we stop attaching required metadata to checkout sessions?

If any answer is “yes”, the change violates billing invariants.

---

## 9) Minimal Contract Summary

- Checkout sessions are created server-side and include required metadata.
- Stripe webhooks are the only proof of payment.
- Webhook updates ticket status via domain transition and DB persistence.
- UI never marks paid.
- “Paid” is a DB fact derived from Stripe truth.

End.
