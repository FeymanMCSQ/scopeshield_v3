import { getCurrentUser } from '@/lib/auth';
import { userRepo } from '@scopeshield/db';
import { redirect } from 'next/navigation';

export default async function NewTicketPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const user = await userRepo.findUserById(session.id);

  if (!user?.stripeAccountId) {
    // Force them to onboard first (or we could show a warning)
    // For now, let's just show a message or redirect back to dashboard
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'system-ui, sans-serif' }}>
        <h1>Setup Required</h1>
        <p>You need to connect your Stripe account before creating manual tickets.</p>
        <a href="/dashboard" style={{ color: '#2563eb' }}>Back to Dashboard</a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Create New Ticket</h1>

      <form action="/api/dashboard/tickets/create" method="POST" style={{ display: 'grid', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Request Description</label>
          <textarea
            name="description"
            required
            placeholder="e.g. Change the header color to blue..."
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Price (USD)</label>
          <input
            type="number"
            name="price"
            required
            min="1"
            step="0.01"
            placeholder="35.00"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px'
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '0.75rem',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Create Ticket
        </button>
      </form>

      <div style={{ marginTop: '2rem' }}>
        <a href="/dashboard" style={{ color: '#6b7280', textDecoration: 'none' }}>&larr; Cancel and return to dashboard</a>
      </div>
    </div>
  );
}
