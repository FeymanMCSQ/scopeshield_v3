# Prisma (ScopeShield v3) — Design Notes

This repo uses **Prisma ORM v7** + **Postgres** + **Prisma Accelerate**.
This document exists to prevent Future Me (and AI collaborators) from re-learning the same painful lessons.

---

## 1) What we’re optimizing for

- **One PrismaClient per runtime**: Avoid connection explosions by using a singleton pattern.
- **Next.js HMR Support**: Prevents multiple instances being created during hot-module replacement in development.
- **ESM-first Prisma 7**: The client is generated into `src/generated/prisma` to comply with TypeScript `rootDir` constraints.
- **Accelerate Integration**: Using `withAccelerate()` without breaking types by using a factory function and type inference.
- **Circular Dependency Prevention**: Keeping the client singleton strictly isolated from repositories.

---

## 2) The Architecture

### `packages/db/src/client.ts` (The Leaf)
This is the **only** place where `PrismaClient` is instantiated.
- It handles manual `.env` loading for monorepo support.
- It exports the `prisma` singleton.
- **Crucial**: This file must not import from any other files in `src` (like repositories) to avoid circular dependency crashes (ReferenceErrors).

### `packages/db/src/ticketsRepo.ts`
Domain implementations that use the `prisma` client. They import from `./client`.

### `packages/db/src/index.ts` (The Aggregator)
The entry point for the workspace package. It re-exports everything from `client.ts` and the various repositories.

---

## 3) Usage

✅ **Standard Import** (Everywhere else):

```ts
import { prisma, ticketWriter } from '@scopeshield/db';
```

---

## 4) Adding New Models

1. Update `packages/db/prisma/schema.prisma`.
2. Run `pnpm --filter @scopeshield/db prisma:generate`.
3. If using repositories, add them to `src/` and export them via `index.ts`.
