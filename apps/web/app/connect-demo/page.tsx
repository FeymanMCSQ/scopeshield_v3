import { stripeClient, ensureStripeKey } from '@scopeshield/domain';
import { userRepo } from '@scopeshield/db';
import { validateSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ConnectDemoPage({
  searchParams,
}: {
  searchParams: Promise<{ accountId?: string }>;
}) {
  const session = await validateSession();
  if (!session) {
    redirect('/login'); // Mock login path for this demo
  }

  const { userId } = session;
  const user = await userRepo.findUserById(userId);
  if (!user) {
    return <div>User not found.</div>;
  }

  const stripeAccountId = user.stripeAccountId;
  let accountInfo = null;
  let onboardingComplete = false;
  let readyToProcessPayments = false;

  if (stripeAccountId) {
    try {
      ensureStripeKey();
      // Directly retrieve account status from API as requested.
      const account = await stripeClient.v2.core.accounts.retrieve(stripeAccountId, {
        include: ["configuration.merchant", "requirements"],
      });

      readyToProcessPayments = account?.configuration?.merchant?.capabilities?.card_payments?.status === "active";
      
      const requirementsStatus = account.requirements?.summary?.minimum_deadline?.status;
      onboardingComplete = requirementsStatus !== "currently_due" && requirementsStatus !== "past_due";
      
      accountInfo = {
        id: account.id,
        displayName: account.display_name,
        email: account.contact_email,
        status: readyToProcessPayments ? 'Ready to process payments' : 'Pending onboarding requirements',
      };
    } catch (e: any) {
      console.error('Failed to retrieve stripe account:', e.message);
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Stripe Connect Demo</h1>

      <section style={{ marginBottom: '2rem', border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
        <h2>Connected Account Status</h2>
        {!stripeAccountId ? (
          <div>
            <p>You haven't set up a Stripe account yet.</p>
            <OnboardButton />
          </div>
        ) : (
          <div>
            <p><strong>Account ID:</strong> {accountInfo?.id}</p>
            <p><strong>Display Name:</strong> {accountInfo?.displayName}</p>
            <p><strong>Status:</strong> {accountInfo?.status}</p>
            {!onboardingComplete && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ color: '#d97706' }}>Action required: Please complete your onboarding to collect payments.</p>
                <OnboardButton label="Complete Onboarding" />
              </div>
            )}
            {onboardingComplete && <p style={{ color: '#059669' }}>Onboarding complete!</p>}
          </div>
        )}
      </section>

      {stripeAccountId && onboardingComplete && (
        <section style={{ marginBottom: '2rem', border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
          <h2>Manage Products</h2>
          <p>Create products that will be stored on your connected account.</p>
          <ProductForm accountId={stripeAccountId} />
          <div style={{ marginTop: '1rem' }}>
             <a href={`/connect-demo/store/${stripeAccountId}`} style={{ color: '#2563eb', textDecoration: 'underline' }}>
               View your storefront
             </a>
          </div>
        </section>
      )}

      <section style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
        <h2>Platform Subscription</h2>
        <p>Current Status: <strong>{user.subscriptionStatus || 'none'}</strong></p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <SubscribeButton />
          {user.subscriptionStatus !== 'none' && <PortalButton accountId={stripeAccountId!} />}
        </div>
      </section>
    </div>
  );
}

// Client components for interactivity would typically be in separate files, 
// but for this demo integration we include them here with 'use client' logic simulated or explained.

function OnboardButton({ label = "Onboard to collect payments" }) {
  // In a real app, this would be a client component with a click handler.
  // Here we use a form to handle the POST request to our API.
  return (
    <form action="/api/stripe/onboard" method="POST">
      <button type="submit" style={{ 
        backgroundColor: '#6366f1', 
        color: 'white', 
        padding: '0.5rem 1rem', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer' 
      }}>
        {label}
      </button>
    </form>
  );
}

function ProductForm({ accountId }: { accountId: string }) {
  return (
    <form action="/api/stripe/products/create" method="POST" style={{ display: 'grid', gap: '0.5rem' }}>
      <input type="hidden" name="accountId" value={accountId} />
      <input name="name" placeholder="Product Name" required style={{ padding: '0.5rem' }} />
      <textarea name="description" placeholder="Description" style={{ padding: '0.5rem' }} />
      <input name="price" type="number" placeholder="Price (USD)" required style={{ padding: '0.5rem' }} />
      <button type="submit" style={{ 
        backgroundColor: '#059669', 
        color: 'white', 
        padding: '0.5rem 1rem', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer' 
      }}>
        Create Product
      </button>
    </form>
  );
}

function SubscribeButton() {
  return (
    <form action="/api/stripe/subscribe" method="POST">
      <button type="submit" style={{ 
        backgroundColor: '#2563eb', 
        color: 'white', 
        padding: '0.5rem 1rem', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer' 
      }}>
        Subscribe to Platform
      </button>
    </form>
  );
}

function PortalButton({ accountId }: { accountId: string }) {
  return (
    <form action="/api/stripe/portal" method="POST">
      <input type="hidden" name="accountId" value={accountId} />
      <button type="submit" style={{ 
        backgroundColor: '#4b5563', 
        color: 'white', 
        padding: '0.5rem 1rem', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer' 
      }}>
        Manage Subscription (Portal)
      </button>
    </form>
  );
}
