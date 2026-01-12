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
