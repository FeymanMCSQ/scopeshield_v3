import { prisma } from './client';
import { tickets } from '@scopeshield/domain';
import type { TicketStatus } from './generated/prisma/enums';

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
  evidenceText: string;
  assetUrl: string | null;
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
      evidenceText: true,
      assetUrl: true,
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
    evidenceText: t.evidenceText,
    assetUrl: t.assetUrl,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,


  };
}

export type TicketListItemDto = {
  id: string;
  status: TicketStatus;
  priceCents: number | null;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};

type TicketCursor = { createdAt: string; id: string };

function encodeCursor(c: TicketCursor): string {
  return Buffer.from(JSON.stringify(c), 'utf8').toString('base64url');
}

function decodeCursor(s: string): TicketCursor {
  const raw = Buffer.from(s, 'base64url').toString('utf8');
  const parsed = JSON.parse(raw) as TicketCursor;
  if (!parsed?.createdAt || !parsed?.id) throw new Error('BAD_CURSOR');
  return parsed;
}

export async function listTicketsForOwner(opts: {
  ownerUserId: string;
  limit: number; // 1..100
  cursor?: string; // opaque base64url json
  status?: TicketStatus;
}): Promise<{ items: TicketListItemDto[]; nextCursor: string | null }> {
  const take = Math.min(Math.max(opts.limit, 1), 100) + 1;

  // We use a composite cursor of (createdAt, id) to guarantee stable ordering.
  // Prisma requires cursor to reference a unique field. `id` is unique; we use it
  // as the cursor anchor and enforce orderBy createdAt/id for stable paging.
  // To page correctly, we also filter by createdAt boundary ourselves.
  let boundary: TicketCursor | null = null;
  if (opts.cursor) boundary = decodeCursor(opts.cursor);

  const whereBase: any = {
    ownerUserId: opts.ownerUserId,
    ...(opts.status ? { status: opts.status } : {}),
  };

  // When cursor is present, exclude items >= boundary in the ordering (createdAt desc, id desc).
  // For descending order, "next page" means strictly older than the boundary.
  const where =
    boundary == null
      ? whereBase
      : {
          ...whereBase,
          OR: [
            { createdAt: { lt: new Date(boundary.createdAt) } },
            {
              createdAt: { equals: new Date(boundary.createdAt) },
              id: { lt: boundary.id },
            },
          ],
        };

  const rows = await prisma.ticket.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take,
    select: {
      id: true,
      status: true,
      priceCents: true,
      currency: true,
      createdAt: true,
      updatedAt: true,
      // DO NOT SELECT: platform/evidenceText/evidenceUrl/ownerUserId
    },
  });

  const hasMore = rows.length > take - 1;
  const items = (
    hasMore ? rows.slice(0, take - 1) : rows
  ) satisfies TicketListItemDto[];

  const nextCursor =
    hasMore && items.length
      ? encodeCursor({
          createdAt: items[items.length - 1].createdAt.toISOString(),
          id: items[items.length - 1].id,
        })
      : null;

  return { items, nextCursor };
}

export type RevenueMetrics = {
  paidCount: number;
  totalPaidCents: number;
  currencies: string[];
};


export async function getRecapturedRevenueMetrics(opts: {
  ownerUserId: string;
}): Promise<RevenueMetrics> {
  // Count paid tickets
  const paidCount = await prisma.ticket.count({
    where: { ownerUserId: opts.ownerUserId, status: 'paid' as TicketStatus },
  });

  // Sum priceCents for paid tickets (nulls ignored by SUM; Prisma returns null when no rows)
  const sum = await prisma.ticket.aggregate({
    where: { ownerUserId: opts.ownerUserId, status: 'paid' as TicketStatus },
    _sum: { priceCents: true },
  });

  const totalPaidCents = sum._sum.priceCents ?? 0;

  // Currency handling:
  // If you enforce a single currency per user later, this can be simplified.
  // For now, compute "USD if all paid tickets are USD else MIXED".
  const currencies = await prisma.ticket.findMany({
    where: { ownerUserId: opts.ownerUserId, status: 'paid' as TicketStatus },
    select: { currency: true },
    distinct: ['currency'],
    take: 2,
  });

  return {
    paidCount,
    totalPaidCents,
    currencies: currencies.map((c) => c.currency),
  };
}

