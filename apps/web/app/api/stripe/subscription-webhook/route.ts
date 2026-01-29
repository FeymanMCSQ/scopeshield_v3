import { NextResponse } from 'next/server';
import { stripeClient } from '@scopeshield/domain';
import { userRepo } from '@scopeshield/db';

/**
 * POST /api/stripe/subscription-webhook
 * 
 * Handler for Stripe V1 events related to subscriptions.
 * These are standard Stripe events (not thin events).
 */
export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event;

  try {
    event = stripeClient.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const session = event.data.object as any;

  // With V2 accounts, we get the account ID from .customer_account or .customer
  // In our setup, we use stripeAccountId as the identifier.
  const stripeAccountId = session.customer_account || session.customer;

  console.log('Received V1 Event:', event.type, 'for account:', stripeAccountId);

  try {
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        console.log(`Subscription updated for ${stripeAccountId}. Status: ${session.status}`);
        const user = await userRepo.findUserByStripeAccountId(stripeAccountId);
        if (user) {
          await userRepo.updateSubscriptionStatus(user.id, session.status);
        } else {
          console.error(`User for Stripe account ${stripeAccountId} not found in DB`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        console.log(`Subscription deleted for ${stripeAccountId}`);
        const user = await userRepo.findUserByStripeAccountId(stripeAccountId);
        if (user) {
          await userRepo.updateSubscriptionStatus(user.id, 'none');
        }
        break;
      }

      case 'invoice.paid':
        console.log(`Invoice paid for ${stripeAccountId}`);
        break;

      case 'payment_method.attached':
        console.log(`Payment method attached to ${stripeAccountId}`);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Error processing webhook:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
