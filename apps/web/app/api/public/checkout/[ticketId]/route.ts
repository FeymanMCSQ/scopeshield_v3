import { NextResponse } from 'next/server';
import { stripeClient, ensureStripeKey } from '@scopeshield/domain';
import { ticketRepo, userRepo } from '@scopeshield/db';

/**
 * POST /api/public/checkout/[ticketId]
 * 
 * Public endpoint to start payment for a ticket.
 * No specific auth required (anyone with the link can pay), 
 * but we validate the ticket exists and has a price.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    ensureStripeKey();
    const { ticketId } = await params;

    // 1. Fetch Ticket
    const ticket = await ticketRepo.getTicketById(ticketId);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.status === 'paid') {
       return NextResponse.json({ error: 'Ticket is already paid' }, { status: 400 });
    }
    
    if (ticket.status === 'rejected') {
        return NextResponse.json({ error: 'Ticket is rejected' }, { status: 400 });
     }

    if (!ticket.priceCents || ticket.priceCents <= 0) {
      return NextResponse.json({ error: 'Ticket has no valid price' }, { status: 400 });
    }

    // 2. Fetch Owner (Merchant)
    const owner = await userRepo.findUserById(ticket.ownerUserId);
    if (!owner || !owner.stripeAccountId) {
      return NextResponse.json({ error: 'Merchant not ready to accept payments' }, { status: 400 });
    }

    const startUrl = new URL(req.url);
    const origin = startUrl.origin;
    
    // 3. Create Checkout Session (Direct Charge)
    const session = await stripeClient.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: ticket.currency.toLowerCase(),
              product_data: {
                name: `Ticket #${ticket.id.slice(0, 8)}`,
                description: ticket.evidenceText.slice(0, 100) + (ticket.evidenceText.length > 100 ? '...' : ''),
              },
              unit_amount: ticket.priceCents,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
            // Optional: Application fee could go here
            // application_fee_amount: 100, // e.g., $1.00 fee
        },
        metadata: {
          ss_ticket_id: ticket.id,
          ss_kind: 'ticket_checkout',
          ss_owner_user_id: ticket.ownerUserId,
        },
        success_url: `${origin}/t/${ticket.id}?payment_success=true`,
        cancel_url: `${origin}/t/${ticket.id}`,
      },
      {
        stripeAccount: owner.stripeAccountId, // <--- DIRECT CHARGE
      }
    );

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return new Response(null, {
      status: 303,
      headers: { Location: session.url },
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
