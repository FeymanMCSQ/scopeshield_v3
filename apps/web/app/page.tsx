import Link from "next/link";
import { ArrowRight, Shield, DollarSign, Clock } from "lucide-react";

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen bg-white text-emerald-950 font-sans">
            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 sm:py-32 max-w-5xl mx-auto">
                <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 mb-8">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-600 mr-2"></span>
                    Scope Creep is costing you money.
                </div>

                <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-br from-emerald-900 to-emerald-600 bg-clip-text text-transparent">
                    Capture billable work <br /> directly from chat.
                </h1>

                <p className="text-xl text-emerald-800/80 max-w-2xl mb-12 leading-relaxed">
                    The client sends a "quick request" on WhatsApp or Slack. You do it for free.
                    <br className="hidden sm:block" />
                    <span className="font-semibold text-emerald-900">Stop that.</span> ScopeShield turns chat messages into paid tickets in 2 clicks.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                    >
                        Get Started <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                    <Link
                        href="/sign-in"
                        className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-emerald-900 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-200"
                    >
                        Log In
                    </Link>
                </div>
            </section>

            {/* Features Grid */}
            <section className="bg-emerald-50/50 py-24 border-t border-emerald-100">
                <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-12">
                    {/* Feature 1 */}
                    <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-12 w-12 bg-emerald-100/50 rounded-lg flex items-center justify-center mb-6 text-emerald-700">
                            <Shield className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Defend Your Boundaries</h3>
                        <p className="text-emerald-800/70 leading-relaxed">
                            Politely push back on out-of-scope work without awkward conversations. Turn "just this once" into a professional change order.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-12 w-12 bg-emerald-100/50 rounded-lg flex items-center justify-center mb-6 text-emerald-700">
                            <Clock className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Save Hours of Admin</h3>
                        <p className="text-emerald-800/70 leading-relaxed">
                            No more copying and pasting into Trello or Jira. One click in the extension creates a ticket and generates a payment link.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-12 w-12 bg-emerald-100/50 rounded-lg flex items-center justify-center mb-6 text-emerald-700">
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Get Paid Instantly</h3>
                        <p className="text-emerald-800/70 leading-relaxed">
                            Don't wait for the monthly invoice. Send a micro-invoice for the task immediately. Better cash flow, happier you.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 text-center text-emerald-900/40 text-sm border-t border-emerald-100">
                <p>&copy; {new Date().getFullYear()} ScopeShield. Built to save your sanity.</p>
            </footer>
        </div>
    );
}
