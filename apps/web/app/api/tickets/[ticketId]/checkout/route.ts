// apps/web/app/api/tickets/[ticketId]/checkout/route.ts
import { NextResponse } from 'next/server';

import { stripe } from '@/lib/stripe';
import { getCurrentUser } from '@/lib/auth';

// Adjust these imports to match your actual db exports
import { ticketRepo } from '@scopeshield/db'; // or wherever your repo is exported from

import { billing } from '@scopeshield/domain';

function getBaseUrl() {
  return process.env.APP_BASE_URL ?? 'http://localhost:3000';
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await ctx.params;

  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const baseUrl = getBaseUrl();

  // 1) Load ticket (private/full shape)
  const ticket = await ticketRepo.getTicketById(ticketId);

  if (!ticket) {
    return NextResponse.json({ error: 'NotFound' }, { status: 404 });
  }

  // 2) Ownership enforcement at the boundary
  if (ticket.ownerUserId !== session.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3) Domain decides if checkout is allowed + defines amount/metadata
  let spec;
  try {
    spec = billing.createCheckoutForTicket({
      id: ticket.id,
      status: ticket.status,
      priceCents: ticket.priceCents,
      currency: ticket.currency,
      ownerUserId: ticket.ownerUserId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'CheckoutNotAllowed';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // 4) Stripe session creation (server-side only)
  const stripeSession = await stripe.checkout.sessions.create({
    mode: 'payment',

    // Helps link Stripe session to your internal object
    client_reference_id: spec.clientReferenceId,
    metadata: spec.metadata,

    line_items: [
      {
        price_data: {
          currency: spec.currency,
          product_data: {
            name: `ScopeShield Ticket Payment`,
            description: `Ticket ${spec.ticketId}`,
          },
          unit_amount: spec.amountCents,
        },
        quantity: 1,
      },
    ],

    // Use placeholders per Stripe docs
    success_url: `${baseUrl}/pay/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/t/${spec.ticketId}`,
  });

  if (!stripeSession.url) {
    return NextResponse.json(
      { error: 'StripeSessionMissingUrl' },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    ticketId: spec.ticketId,
    sessionId: stripeSession.id,
    url: stripeSession.url,
  });
}
