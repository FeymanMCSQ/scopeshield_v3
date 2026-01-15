export type TicketStatus = 'pending' | 'approved' | 'paid' | 'rejected';

export type Ticket = {
  id: string;
  status: TicketStatus;
};

/**
 * Domain error for invalid state transitions.
 * Keep it simple and explicit (no frameworks).
 */
export class TicketTransitionError extends Error {
  readonly from: TicketStatus;
  readonly to: TicketStatus;

  constructor(from: TicketStatus, to: TicketStatus, message?: string) {
    super(message ?? `Illegal ticket transition: ${from} -> ${to}`);
    this.name = 'TicketTransitionError';
    this.from = from;
    this.to = to;
  }
}

/**
 * Single source of truth for allowed transitions.
 */
const ALLOWED_TRANSITIONS: Readonly<
  Record<TicketStatus, readonly TicketStatus[]>
> = {
  pending: ['approved', 'rejected'],
  approved: ['paid', 'rejected'],
  paid: [],
  rejected: [],
} as const;

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: TicketStatus, to: TicketStatus): void {
  if (!canTransition(from, to)) throw new TicketTransitionError(from, to);
}

/**
 * Pure transition function: returns a new Ticket with updated status.
 * Does NOT persist anything.
 */
export function transitionTicket(ticket: Ticket, to: TicketStatus): Ticket {
  assertTransition(ticket.status, to);
  return { ...ticket, status: to };
}

/**
 * Guard helpers (explicit intent, easy to grep)
 */
export function assertPending(ticket: Ticket): void {
  if (ticket.status !== 'pending') {
    throw new TicketTransitionError(
      ticket.status,
      ticket.status,
      'Expected ticket to be pending'
    );
  }
}

export function assertApproved(ticket: Ticket): void {
  if (ticket.status !== 'approved') {
    throw new TicketTransitionError(
      ticket.status,
      ticket.status,
      'Expected ticket to be approved'
    );
  }
}

/**
 * Convenience domain operations (readable in use-cases)
 */
export function approve(ticket: Ticket): Ticket {
  return transitionTicket(ticket, 'approved');
}

export function reject(ticket: Ticket): Ticket {
  return transitionTicket(ticket, 'rejected');
}

export function markPaid(ticket: Ticket): Ticket {
  return transitionTicket(ticket, 'paid');
}

/**
 * Idempotent version of markPaid: if already paid, returns as-is.
 * Otherwise attempts transition.
 */
export function markPaidIdempotent(ticket: Ticket): Ticket {
  if (ticket.status === 'paid') return ticket;
  return markPaid(ticket);
}

//////////////////////////////// TICKET CREATION /////////////////////////////////////////

export type EvidenceInput = {
  platform: string; // "whatsapp" | "slack" | ...
  text: string; // captured request text
  evidenceAt: Date; // when it happened (client-side timestamp)
  evidenceUrl?: string; // deep link optional
  assetUrl?: string; // screenshot/image optional
};

export type CreateTicketInput = {
  ownerUserId: string;
  evidence: EvidenceInput;
  // Pricing is optional at creation time
  pricing?: {
    priceCents?: number;
    currency?: string; // default "USD"
  };
};

export type CreatedTicket = {
  id: string;
  status: TicketStatus;
  ownerUserId: string;

  priceCents: number | null;
  currency: string;

  platform: string;
  evidenceText: string;
  evidenceAt: Date;
  evidenceUrl: string | null;
  assetUrl: string | null;

  createdAt: Date;
  updatedAt: Date;
};

/**
 * The only DB capability the domain needs for ticket creation.
 * Implemented in packages/db. Domain does not know Prisma exists.
 */
export interface TicketWriter {
  createTicket(data: {
    ownerUserId: string;
    status: TicketStatus;

    priceCents: number | null;
    currency: string;

    platform: string;
    evidenceText: string;
    evidenceAt: Date;
    evidenceUrl: string | null;
    assetUrl: string | null;
  }): Promise<CreatedTicket>;
}

function assertNonEmpty(s: string, name: string) {
  if (!s || !s.trim()) throw new Error(`${name} is required`);
}

export async function createTicketFromEvidence(
  repo: TicketWriter,
  input: CreateTicketInput
): Promise<CreatedTicket> {
  if (!repo) throw new Error('repo is required');
  assertNonEmpty(input.ownerUserId, 'ownerUserId');

  const { evidence } = input;
  if (!evidence) throw new Error('evidence is required');
  assertNonEmpty(evidence.platform, 'evidence.platform');
  assertNonEmpty(evidence.text, 'evidence.text');
  if (
    !(evidence.evidenceAt instanceof Date) ||
    isNaN(evidence.evidenceAt.getTime())
  ) {
    throw new Error('evidence.evidenceAt must be a valid Date');
  }

  const currency = (input.pricing?.currency ?? 'USD').trim().toUpperCase();
  const priceCents =
    typeof input.pricing?.priceCents === 'number'
      ? input.pricing!.priceCents
      : null;

  if (
    priceCents !== null &&
    (!Number.isInteger(priceCents) || priceCents < 0)
  ) {
    throw new Error(
      'pricing.priceCents must be a non-negative integer (or omitted)'
    );
  }

  // Always start pending. (State machine governs later transitions.)
  return repo.createTicket({
    ownerUserId: input.ownerUserId,
    status: 'pending',

    priceCents,
    currency,

    platform: evidence.platform.trim(),
    evidenceText: evidence.text.trim(),
    evidenceAt: evidence.evidenceAt,
    evidenceUrl: evidence.evidenceUrl?.trim() ?? null,
    assetUrl: evidence.assetUrl?.trim() ?? null,
  });
}

export interface TicketReader {
  getTicketById(id: string): Promise<CreatedTicket | null>;
}

export interface TicketUpdater {
  updateTicketStatus(id: string, status: TicketStatus): Promise<CreatedTicket>;
}

/**
 * Approve a ticket. Allowed only from:
 * - pending -> approved
 */
export async function approveTicket(
  repo: TicketReader & TicketUpdater,
  ticketId: string
): Promise<CreatedTicket> {
  if (!repo) throw new Error('repo is required');
  if (!ticketId || !ticketId.trim()) throw new Error('ticketId is required');

  const existing = await repo.getTicketById(ticketId);
  if (!existing) throw new Error('Ticket not found');

  // Use the state machine (throws if illegal)
  const next = approve({ id: existing.id, status: existing.status });

  return repo.updateTicketStatus(existing.id, next.status);
}
