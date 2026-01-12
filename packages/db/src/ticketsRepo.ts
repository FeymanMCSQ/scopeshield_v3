import { prisma } from './client';
import { tickets } from '@scopeshield/domain';

/**
 * Concrete DB implementation of the domain TicketWriter interface.
 */
export const ticketWriter: tickets.TicketWriter = {
  async createTicket(data) {
    const t = await prisma.ticket.create({
      data: {
        ownerUserId: data.ownerUserId,
        status: data.status, // Prisma enum uses same strings
        priceCents: data.priceCents,
        currency: data.currency,
        platform: data.platform,
        evidenceText: data.evidenceText,
        evidenceAt: data.evidenceAt,
        evidenceUrl: data.evidenceUrl,
        assetUrl: data.assetUrl,
      },
      select: {
        id: true,
        status: true,
        ownerUserId: true,
        priceCents: true,
        currency: true,
        platform: true,
        evidenceText: true,
        evidenceAt: true,
        evidenceUrl: true,
        assetUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Map Prisma shape to domain CreatedTicket
    return {
      id: t.id,
      status: t.status as tickets.TicketStatus,
      ownerUserId: t.ownerUserId,
      priceCents: t.priceCents,
      currency: t.currency,
      platform: t.platform,
      evidenceText: t.evidenceText,
      evidenceAt: t.evidenceAt,
      evidenceUrl: t.evidenceUrl,
      assetUrl: t.assetUrl,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  },
};
