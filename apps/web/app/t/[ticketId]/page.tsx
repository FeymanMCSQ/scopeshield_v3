// apps/web/app/t/[ticketId]/page.tsx

import { notFound } from 'next/navigation';
import { getPublicTicketById } from '@scopeshield/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function formatPrice(priceCents: number | null, currency: string): string {
  if (priceCents === null) return '—';
  const amount = (priceCents / 100).toFixed(2);
  return `${currency.toUpperCase()} ${amount}`;
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(d));
}

function statusBadgeStyle(status: string): React.CSSProperties {
  // Keep it neutral + minimal. No color system dependencies.
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 999,
    border: '1px solid #e5e7eb',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.2,
    background: '#fafafa',
    color: '#374151',
  };


  // Subtle differentiation without turning into a theme engine.
  if (status === 'paid')
    return { ...base, borderColor: '#bbf7d0', background: '#f0fdf4' };
  if (status === 'approved')
    return { ...base, borderColor: '#bfdbfe', background: '#eff6ff' };
  if (status === 'rejected')
    return { ...base, borderColor: '#fecaca', background: '#fef2f2' };
  return { ...base, borderColor: '#e5e7eb', background: '#fafafa' }; // pending/default
}

function row(label: string, value: React.ReactNode) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid #f1f5f9',
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 13 }}>{value}</div>
    </div>
  );
}

export default async function PublicTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const ticket = await getPublicTicketById(ticketId);
  if (!ticket) notFound();

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(1200px 600px at 20% -10%, #eef2ff 0%, rgba(238,242,255,0) 60%), radial-gradient(900px 500px at 90% 0%, #ecfeff 0%, rgba(236,254,255,0) 55%), #ffffff',
        padding: 24,
        color: '#111827', // Force dark text for contrast on light background
      }}
    >
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
              ScopeShield · Public ticket view
            </div>
            <h1 style={{ fontSize: 22, margin: 0, letterSpacing: -0.2 }}>
              Ticket
            </h1>
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
              Shareable summary of request and pricing. User identity remains
              protected.
            </div>

          </div>

          <div style={statusBadgeStyle(ticket.status)}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background:
                  ticket.status === 'paid'
                    ? '#16a34a'
                    : ticket.status === 'approved'
                      ? '#2563eb'
                      : ticket.status === 'rejected'
                        ? '#dc2626'
                        : '#64748b',
              }}
            />
            <span style={{ textTransform: 'uppercase' }}>{ticket.status}</span>
          </div>
        </header>

        {/* Main card */}
        <section
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 10px 30px rgba(2,6,23,0.06)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: 16, borderBottom: '1px solid #eef2f7' }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Ticket ID</div>
            <div
              style={{
                marginTop: 6,
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: 13,
                padding: '8px 10px',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                background: '#fafafa',
                color: '#374151',
                wordBreak: 'break-all',

              }}
            >
              {ticket.id}
            </div>
          </div>

          <div style={{ padding: 16 }}>
            {row(
              'Status',
              <span style={{ fontWeight: 600 }}>{ticket.status}</span>
            )}
            {row(
              'Price',
              <span style={{ fontWeight: 700 }}>
                {formatPrice(ticket.priceCents, ticket.currency)}
              </span>
            )}
            {row(
              'Description',
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5,
                  color: '#374151',
                }}
              >
                {ticket.evidenceText}
              </div>
            )}

            {row('Created', formatDate(ticket.createdAt))}
            {row('Updated', formatDate(ticket.updatedAt))}

            {ticket.assetUrl && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
                  Screenshot
                </div>
                <div
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: '#fafafa',
                  }}
                >
                  <img
                    src={ticket.assetUrl}
                    alt="Evidence screenshot"
                    style={{
                      display: 'block',
                      width: '100%',
                      maxHeight: 520,
                      objectFit: 'contain',
                      background: '#0b1220',
                    }}
                  />
                </div>
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                  Links, platform, and user identity are hidden in public view.
                </div>

              </div>
            )}

            {/* Approval Action */}
            {ticket.status === 'pending' && (
              <div style={{ marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Accept Quote</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Approve this scope and price to proceed.</div>
                  </div>

                  <form action={`/api/public/tickets/${ticket.id}/approve`} method="POST">
                    <button
                      type="submit"
                      style={{
                        backgroundColor: '#2563eb',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      Approve Quote
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Payment Action */}
            {ticket.status === 'approved' && ticket.priceCents && ticket.priceCents > 0 && (
              <div style={{ marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Ready to proceed?</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Secure payment via Stripe</div>
                  </div>

                  <form action={`/api/public/checkout/${ticket.id}`} method="POST">
                    <button
                      type="submit"
                      style={{
                        backgroundColor: '#16a34a',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    >
                      <span>Pay {formatPrice(ticket.priceCents, ticket.currency)}</span>
                      <span style={{ fontSize: '1.2em' }}>&rarr;</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Footer note */}
        <footer
          style={{
            marginTop: 14,
            fontSize: 12,
            opacity: 0.7,
            lineHeight: 1.5,
          }}
        >
          This page is intentionally minimal. If something looks missing, that’s
          the point: the public surface only exposes what a client needs to
          confirm status and price.
        </footer>
      </div>
    </main>
  );
}
