// apps/web/app/dashboard/page.tsx
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { tickets, billing } from '@scopeshield/domain';
import { Check, Clock, Plus, ArrowRight, DollarSign, ListFilter, CreditCard } from 'lucide-react';

// Adjust import path to match your workspace exports:
import { listTicketsForOwner, getRecapturedRevenueMetrics, userRepo } from '@scopeshield/db';

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
  if (currency === 'MIXED') return `${(cents / 100).toFixed(2)} (mixed)`;
  return `${currency.toUpperCase()} ${(cents / 100).toFixed(2)}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const session = await getCurrentUser();

  if (!session) return null;

  const limit = clampLimit(sp.limit);
  const status = normalizeStatus(sp.status);
  const cursor = sp.cursor;

  const [ticketData, revenue, user] = await Promise.all([
    listTicketsForOwner({
      ownerUserId: session.id,
      limit,
      cursor: cursor || undefined,
      status: status === 'all' ? undefined : (status as tickets.TicketStatus),
    }),
    getRecapturedRevenueMetrics({ ownerUserId: session.id }),
    userRepo.findUserById(session.id),
  ]);

  const { items, nextCursor } = ticketData;
  const stripeConnected = !!user?.stripeAccountId;

  // Build query helper
  const baseQuery = (overrides: Partial<SearchParams> = {}) => {
    const q = new URLSearchParams();
    const finalStatus = overrides.status ?? status;
    const finalLimit = overrides.limit ?? String(limit);

    if (finalStatus && finalStatus !== 'all') q.set('status', finalStatus);
    if (finalLimit) q.set('limit', finalLimit);

    if (overrides.cursor) q.set('cursor', overrides.cursor);
    if (overrides.cursor === undefined) q.delete('cursor');

    return `/dashboard?${q.toString()}`;
  };

  return (
    <main className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-emerald-950 tracking-tight">Dashboard</h1>
            <p className="text-emerald-900/60 mt-2">Manage your tickets and revenue.</p>
          </div>

          <div className="flex items-center gap-4">
            {!stripeConnected ? (
              <form action="/api/stripe/onboard" method="POST">
                <button type="submit" className="flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-sm font-medium">
                  <CreditCard className="w-4 h-4 mr-2" /> Connect Stripe
                </button>
              </form>
            ) : (
              <>
                <div className="hidden md:flex items-center px-3 py-1 bg-emerald-100/50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200/50">
                  <Check className="w-3 h-3 mr-1.5" /> Stripe Connected
                </div>
                <Link href="/dashboard/new" className="flex items-center px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-sm shadow-emerald-600/20 font-medium">
                  <Plus className="w-4 h-4 mr-2" /> Create Ticket
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-emerald-900/60">Recaptured Revenue</span>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-emerald-950 mb-1">
              {fmtMoneyCents(
                revenue.totalPaidCents,
                billing.resolveRevenueCurrency(revenue.currencies)
              )}
            </div>
            <div className="text-sm text-emerald-900/40">
              Across {revenue.paidCount} paid tickets
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="p-2 text-emerald-900/40">
            <ListFilter className="w-5 h-5" />
          </div>
          {ALLOWED_STATUSES.map((s) => {
            const active = s === status;
            return (
              <Link
                key={s}
                href={baseQuery({ status: s, cursor: undefined })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                    : 'bg-white text-emerald-900/60 hover:bg-emerald-50 border border-transparent hover:border-emerald-100'
                  }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Link>
            );
          })}
        </div>

        {/* Ticket List */}
        <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
          {items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex p-4 bg-emerald-50 rounded-full text-emerald-200 mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-emerald-950 mb-1">No tickets found</h3>
              <p className="text-emerald-900/40">Get started by creating your first ticket.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-emerald-100/50 bg-emerald-50/30">
                    <th className="px-6 py-4 text-xs font-semibold text-emerald-900/50 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-emerald-900/50 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-xs font-semibold text-emerald-900/50 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-xs font-semibold text-emerald-900/50 uppercase tracking-wider">Updated</th>
                    <th className="px-6 py-4 text-xs font-semibold text-emerald-900/50 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100/50">
                  {items.map((t) => (
                    <tr key={t.id} className="hover:bg-emerald-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${t.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            t.status === 'approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              t.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-emerald-950">
                        {fmtMoney(t.priceCents, t.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm text-emerald-900/60">
                        {fmtDate(t.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-emerald-900/60">
                        {fmtDate(t.updatedAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/t/${t.id}`} className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700">
                          View <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-emerald-100/50 flex items-center justify-between bg-emerald-50/20">
            <Link
              href={baseQuery({ cursor: undefined })}
              className={`text-sm font-medium ${!cursor ? 'text-gray-400 pointer-events-none' : 'text-emerald-600 hover:text-emerald-700'}`}
            >
              First page
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-900/40 mr-2">Rows per page:</span>
              {[10, 20, 50].map((n) => (
                <Link
                  key={n}
                  href={baseQuery({ limit: String(n), cursor: undefined })}
                  className={`px-2 py-1 rounded text-xs transition-colors ${n === limit
                      ? 'bg-emerald-100 text-emerald-800 font-medium'
                      : 'text-emerald-900/40 hover:bg-emerald-50'
                    }`}
                >
                  {n}
                </Link>
              ))}
            </div>

            <Link
              href={nextCursor ? baseQuery({ cursor: nextCursor }) : '#'}
              className={`text-sm font-medium ${!nextCursor ? 'text-gray-400 pointer-events-none' : 'text-emerald-600 hover:text-emerald-700'}`}
            >
              Next Page &rarr;
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
