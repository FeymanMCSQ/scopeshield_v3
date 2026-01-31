
import { getCurrentUser } from '@/lib/auth';
import { CreditCard, Lock } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    // 1. Auth Check (handled by middleware mostly, but good to have)
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Link href="/sign-in" className="text-emerald-600 font-medium hover:underline">
                    Please Sign In
                </Link>
            </div>
        );
    }

    // 2. Subscription Logic
    const status = user.subscriptionStatus; // 'active', 'trialing', 'past_due', 'canceled', 'none'
    const isSubscribed = status === 'active' || status === 'trialing';

    // 3. Implicit Trial Logic (14 Days)
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const daysSinceCreation = (Date.now() - new Date(user.createdAt).getTime()) / MS_PER_DAY;
    const isImplicitTrial = daysSinceCreation < 14;

    const hasAccess = isSubscribed || isImplicitTrial;
    const trialDaysRemaining = Math.max(0, Math.ceil(14 - daysSinceCreation));

    // 4. BLOCK if no access
    if (!hasAccess) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Trial Expired</h2>
                    <p className="text-gray-500 mb-8">
                        Your 14-day free trial has ended. To continue using ScopeShield and managing your tickets, please upgrade to Pro.
                    </p>

                    <div className="bg-emerald-50 p-4 rounded-xl mb-8 text-left">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-emerald-900">ScopeShield Pro</span>
                            <span className="font-bold text-emerald-700">$10/mo</span>
                        </div>
                        <ul className="text-sm text-emerald-800/80 space-y-1">
                            <li>• Unlimited Tickets</li>
                            <li>• Stripe Connect Integration</li>
                            <li>• Priority Support</li>
                        </ul>
                    </div>

                    <form action="/api/stripe/subscribe" method="POST">
                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                        >
                            <CreditCard className="w-5 h-5" />
                            Subscribe Now
                        </button>
                    </form>

                    <p className="mt-4 text-xs text-gray-400">
                        Secure payment processed by Stripe. Cancel anytime.
                    </p>
                </div>
            </div>
        );
    }

    // 5. ALLOW Access (with optional Banner for Implicit Trial)
    return (
        <div className="relative">
            {/* Trial Banner */}
            {!isSubscribed && isImplicitTrial && (
                <div className="bg-indigo-600 text-white text-xs font-medium py-2 px-4 text-center">
                    You are on a free trial. {trialDaysRemaining} days remaining.
                    <form action="/api/stripe/subscribe" method="POST" className="inline-block ml-3">
                        <button type="submit" className="underline hover:text-indigo-100 cursor-pointer">
                            Upgrade now
                        </button>
                    </form>
                </div>
            )}

            {children}
        </div>
    );
}
