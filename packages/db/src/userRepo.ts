import { prisma } from './client';

export const userRepo = {
  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });
  },

  async upsertDevUser(email: string, name: string) {
    return prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name },
      select: { id: true, email: true },
    });
  },
};
