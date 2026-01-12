import { notFound } from 'next/navigation';
import { getPublicTicketById } from '@scopeshield/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function formatPrice(priceCents: number | null, currency: string): string {
  if (priceCents === null) return '—';
  return `${(priceCents / 100).toFixed(2)} ${currency}`;
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
    <main style={{ padding: 24 }}>
      <h1>Ticket</h1>
      <div style={{ marginTop: 12 }}>
        <div>
          <b>ID:</b> {ticket.id}
        </div>
        <div>
          <b>Status:</b> {ticket.status}
        </div>
        <div>
          <b>Price:</b> {formatPrice(ticket.priceCents, ticket.currency)}
        </div>
        <div>
          <b>Created:</b> {ticket.createdAt.toLocaleString()}
        </div>
        <div>
          <b>Updated:</b> {ticket.updatedAt.toLocaleString()}
        </div>
      </div>
      <p style={{ marginTop: 16 }}>
        Public view: intentionally hides evidence text, links, platform, and
        user identity.
      </p>
    </main>
  );
}
