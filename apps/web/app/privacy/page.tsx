import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-gray-50/50">
            {/* Header Background */}
            <div className="bg-emerald-900 pb-24 pt-12 px-6">
                <div className="max-w-3xl mx-auto">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm font-medium text-emerald-100 hover:text-white mb-8 transition-colors bg-emerald-800/50 px-3 py-1.5 rounded-full"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Home
                    </Link>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-800/50 rounded-2xl border border-emerald-700/50">
                            <Shield className="w-8 h-8 text-emerald-400" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Privacy Policy</h1>
                    <p className="text-emerald-200/80 max-w-lg">
                        Transparent, secure, and clear. We believe in protecting your data as vigorously as we protect your scope.
                    </p>
                </div>
            </div>

            {/* Content Card */}
            <div className="px-6 -mt-16 pb-20">
                <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl border border-emerald-100 shadow-xl shadow-emerald-900/5">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-8">
                        <div className="text-sm text-gray-400">
                            Last Updated: <span className="text-gray-900 font-medium">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            v1.0
                        </div>
                    </div>

                    <div className="prose prose-emerald prose-headings:font-bold prose-h2:text-2xl prose-h2:tracking-tight prose-p:text-gray-600 prose-li:text-gray-600 max-w-none">
                        <section className="mb-10">
                            <h2 className="flex items-center gap-3 text-emerald-950">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">1</span>
                                Introduction
                            </h2>
                            <p>
                                ScopeShield ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how our browser extension and web application collect, use, and safeguard your information. We operate on the principle of minimal data collection—we only store what is strictly necessary to provide our service.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="flex items-center gap-3 text-emerald-950">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">2</span>
                                Data We Collect
                            </h2>
                            <p>We categorize our data collection into two specific areas:</p>
                            <ul className="list-disc pl-5 space-y-2 marker:text-emerald-500">
                                <li>
                                    <strong className="text-gray-900">Authentication Data:</strong><br />
                                    We store a secure authentication token locally to keep you logged in. This allows the extension to communicate with your dashboard without constant re-login prompts.
                                </li>
                                <li>
                                    <strong className="text-gray-900">Active User Content:</strong><br />
                                    When you explicitly click "Create Ticket" in the extension, we process the specific text message capabilities from the active web page (e.g., WhatsApp or Slack) to draft your ticket. We <strong>do not</strong> passively monitor, store, or transmit your background chat history or private messages.
                                </li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h2 className="flex items-center gap-3 text-emerald-950">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">3</span>
                                How We Use Your Data
                            </h2>
                            <p>
                                We use the data we collect solely to provide the ScopeShield service: creating and managing scope-of-work tickets. We do not sell, rent, or trade your personal data to third parties for marketing purposes.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="flex items-center gap-3 text-emerald-950">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">4</span>
                                Third-Party Services
                            </h2>
                            <p>
                                To provide a reliable and secure infrastructure, we partner with industry-leading services:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 not-prose mt-4">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                                    <div className="font-semibold text-gray-900">Clerk</div>
                                    <div className="text-xs text-gray-500 mt-1">Authentication</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                                    <div className="font-semibold text-gray-900">Stripe</div>
                                    <div className="text-xs text-gray-500 mt-1">Payments</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                                    <div className="font-semibold text-gray-900">Vercel</div>
                                    <div className="text-xs text-gray-500 mt-1">Hosting</div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="flex items-center gap-3 text-emerald-950">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">5</span>
                                Contact Us
                            </h2>
                            <p>
                                If you have any questions about this Privacy Policy, please contact us via our <Link href="/feedback" className="text-emerald-600 hover:text-emerald-700 font-medium underline decoration-emerald-200 underline-offset-2">support channels</Link>.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}
