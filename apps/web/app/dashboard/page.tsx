// apps/web/app/dashboard/page.tsx
import Link from 'next/link';
import { requireSession } from '@/lib/authGuard';
import { tickets, billing } from '@scopeshield/domain';


// Adjust import path to match your workspace exports:
import { listTicketsForOwner, getRecapturedRevenueMetrics } from '@scopeshield/db';

type SearchParams = {
  cursor?: string;
  status?: string;
  limit?: string;
};

const ALLOWED_STATUSES = ['all', ...tickets.TICKET_STATUSES] as const;
type StatusFilter = (typeof ALLOWED_STATUSES)[number];


function clampLimit(v: string | undefined): number {
  const n = v ? Number(v) : 20;
  if (!Number.isFinite(n) || !Number.isInteger(n)) return 20;
  return Math.min(Math.max(n, 1), 100);
}

function normalizeStatus(v: string | undefined): StatusFilter {
  if (!v) return 'all';
  const x = v.toLowerCase();
  return (ALLOWED_STATUSES as readonly string[]).includes(x)
    ? (x as StatusFilter)
    : 'all';
}

function fmtMoney(priceCents: number | null, currency: string) {
  if (priceCents == null) return '—';
  const amount = (priceCents / 100).toFixed(2);
  return `${currency.toUpperCase()} ${amount}`;
}

function fmtDate(d: Date) {
  // Minimal, readable. Avoid heavy formatting libs.
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(d));
}

function fmtMoneyCents(cents: number, currency: string) {
  if (currency === 'MIXED') return `${(cents / 100).toFixed(2)} (mixed currencies)`;
  return `${currency.toUpperCase()} ${(cents / 100).toFixed(2)}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const session = await requireSession();

  const limit = clampLimit(sp.limit);
  const status = normalizeStatus(sp.status);
  const cursor = sp.cursor;

  const [ticketData, revenue] = await Promise.all([
    listTicketsForOwner({
      ownerUserId: session.userId,
      limit,
      cursor: cursor || undefined,
      status: status === 'all' ? undefined : (status as tickets.TicketStatus),
    }),
    getRecapturedRevenueMetrics({ ownerUserId: session.userId }),
  ]);

  const { items, nextCursor } = ticketData;

  // Build query helper
  const baseQuery = (overrides: Partial<SearchParams> = {}) => {
    const q = new URLSearchParams();
    const finalStatus = overrides.status ?? status;
    const finalLimit = overrides.limit ?? String(limit);

    if (finalStatus && finalStatus !== 'all') q.set('status', finalStatus);
    if (finalLimit) q.set('limit', finalLimit);

    if (overrides.cursor) q.set('cursor', overrides.cursor);
    // If overrides.cursor is explicitly undefined, omit cursor (go back to first page)
    if (overrides.cursor === undefined) q.delete('cursor');

    return `/dashboard?${q.toString()}`;
  };

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
        Dashboard
      </h1>

      <section
        style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}
      >
        <div
          style={{
            border: '1px solid #e5e5e5',
            borderRadius: 12,
            padding: 12,
            minWidth: 220,
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.7 }}>Recaptured revenue</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
            {fmtMoneyCents(
              revenue.totalPaidCents,
              billing.resolveRevenueCurrency(revenue.currencies)
            )}

          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            Paid tickets: {revenue.paidCount}
          </div>
        </div>
      </section>

      <section
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          User: <code>{session.userId}</code>
        </div>

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {/* Status filters */}
          {ALLOWED_STATUSES.map((s) => {
            const active = s === status;
            return (
              <Link
                key={s}
                href={baseQuery({ status: s, cursor: undefined })}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: 12,
                  background: active ? '#f3f3f3' : 'transparent',
                  color: 'inherit',
                }}
              >
                {s}
              </Link>
            );
          })}
        </div>
      </section>

      <section
        style={{
          border: '1px solid #e5e5e5',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: 12,
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600 }}>Tickets</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Showing {items.length} / {limit}
          </div>

          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.7 }}>Limit:</div>
            {[10, 20, 50, 100].map((n) => (
              <Link
                key={n}
                href={baseQuery({ limit: String(n), cursor: undefined })}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: 12,
                  background: n === limit ? '#f3f3f3' : 'transparent',
                  color: 'inherit',
                }}
              >
                {n}
              </Link>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', fontSize: 12, opacity: 0.8 }}>
                <th style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                  Status
                </th>
                <th style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                  Price
                </th>
                <th style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                  Created
                </th>
                <th style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                  Updated
                </th>
                <th style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                  Link
                </th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ padding: 12, fontSize: 13, opacity: 0.75 }}
                  >
                    No tickets found.
                  </td>
                </tr>
              ) : (
                items.map((t) => (
                  <tr key={t.id} style={{ fontSize: 13 }}>
                    <td
                      style={{ padding: 12, borderBottom: '1px solid #f2f2f2' }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 999,
                          border: '1px solid #ddd',
                          fontSize: 12,
                        }}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td
                      style={{ padding: 12, borderBottom: '1px solid #f2f2f2' }}
                    >
                      {fmtMoney(t.priceCents, t.currency)}
                    </td>
                    <td
                      style={{ padding: 12, borderBottom: '1px solid #f2f2f2' }}
                    >
                      {fmtDate(t.createdAt)}
                    </td>
                    <td
                      style={{ padding: 12, borderBottom: '1px solid #f2f2f2' }}
                    >
                      {fmtDate(t.updatedAt)}
                    </td>
                    <td
                      style={{ padding: 12, borderBottom: '1px solid #f2f2f2' }}
                    >
                      <Link
                        href={`/t/${t.id}`}
                        style={{ textDecoration: 'none' }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            padding: 12,
            display: 'flex',
            gap: 10,
            justifyContent: 'space-between',
          }}
        >
          {/* Reset to first page */}
          <Link
            href={baseQuery({ cursor: undefined })}
            style={{ fontSize: 12, textDecoration: 'none' }}
          >
            First page
          </Link>

          {/* Next page */}
          {nextCursor ? (
            <Link
              href={baseQuery({ cursor: nextCursor })}
              style={{ fontSize: 12, textDecoration: 'none' }}
            >
              Next →
            </Link>
          ) : (
            <span style={{ fontSize: 12, opacity: 0.5 }}>Next →</span>
          )}
        </div>
      </section>
    </main>
  );
}
