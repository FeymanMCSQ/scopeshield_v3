import { TicketStatus } from '../tickets';
export type CheckoutTicket = {
    id: string;
    status: TicketStatus;
    priceCents: number | null;
    currency: string;
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
export declare function createCheckoutForTicket(ticket: CheckoutTicket): CheckoutSpec;
/**
 * Domain rule: verify that the payment amount and currency match the ticket.
 */
export declare function verifyPaymentMatch(ticket: CheckoutTicket, paidAmount: number | null, paidCurrency: string | null): void;
/**
 * Domain rule: resolve the display currency label for captured revenue.
 * If multiple currencies are present, it returns "MIXED".
 */
export declare function resolveRevenueCurrency(distinctCurrencies: string[]): string;
