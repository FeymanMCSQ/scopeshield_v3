import { getCurrentUser } from '@/lib/auth';
import { userRepo } from '@scopeshield/db';
import { redirect } from 'next/navigation';
import { TicketForm } from './TicketForm';

export default async function NewTicketPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const user = await userRepo.findUserById(session.id);

  if (!user?.stripeAccountId) {
    return (
      <main className="min-h-screen bg-gray-50/50 pb-20 pt-12">
        <div className="max-w-xl mx-auto px-6 bg-white p-8 rounded-2xl border border-emerald-100 shadow-sm text-center">
          <h1 className="text-2xl font-bold text-emerald-950 mb-4">Setup Required</h1>
          <p className="text-emerald-900/60 mb-8">You need to connect your Stripe account before creating manual tickets.</p>
          <a href="/dashboard" className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-sm font-medium">Back to Dashboard</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-emerald-950 tracking-tight mb-8">Create New Ticket</h1>

        <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-sm">
          <TicketForm />
        </div>

        <div className="mt-8 text-center">
          <a href="/dashboard" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
            &larr; Cancel and return to dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
