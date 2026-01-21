import Stripe from 'stripe';

/**
 * Stripe Client initialization.
 * 
 * We use the latest version of the Stripe SDK.
 * The apiVersion is set to '2025-12-15.clover' as requested, 
 * but the SDK will automatically use the latest version if this is removed.
 * 
 * IMPORTANT: Ensure STRIPE_SECRET_KEY is set in your environment variables.
 */

const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  // We provide a helpful error if the API key is missing.
  console.error('ERROR: STRIPE_SECRET_KEY is not defined in the environment.');
}

// @ts-ignore - Clover version might not be in the local types yet but is supported by the SDK
export const stripeClient = new Stripe(stripeKey || 'placeholder_key_for_types', {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

/**
 * Helpful check for missing API key at runtime.
 */
export function ensureStripeKey() {
  if (!stripeKey) {
    throw new Error('Stripe API key is missing. Please set STRIPE_SECRET_KEY in your .env file.');
  }
}
