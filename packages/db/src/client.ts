import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from './generated/prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Manually load .env from several possible locations to support both
// standalone scripts (root CWD) and Next.js (apps/web CWD).
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(__dirname, '../../../.env'), // Fallback for CJS/bundlers
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const prismaClientFactory = () => {
  const url = process.env.ACCELERATE_URL ?? process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "Prisma 7 Accelerate Validation Error: 'ACCELERATE_URL' or 'DATABASE_URL' is missing. " +
        'Ensure your .env file is loaded and contains a valid Prisma Accelerate connection string.'
    );
  }

  return new PrismaClient({
    accelerateUrl: url,
  }).$extends(withAccelerate());
};

type PrismaClientExtended = ReturnType<typeof prismaClientFactory>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientExtended | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientFactory();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
