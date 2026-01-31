
import { Check, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar'; // Reuse navbar for consistency

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Assuming Navbar handles auth state internally or we can just render it */}
            {/* If Navbar is not exported or needs auth props, we might need a wrapper. 
          For now, let's just make a simple header if Navbar isn't easily reusable here 
          without context, but based on previous steps, Navbar is in components. */}
            {/* <Navbar /> -- let's keep it clean for now, just the pricing content. */}

            <div className="max-w-7xl mx-auto px-6 py-24">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Start with a 14-day free trial. Upgrade to Pro for unlimited access.
                    </p>
                </div>

                <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-emerald-100">
                    <div className="p-8 bg-emerald-50/50 border-b border-emerald-100">
                        <h3 className="text-lg font-semibold text-emerald-900 mb-2">ScopeShield Pro</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-gray-900">$10</span>
                            <span className="text-gray-500">/month</span>
                        </div>
                        <p className="mt-4 text-emerald-800/80 text-sm">
                            Everything you need to capture evidence and get paid securely.
                        </p>
                    </div>

                    <div className="p-8">
                        <ul className="space-y-4 mb-8">
                            {[
                                'Unlimited Ticket Creation',
                                'Stripe Connect Integration',
                                'Direct Payments to Your Bank',
                                'Proof-of-Work Evidence Logs',
                                'Priority Support'
                            ].map((feature) => (
                                <li key={feature} className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-gray-700">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <form action="/api/stripe/subscribe" method="POST">
                            <button
                                type="submit"
                                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                            >
                                <CreditCard className="w-5 h-5" />
                                Subscribe Now
                            </button>
                        </form>

                        <p className="mt-4 text-center text-xs text-gray-400">
                            14-day free trial included for new accounts.
                        </p>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <Link href="/dashboard" className="text-emerald-600 font-medium hover:underline">
                        &larr; Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
