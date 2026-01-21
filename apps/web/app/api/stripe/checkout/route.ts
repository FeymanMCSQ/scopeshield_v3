import { NextResponse } from 'next/server';
import { stripeClient, ensureStripeKey } from '@scopeshield/domain';

/**
 * POST /api/stripe/checkout
 * 
 * Creates a Checkout Session for a direct charge on the connected account.
 */
export async function POST(req: Request) {
  try {
    ensureStripeKey();

    const formData = await req.formData();
    const productId = formData.get('productId') as string;
    const accountId = formData.get('accountId') as string;

    if (!productId || !accountId) {
      return NextResponse.json({ error: 'Missing productId or accountId' }, { status: 400 });
    }

    /**
     * Retrieve the product to get the price ID.
     */
    const product = await stripeClient.products.retrieve(productId, {
      stripeAccount: accountId,
    });

    const priceId = typeof product.default_price === 'string' ? product.default_price : product.default_price?.id;

    if (!priceId) {
      return NextResponse.json({ error: 'Product has no default price' }, { status: 400 });
    }

    const origin = new URL(req.url).origin;

    /**
     * Create a Direct Charge using Stripe Checkout.
     */
    const session = await stripeClient.checkout.sessions.create(
      {
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${origin}/connect-demo/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/connect-demo/store/${accountId}`,
      },
      {
        stripeAccount: accountId, // Using stripeAccount for the Stripe-Account header
      }
    );

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return redirectWithLocation(session.url);
  } catch (error: any) {
    console.error('Checkout creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function redirectWithLocation(url: string) {
  return new Response(null, {
    status: 303,
    headers: { Location: url },
  });
}
