import { NextResponse } from 'next/server';
import { stripeClient, ensureStripeKey } from '@scopeshield/domain';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/stripe/products/create
 * 
 * Creates a Stripe product on the connected account using the Stripe-Account header.
 */
export async function POST(req: Request) {
  try {
    ensureStripeKey();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Since this is a simple HTML form, we parse the body
    const formData = await req.formData();
    const accountId = formData.get('accountId') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);

    if (!accountId || !name || isNaN(price)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const priceInCents = Math.round(price * 100);

    /**
     * Use the stripeAccount header to create products on the connected account.
     */
    await stripeClient.products.create({
      name: name,
      description: description,
      default_price_data: {
        unit_amount: priceInCents,
        currency: 'usd',
      },
    }, {
      stripeAccount: accountId,
    });

    // In a real app, you would redirect back to the dashboard or show success.
    return new Response(null, {
      status: 303,
      headers: { Location: '/connect-demo' },
    });
  } catch (error: any) {
    console.error('Product creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
