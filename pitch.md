# ScopeShield

## One-line
ScopeShield turns informal “quick requests” in chat into formal, priced change tickets that clients can approve and pay—without awkward conversations.

---

## The Problem

Freelancers lose money in a very specific, very quiet way:

- Clients ask for “small tweaks” in WhatsApp, Slack, Telegram, or email
- The request is real work, but informal
- The freelancer either:
  - does it for free to avoid friction, or
  - delays billing and forgets, or
  - feels awkward bringing up money later

This isn’t bad clients.  
It’s **missing structure at the moment the request happens**.

Scope creep doesn’t look like theft.  
It looks like politeness.

Over time, this silently erodes:
- billable hours (often 20–30%)
- boundaries
- energy
- trust on both sides

---

## What ScopeShield Is

ScopeShield is a **browser extension + web app** that lets a freelancer capture a client request *at the moment it appears* and turn it into a **ticket**:

> A ticket is a small, formalized change request with:
> - the original client message as evidence
> - a clear price
> - a public approval + payment page

The freelancer sends the ticket link back to the client.  
The client either approves and pays—or doesn’t.

No arguing. No chasing. No spreadsheets.

---

## What a “Ticket” Actually Is

From the freelancer’s perspective, a ticket is **not** just a page.

A ticket is:
- a boundary
- a record
- a pricing decision
- a payment trigger

Technically, a ticket is:
- a database object with a strict state machine  
  (`pending → approved → paid` or `rejected`)
- backed by Stripe as the single source of payment truth
- immutable once paid

From the client’s perspective:
- it’s a simple page
- no login required
- shows exactly what’s being asked and what it costs
- pay → done

---

## How ScopeShield Works (MVP Flow)

1. **Capture**
   - Freelancer highlights a message in WhatsApp Web / Slack
   - Or opens the extension and creates a ticket manually
   - Evidence text + platform + timestamp are captured

2. **Price**
   - Freelancer enters a fixed price (or accepts a suggested one)
   - A calm confirmation message is shown:
     > “No worries — this will be $X.”

3. **Send**
   - ScopeShield generates a public ticket link
   - Freelancer pastes it back into chat

4. **Approve & Pay**
   - Client opens the link
   - Approves the request
   - Pays via Stripe Checkout

5. **Track**
   - Ticket moves to `paid`
   - Revenue shows up in the dashboard
   - Money lands in the freelancer’s Stripe account

---

## Money Flow (Important)

ScopeShield **never holds user funds**.

- Each freelancer connects their own Stripe account (via Stripe Connect)
- Payments are processed as **direct charges**
- Money goes **straight from client → freelancer**
- ScopeShield can optionally take a platform fee later

This keeps:
- compliance simple
- trust high
- incentives aligned

---

## Why This Is Different From “Just Sending an Invoice”

Invoices happen **after** work.

ScopeShield happens **at the decision point**.

Key differences:
- Captures intent while it’s fresh
- Removes negotiation by formalizing the request
- Forces clarity *before* work starts
- Works inside the chat tools freelancers already use

It’s not billing software.  
It’s **boundary automation**.

---

## Dashboard & Insight

The dashboard is deliberately minimal.

It answers only three questions:
1. What tickets exist?
2. What state are they in?
3. How much revenue was recaptured?

Metrics are computed from the database, not the UI:
- total paid tickets
- total recovered revenue
- per-status breakdown

No forecasts. No vanity charts.

---

## Design Principles

ScopeShield is built around a few hard rules:

- **One module owns one behavior**
- **Chunky files are allowed**
- **No local storage in the extension**
- **Postgres is the single source of truth**
- **Stripe is the single source of payment truth**
- **UI never mutates business state**

These constraints exist to prevent:
- spaghetti scaling
- silent logic duplication
- “it works but we don’t know why” systems

---

## Who This Is For

Primary users:
- Freelance designers
- Developers
- Consultants
- Solo operators billing per change, not per retainer

Especially useful when:
- clients communicate casually
- work arrives piecemeal
- boundaries are social, not contractual

---

## What ScopeShield Is Not

- Not a project management tool
- Not a CRM
- Not an invoicing replacement
- Not AI-driven (on purpose)

It does one job:
**turn vague requests into paid decisions**.

---

## Status

ScopeShield MVP:
- Ticket lifecycle complete
- Stripe payments live
- Stripe Connect onboarding working
- Stateless extension
- Dashboard operational

Next steps focus on:
- UX tightening
- onboarding speed
- reducing time-to-first-ticket to under 60 seconds

---

## The Bet

Freelancers don’t need more features.

They need **less friction at the exact moment money gets weird**.

ScopeShield exists for that moment.
