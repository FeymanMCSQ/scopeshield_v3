import { NextResponse } from 'next/server';
import { stripeClient, ensureStripeKey } from '@scopeshield/domain';
import { getCurrentUser } from '@/lib/auth';
import { userRepo } from '@scopeshield/db';

/**
 * POST /api/stripe/subscribe
 * 
 * Creates a subscription Checkout Session for the connected account on the platform.
 */
export async function POST(req: Request) {
  try {
    ensureStripeKey();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user || !user.stripeAccountId) {
      return NextResponse.json({ error: 'Stripe account not set up' }, { status: 400 });
    }

    const origin = new URL(req.url).origin;

    /**
     * Creating a platform subscription for the connected account.
     * With V2 accounts, the account ID (acct_...) acts as the customer ID.
     */
    const checkoutSession = await stripeClient.checkout.sessions.create({
      customer_account: user.stripeAccountId,
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        },
      ],
      subscription_data: {
        // No Stripe trial, because we give an implicit 14-day trial in the app before blocking.
        // When they pay here, it starts billing immediately.
      },
      success_url: `${origin}/connect-demo/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/connect-demo`,
    });

    if (!checkoutSession.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return new Response(null, {
      status: 303,
      headers: { Location: checkoutSession.url },
    });
  } catch (error: any) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
