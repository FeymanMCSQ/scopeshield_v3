import { NextResponse } from 'next/server';
import { stripeClient, ensureStripeKey } from '@scopeshield/domain';
import { userRepo } from '@scopeshield/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/stripe/onboard
 * 
 * This endpoint handles the creation of a Stripe Connected Account
 * and returns an onboarding link.
 */
export async function POST(req: Request) {
  try {
    ensureStripeKey();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    let accountId = user.stripeAccountId;

    // 1. Create Connected Account if it doesn't exist
    if (!accountId) {
      const { country } = await req.json().catch(() => ({ country: 'US' })); // Default fallback if direct call

      /**
       * Creating Connected Accounts using the Classic (V1) API.
       * This is more stable for Express accounts across regions.
       */
      const account = await stripeClient.accounts.create({
        type: 'express',
        country: country || 'US',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        settings: {
          payouts: {
            schedule: {
              interval: 'manual',
            },
          },
        },
      });

      accountId = account.id;

      // Store a mapping from the user to the account ID in our DB
      await userRepo.updateStripeAccount(userId, accountId);
    }

    // 2. Generate Account Link for onboarding
    const origin = new URL(req.url).origin;
    const accountLink = await stripeClient.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/connect-demo`,
      return_url: `${origin}/connect-demo?accountId=${accountId}`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
