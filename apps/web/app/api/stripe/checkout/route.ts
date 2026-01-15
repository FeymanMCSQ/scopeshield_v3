import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  // For Mission 4.1 keep it simple: hard-coded test price
  // Later: derive amount from Ticket pricing and enforce auth/ownership.
  const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'ScopeShield Ticket Payment (Test)' },
          unit_amount: 500, // $5.00
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/pay/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/pay/cancel`,
  });

  return NextResponse.json({ ok: true, url: session.url });
}
