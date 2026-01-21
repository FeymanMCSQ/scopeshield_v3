import { NextResponse } from 'next/server';
import { stripeClient } from '@scopeshield/domain';

/**
 * POST /api/stripe/v2-webhook
 * 
 * Handler for Stripe V2 Thin Events.
 * 
 * According to docs: https://docs.stripe.com/webhooks.md?snapshot-or-thin=thin
 * We must use thin events for V2 accounts.
 */
export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_V2_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let thinEvent;

  try {
    /**
     * Parse the thin event.
     * We cast to any because parseThinEvent is a newer method in the SDK.
     */
    thinEvent = (stripeClient as any).parseThinEvent(payload, sig, webhookSecret);

    /**
     * Fetch the full event data to understand the status.
     * We use the thin event ID to retrieve the full event from the V2 API.
     */
    const event = await stripeClient.v2.core.events.retrieve(thinEvent.id);

    console.log('Received V2 Event:', (event as any).type);

    // Handle v2.core.account[requirements].updated
    const eventType = (event as any).type;
    if (eventType === 'v2.core.account[requirements].updated') {
      const account = (event as any).data.object;
      console.log(`Account ${account.id} requirements updated.`);
      // Logic to notify user if they need to provide more info
    }

    // Handle capability updates
    if (eventType.includes('capability_status_updated')) {
      const account = (event as any).data.object;
      console.log(`Account ${account.id} capability status updated.`);
      // Logic to update local status if we were caching it (not recommended for this demo)
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }
}
