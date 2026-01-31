import { prisma } from './client';

export const userRepo = {
  async findUserByStripeAccountId(stripeAccountId: string) {
    return prisma.user.findUnique({
      where: { stripeAccountId },
      select: { id: true },
    });
  },

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        stripeAccountId: true,
        subscriptionStatus: true,
        passwordHash: true, // Only for internal checks if needed, usually excluded from public DTOs
        createdAt: true,
      },
    });
  },

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    });
  },

  async createUserWithPassword(email: string, passwordHash: string, name: string) {
    return prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
      select: { id: true, email: true },
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

  async syncClerkUser(id: string, email: string, name: string) {
    return prisma.user.upsert({
      where: { id },
      update: { email, name },
      create: { id, email, name },
      select: {
        id: true,
        email: true,
        name: true,
        stripeAccountId: true,
        subscriptionStatus: true,
        passwordHash: true,
        createdAt: true
      },
    });
  },


  async updateStripeAccount(userId: string, stripeAccountId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { stripeAccountId },
    });
  },

  async updateSubscriptionStatus(userId: string, subscriptionStatus: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus },
    });
  },
};
