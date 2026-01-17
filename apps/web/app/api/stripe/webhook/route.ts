import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { stripe } from '@/lib/stripe';

// Adjust imports to match your actual package exports:
import { ticketRepo } from '@scopeshield/db';
import { tickets, billing } from '@scopeshield/domain';


export const runtime = 'nodejs'; // Stripe signature verification should run on Node

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function POST(req: Request) {
  const webhookSecret = mustGetEnv('STRIPE_WEBHOOK_SECRET');

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json(
      { error: 'MissingStripeSignature' },
      { status: 400 }
    );
  }

  // IMPORTANT: raw body needed for signature verification
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'InvalidSignature';
    return NextResponse.json(
      { error: `StripeWebhookError: ${msg}` },
      { status: 400 }
    );
  }

  // Only handle payment success for now
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  const md = session.metadata ?? {};
  const ticketId = md.ss_ticket_id || session.client_reference_id;

  if (!ticketId) {
    // Acknowledge to avoid endless retries, but log because it breaks reconciliation.
    console.error(
      'Stripe webhook: missing ticket id in metadata/client_reference_id',
      {
        eventId: event.id,
        sessionId: session.id,
      }
    );
    return NextResponse.json({ ok: true, warning: 'MissingTicketId' });
  }

  // Fetch ticket (private shape)
  const ticket = await ticketRepo.getTicketById(ticketId);

  if (!ticket) {
    console.error('Stripe webhook: ticket not found', {
      ticketId,
      eventId: event.id,
    });
    return NextResponse.json({ ok: true, warning: 'TicketNotFound' });
  }

  // Domain decides if amount/currency match (reconciliation truth)
  try {
    billing.verifyPaymentMatch(ticket, session.amount_total, session.currency);
  } catch (err) {
    console.error('Stripe webhook: payment mismatch', {
      ticketId,
      eventId: event.id,
      sessionId: session.id,
      error: err instanceof Error ? err.message : String(err),
      paidAmount: session.amount_total,
      expectedAmount: ticket.priceCents,
      paidCurrency: session.currency,
      expectedCurrency: ticket.currency,
    });
    return NextResponse.json({ ok: true, warning: 'PaymentMismatch' });
  }


  // Idempotency: if already paid, no-op.
  if (ticket.status === 'paid') {
    return NextResponse.json({ ok: true, ticketId, already: 'paid' });
  }

  // Domain decides legality (approved -> paid)
  let updated;
  try {
    updated = tickets.markPaidIdempotent(ticket);
  } catch (e) {
    // Ticket not in approved state etc.
    console.error('Stripe webhook: cannot mark paid due to domain rule', {
      ticketId,
      status: ticket.status,
      eventId: event.id,
      err: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ ok: true, warning: 'DomainRejectedMarkPaid' });
  }

  // Persist status
  await ticketRepo.updateTicketStatus(ticketId, updated.status);

  return NextResponse.json({ ok: true, ticketId, status: updated.status });
}
