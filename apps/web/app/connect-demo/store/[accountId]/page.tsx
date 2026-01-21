import { stripeClient, ensureStripeKey } from '@scopeshield/domain';
import { notFound } from 'next/navigation';

/**
 * Storefront page for a connected account.
 * URL: /connect-demo/store/[accountId]
 */
export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const accountId = (await params).accountId;

  try {
    ensureStripeKey();

    /**
     * Retrieve products for the connected account using the Stripe-Account header.
     * We expand the default_price to get the pricing details.
     */
    const products = await stripeClient.products.list({
        limit: 20,
        active: true,
        expand: ['data.default_price'],
    }, {
        stripeAccount: accountId,
    });

    /**
     * Retrieve the account info to show the store name.
     */
    const account = await stripeClient.accounts.retrieve(accountId);

    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
        <h1>Storefront: {account.settings?.dashboard?.display_name || 'My Store'}</h1>
        <p>Browse products and make a purchase directly from this merchant.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          {products.data.map((product) => (
            <div key={product.id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
              <h3>{product.name}</h3>
              <p style={{ color: '#666' }}>{product.description}</p>
              <p style={{ fontWeight: 'bold' }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.default_price && typeof product.default_price !== 'string' ? product.default_price.currency : 'USD' }).format((product.default_price && typeof product.default_price !== 'string' ? product.default_price.unit_amount || 0 : 0) / 100)}
              </p>
              
              <form action="/api/stripe/checkout" method="POST">
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="accountId" value={accountId} />
                <button type="submit" style={{ 
                  backgroundColor: '#6366f1', 
                  color: 'white', 
                  padding: '0.5rem 1rem', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  width: '100%'
                }}>
                  Buy Now
                </button>
              </form>
            </div>
          ))}
        </div>

        {products.data.length === 0 && <p>No products found for this store.</p>}
        
        <div style={{ marginTop: '2rem' }}>
          <a href="/connect-demo" style={{ color: '#2563eb' }}>Back to Dashboard</a>
        </div>
      </div>
    );
  } catch (e: any) {
    console.error('Storefront error:', e.message);
    return notFound();
  }
}
