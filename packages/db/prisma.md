# Prisma (ScopeShield v3) — Design Notes

This repo uses **Prisma ORM v7** + **Postgres** + **Prisma Accelerate**.
This document exists to prevent Future Me from re-learning the same painful lessons.

---

## 1) What we’re optimizing for

- **One PrismaClient per runtime** (avoid connection explosions)
- Works with **Next.js dev/HMR** (module reloads)
- Works with **ESM-first Prisma 7**
- Works with **Accelerate** (`withAccelerate()`), without breaking types
- Keeps DB concerns isolated inside `packages/db`

---

## 2) Where Prisma lives

**All Prisma setup and instantiation lives in exactly one place:**

- `packages/db/src/index.ts`

Everything else imports `prisma` from there.

✅ Allowed:

```ts
import { prisma } from '@scopeshield/db';
```
