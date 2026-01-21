import { NextResponse } from 'next/server';
import { stripeClient, ensureStripeKey } from '@scopeshield/domain';
import { validateSession } from '@/lib/auth';
import { userRepo } from '@scopeshield/db';

/**
 * POST /api/stripe/portal
 * 
 * Creates a Billing Portal session for the connected account.
 */
export async function POST(req: Request) {
  try {
    ensureStripeKey();

    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = session;
    const user = await userRepo.findUserById(userId);
    if (!user || !user.stripeAccountId) {
      return NextResponse.json({ error: 'Stripe account not set up' }, { status: 400 });
    }

    const origin = new URL(req.url).origin;

    /**
     * Create a billing portal session where the user can manage their subscription.
     */
    const portalSession = await stripeClient.billingPortal.sessions.create({
      customer_account: user.stripeAccountId,
      return_url: `${origin}/connect-demo`,
    });

    if (!portalSession.url) {
      throw new Error('Failed to create portal session URL');
    }

    return new Response(null, {
      status: 303,
      headers: { Location: portalSession.url },
    });
  } catch (error: any) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
