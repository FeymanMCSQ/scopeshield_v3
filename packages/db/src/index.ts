import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prismaClientFactory = () => {
  return new PrismaClient({
    // If you're using Accelerate:
    accelerateUrl: (process.env.ACCELERATE_URL ?? process.env.DATABASE_URL) as string,
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
