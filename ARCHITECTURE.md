# ScopeShield v3 — Architecture Invariants

This repo is engineered to avoid two failure modes:

1. **Spaghetti scaling**: small changes require edits in many places.
2. **Cathedral scaling**: small changes require creating many files/abstractions.

We prefer **coarse-grained modularity**: few modules, clear ownership, chunky cohesive files, and splits only under real pressure.

---

## 0) Prime Directive

**One behavior has one home.**  
If you must update something and you don’t know where it lives, the architecture has already failed.

---

## 1) Repo Shape (Bounded Contexts)

Monorepo structure:

- `apps/web`  
  Next.js web app: dashboard, client ticket page, API routes (transport only)

- `apps/extension`  
  Browser extension: capture evidence from chats, invoke server APIs, show minimal UI

- `packages/domain`  
  Business logic only (pure rules + use-cases). No HTTP, no DB, no browser APIs.

- `packages/db`  
  Prisma schema + db client + repositories. Knows Postgres and Prisma. Nothing else.

### Dependency Direction (one-way)

**extension/web → domain → db**

- Apps may call domain.
- Domain may call db _only through explicit functions exported by db_ (or via ports if introduced later).
- Domain must never import from apps.
- db must never import from apps.
- Apps must not duplicate domain rules.

If you violate this, you create “change in 7 files” hell.

---

## 2) Module Boundaries (Ownership)

The main modules (bounded contexts) live in `packages/domain/src`:

- `tickets` — ticket lifecycle, evidence, pricing rules, state transitions
- `billing` — checkout creation, webhook interpretation, payment state updates
- `clients` (later) — per-client analytics/history
- `integrations` (later) — Trello/Asana/Sheets adapters

### Ownership Rule

A feature belongs to the module that owns its data + invariants.

Examples:

- Ticket status rules? → `domain/tickets`
- “Paid” truth? → `domain/billing` (backed by Stripe events)
- UI rendering logic? → `apps/web`
- DOM selection/highlight logic? → `apps/extension`

---

## 3) “One change → one module” Rule

Every change should have a default home.

### Allowed pattern

- Add/modify behavior in exactly **one** domain module.
- Update **one** adapter (web API route or extension action) to call it.
- Update UI to display results.

### Smell (architecture regression)

If a change requires edits across multiple domain modules, ask:

- Are we duplicating rules?
- Are we missing a central invariant?
- Did we let UI/API become “smart”?

If yes, fix the boundary rather than adding more glue.

---

## 4) Chunky-File Rule (No Small-File Hell)

**Chunky cohesive files are allowed and preferred.**  
We do not split code into many small files by default.

Each domain module starts as:

- `index.ts` (public exports)
- one main file (e.g., `tickets.ts`, `billing.ts`)

Internal helpers live in the same file until splitting is forced.

### Explicit anti-pattern

Avoid these unless the module has proven it needs it:

- `types.ts`, `constants.ts`, `helpers.ts`, `utils.ts` sprawl
- “one interface per file” patterns
- premature “layering” inside a module

---

## 5) Split-Only-Under-Pressure Policy

Splitting is allowed only when there is real pressure.

### You may split a file when at least one is true:

1. **Two distinct reasons to change** are fighting in the same file  
   Example: pricing heuristics changing weekly while ticket transitions are stable.

2. **Two distinct audiences** are reading/editing different parts  
   Example: billing/Stripe logic vs general ticket lifecycle logic.

3. The file is consistently causing **scroll fatigue** (rule of thumb: 300–500+ lines)  
   _and_ you can split by cohesive responsibility (not by “types vs helpers”).

### How to split (approved)

Split by responsibility:

- `tickets.ts` + `pricing.ts`
- `billing.ts` + `stripeWebhook.ts`

### How NOT to split (disallowed)

Split by generic categories:

- `types.ts`, `utils.ts`, `constants.ts`

Those create “touch 7 files” tax.

---

## 6) Source of Truth Rules

- **Postgres (via Prisma) is the system of record.**
- The extension is **stateless** (no localStorage / IndexedDB required for core functionality).
- Client-facing approval pages are public, but must use unguessable identifiers and/or verification steps.

### Stripe truth

Payment state is derived from Stripe:

- UI never marks tickets paid.
- Webhook updates ticket/payment status.

---

## 7) The “Architecture Budget” Rule

For any new feature:

- Default budget: **0 new modules**, **≤ 1 new file**.
- If you need more, you must justify why the existing module cannot own the change.

This prevents cathedral creep.

---

## 8) Definition of “Done” (per mission)

A mission is done only if:

- Build passes
- Boundaries still hold
- No duplicated invariants
- No “just in case” abstractions were introduced

---

## 9) If You’re Lost (Emergency Protocol)

Ask, in order:

1. What data/invariant is being changed?
2. Which module owns that invariant?
3. Can this be expressed as a function in that module?
4. Can apps adapt by calling that function?

If you can’t answer (2), the architecture needs refactoring before more features.
