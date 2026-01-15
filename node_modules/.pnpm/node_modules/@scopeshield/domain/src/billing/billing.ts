// packages/domain/src/billing/billing.ts

export type TicketStatus = 'pending' | 'approved' | 'paid' | 'rejected';

export type CheckoutTicket = {
  id: string;
  status: TicketStatus;
  priceCents: number | null;
  currency: string; // e.g. "USD"
  ownerUserId: string;
};

export type CheckoutSpec = {
  ticketId: string;
  amountCents: number;
  currency: string;
  clientReferenceId: string;
  metadata: Record<string, string>;
};

/**
 * Domain rule: checkout is only valid when the ticket is approved AND has a price.
 * Domain also defines what metadata must be attached for downstream webhook reconciliation.
 */
export function createCheckoutForTicket(ticket: CheckoutTicket): CheckoutSpec {
  if (ticket.status !== 'approved') {
    throw new Error(
      `CheckoutNotAllowed: ticket must be approved to start checkout (status=${ticket.status})`
    );
  }

  if (ticket.priceCents == null) {
    throw new Error('CheckoutNotAllowed: ticket must have priceCents set');
  }

  if (!Number.isInteger(ticket.priceCents) || ticket.priceCents <= 0) {
    throw new Error(
      `CheckoutNotAllowed: invalid priceCents=${ticket.priceCents}`
    );
  }

  const currency = (ticket.currency || 'USD').toLowerCase();

  return {
    ticketId: ticket.id,
    amountCents: ticket.priceCents,
    currency,
    clientReferenceId: ticket.id,
    metadata: {
      // Minimum viable reconciliation keys
      ss_ticket_id: ticket.id,
      ss_owner_user_id: ticket.ownerUserId,
      ss_expected_amount_cents: String(ticket.priceCents),
      ss_currency: currency,
      ss_kind: 'ticket_checkout',
    },
  };
}
