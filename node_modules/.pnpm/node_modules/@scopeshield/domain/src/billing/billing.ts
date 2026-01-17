// packages/domain/src/billing/billing.ts

import { TicketStatus } from '../tickets';


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

/**
 * Domain rule: verify that the payment amount and currency match the ticket.
 */
export function verifyPaymentMatch(
  ticket: CheckoutTicket,
  paidAmount: number | null,
  paidCurrency: string | null
): void {
  const expectedAmount = ticket.priceCents;
  if (expectedAmount == null) {
    throw new Error('MISSING_EXPECTED_AMOUNT');
  }

  if (paidAmount !== expectedAmount) {
    throw new Error('AMOUNT_MISMATCH');
  }

  const expectedCurrency = (ticket.currency ?? 'USD').toLowerCase();
  const actualCurrency = (paidCurrency ?? '').toLowerCase();
  if (actualCurrency !== expectedCurrency) {
    throw new Error('CURRENCY_MISMATCH');
  }
}

/**
 * Domain rule: resolve the display currency label for captured revenue.
 * If multiple currencies are present, it returns "MIXED".
 */
export function resolveRevenueCurrency(distinctCurrencies: string[]): string {
  if (distinctCurrencies.length === 0) return 'USD';
  if (distinctCurrencies.length === 1) return distinctCurrencies[0];
  return 'MIXED';
}
