'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, ArrowRight, Loader2 } from 'lucide-react';

const COMMON_COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'IE', name: 'Ireland' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
    { code: 'AT', name: 'Austria' },
    { code: 'PT', name: 'Portugal' },
    { code: 'SE', name: 'Sweden' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'NO', name: 'Norway' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'SG', name: 'Singapore' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'JP', name: 'Japan' },
    { code: 'IN', name: 'India' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
];

export default function ConnectStripePage() {
    const [country, setCountry] = useState('US');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleConnect(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/stripe/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ country }),
            });

            const data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Failed to start onboarding');
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            alert('Network error. Please try again.');
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-sm border border-emerald-100 p-8">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Globe className="w-8 h-8 text-indigo-600" />
                </div>

                <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                    Where are you based?
                </h1>
                <p className="text-center text-gray-500 mb-8">
                    Select the country where your bank account is located to start receiving payouts.
                </p>

                <form onSubmit={handleConnect}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
                        </label>
                        <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            disabled={loading}
                            className="w-full rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 py-3"
                        >
                            <option disabled>Select a country</option>
                            {COMMON_COUNTRIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                    {c.name} ({c.code})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-2">
                            Dont see your country? We support 40+ countries supported by Stripe.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-lg shadow-sm shadow-indigo-200"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Setting up...
                            </>
                        ) : (
                            <>
                                Continue to Stripe <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <button
                    type="button"
                    onClick={() => router.back()}
                    className="w-full text-center text-sm text-gray-400 mt-6 hover:text-gray-600"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
