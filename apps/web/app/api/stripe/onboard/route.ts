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
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let accountId = user.stripeAccountId;

    // 1. Create Connected Account if it doesn't exist
    if (!accountId) {
      /**
       * Creating Connected Accounts using the V2 API.
       * We follow the provided properties strictly.
       */
      const account = await stripeClient.v2.core.accounts.create({
        display_name: user.name || user.email,
        contact_email: user.email,
        // defaults: { ... } removed to avoid "not a merchant" error.
        // We let the onboarding flow settle these details.

      });

      accountId = account.id;

      // Store a mapping from the user to the account ID in our DB
      await userRepo.updateStripeAccount(userId, accountId);
    }

    // 2. Generate Account Link for onboarding
    /**
     * Use the V2 account links API to create an account link.
     */
    const origin = new URL(req.url).origin;
    const accountLink = await stripeClient.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: 'account_onboarding',
        account_onboarding: {
          configurations: ['merchant', 'customer'],
          refresh_url: `${origin}/connect-demo`,
          return_url: `${origin}/connect-demo?accountId=${accountId}`,
        },
      },
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
