import { redirect } from 'next/navigation';
import { validateSession, revokeCurrentSession } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export default async function DashboardPage() {
  const s = await validateSession();
  if (!s) redirect('/login');

  async function logout() {
    'use server';
    await revokeCurrentSession();
    redirect('/login');
  }

  async function startCheckout() {
    'use server';
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

    if (session.url) redirect(session.url);
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Logged in as userId: {s.userId}</p>

      <form action={logout}>
        <button type="submit">Logout</button>
      </form>

      <form action={startCheckout} style={{ marginTop: 16 }}>
        <button type="submit">Test Stripe Checkout</button>
      </form>
    </main>
  );
}
