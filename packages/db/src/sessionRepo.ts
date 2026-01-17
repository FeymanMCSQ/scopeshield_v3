import { prisma } from './client';

export const sessionRepo = {
  async createSession(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return prisma.session.create({
      data,
      select: {
        id: true,
        userId: true,
        expiresAt: true,
      },
    });
  },

  async findSessionByHash(tokenHash: string) {
    return prisma.session.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        revokedAt: true,
      },
    });
  },

  async revokeSessionByHash(tokenHash: string, revokedAt: Date) {
    return prisma.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt },
    });
  },
};
