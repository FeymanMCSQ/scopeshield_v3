import Link from 'next/link';

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id: string }>;
}) {
  const sessionId = (await searchParams).session_id;

  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ 
        backgroundColor: '#ecfdf5', 
        color: '#065f46', 
        padding: '2rem', 
        borderRadius: '12px', 
        display: 'inline-block',
        maxWidth: '500px'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉 Success!</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>
          Your payment or subscription was processed successfully.
        </p>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Session ID: <code>{sessionId}</code>
        </p>
        
        <Link 
          href="/connect-demo" 
          style={{ 
            backgroundColor: '#059669', 
            color: 'white', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '6px', 
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
