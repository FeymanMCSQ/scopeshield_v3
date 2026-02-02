import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-gray-50 py-12 px-6">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 mb-4">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
                    <p className="text-gray-500 text-sm mt-2">Last Updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="prose prose-emerald max-w-none text-gray-700 space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900">1. Introduction</h2>
                        <p>
                            ScopeShield ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how our browser extension and web application collect, use, and safeguard your information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900">2. Data We Collect</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                <strong>Authentication Data:</strong> We store a secure authentication token to keep you logged in to your account.
                            </li>
                            <li>
                                <strong>User Content:</strong> When you explicitely use the extension to "Create Ticket", we collect the selected text message content from the active web page (e.g., WhatsApp or Slack) to process your request. We <strong>do not</strong> passively monitor, store, or transmit your private chat history.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900">3. How We Use Your Data</h2>
                        <p>
                            We use the data we collect solely to provide the ScopeShield service: creating and managing scope-of-work tickets. We do not sell your personal data to third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900">4. Third-Party Services</h2>
                        <p>
                            Our application uses trusted third-party services for infrastructure and payments, including:
                        </p>
                        <ul className="list-disc pl-5">
                            <li><strong>Clerk:</strong> For secure user authentication.</li>
                            <li><strong>Stripe:</strong> For payment processing.</li>
                            <li><strong>Vercel:</strong> For hosting and infrastructure.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900">5. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us via our support channels.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
