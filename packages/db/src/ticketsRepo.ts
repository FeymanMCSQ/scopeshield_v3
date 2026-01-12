import { prisma } from './client';
import { tickets } from '@scopeshield/domain';

/**
 * Shared selection object to ensure consistency across all ticket queries.
 */
const TICKET_SELECT = {
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
} as const;

/**
 * Concrete DB implementation of the domain Ticket interfaces.
 * Consolidates Writer, Reader, and Updater logic.
 */
export const ticketRepo: tickets.TicketWriter &
  tickets.TicketReader &
  tickets.TicketUpdater = {
  async createTicket(data) {
    const t = await prisma.ticket.create({
      data: {
        ownerUserId: data.ownerUserId,
        status: data.status,
        priceCents: data.priceCents,
        currency: data.currency,
        platform: data.platform,
        evidenceText: data.evidenceText,
        evidenceAt: data.evidenceAt,
        evidenceUrl: data.evidenceUrl,
        assetUrl: data.assetUrl,
      },
      select: TICKET_SELECT,
    });

    return mapTicket(t);
  },

  async getTicketById(id) {
    const t = await prisma.ticket.findUnique({
      where: { id },
      select: TICKET_SELECT,
    });
    return t ? mapTicket(t) : null;
  },

  async updateTicketStatus(id, status) {
    const t = await prisma.ticket.update({
      where: { id },
      data: { status },
      select: TICKET_SELECT,
    });

    return mapTicket(t);
  },
};

/**
 * Re-exporting as ticketWriter for backward compatibility or strict interface adherence
 * where only writing is required.
 */
export const ticketWriter: tickets.TicketWriter = ticketRepo;

/**
 * Maps a Prisma record onto the Domain CreatedTicket shape.
 */
function mapTicket(t: any): tickets.CreatedTicket {
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
}

export type PublicTicketView = {
  id: string;
  status: string;
  priceCents: number | null;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function getPublicTicketById(
  ticketId: string
): Promise<PublicTicketView | null> {
  const t = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      status: true,
      priceCents: true,
      currency: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!t) return null;

  return {
    id: t.id,
    status: t.status,
    priceCents: t.priceCents,
    currency: t.currency,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}
