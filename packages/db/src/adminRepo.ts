
import { prisma } from './client';

import { Prisma } from './generated/prisma/client';

export const adminRepo = {
    async getStats() {
        const [totalUsers, activeSubs, churned, totalRevenueResult] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { subscriptionStatus: { in: ['active', 'trialing'] } } }),
            prisma.user.count({ where: { subscriptionStatus: 'canceled' } }),
            prisma.ticket.aggregate({
                where: { status: 'paid' },
                _sum: { priceCents: true }
            })
        ]);

        return {
            totalUsers,
            activeSubs,
            churned,
            totalRevenueCents: totalRevenueResult._sum.priceCents || 0
        };
    },

    async getFeedbackFeed(): Promise<Array<Prisma.FeedbackGetPayload<{ include: { user: { select: { email: true, name: true } } } }>>> {
        const feed = await prisma.feedback.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { email: true, name: true }
                }
            },
            take: 50,
        });
        return feed as unknown as Array<Prisma.FeedbackGetPayload<{ include: { user: { select: { email: true, name: true } } } }>>;
    }
};
