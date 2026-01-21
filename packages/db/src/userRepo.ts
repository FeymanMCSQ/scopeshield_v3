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
      },
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
