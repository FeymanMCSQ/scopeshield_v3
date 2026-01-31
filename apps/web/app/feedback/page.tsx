
'use client';

import { useState } from 'react';
// Navbar is handled by the root layout
import { Check, Send } from 'lucide-react';
import Link from 'next/link';

export default function FeedbackPage() {
    const [message, setMessage] = useState('');
    const [type, setType] = useState('feedback');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!message.trim()) return;

        setSending(true);
        setError('');

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, type }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to submit');

            setSent(true);
            setMessage('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    }

    if (sent) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
                    <p className="text-gray-500 mb-6">
                        Your feedback has been received. We read every message to improve ScopeShield.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => setSent(false)}
                            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                        >
                            Send another message
                        </button>
                        <div className="block">
                            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
                                Return to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">


            <div className="max-w-2xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block">
                        &larr; Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Feedback</h1>
                    <p className="text-gray-500 mt-2">
                        Found a bug? Have a feature request? Let us know.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100/50">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type of Feedback
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    value="feedback"
                                    checked={type === 'feedback'}
                                    onChange={(e) => setType(e.target.value)}
                                    className="text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-gray-800">General Feedback</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    value="complaint"
                                    checked={type === 'complaint'}
                                    onChange={(e) => setType(e.target.value)}
                                    className="text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-gray-800">Issue / Complaint</span>
                            </label>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            rows={6}
                            placeholder="Describe your thoughts or issue here..."
                            className="w-full rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 shadow-sm resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={sending || !message.trim()}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                    >
                        {sending ? 'Sending...' : (
                            <>
                                <Send className="w-4 h-4" />
                                Submit Feedback
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
