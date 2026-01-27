'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function ExtensionConnectContent() {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    const searchParams = useSearchParams();
    const extensionId = searchParams.get('ext_id');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Initializing connection...');

    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            setStatus('error');
            setMessage('You must be signed in to connect the extension.');
            return;
        }

        if (!extensionId) {
            setStatus('error');
            setMessage('Missing extension ID. Please start this process from the extension.');
            return;
        }

        const connect = async () => {
            try {
                setMessage('Generating secure token...');
                const token = await getToken(); // Get fresh JWT

                if (!token) {
                    throw new Error('Failed to generate token');
                }

                setMessage('Sending credentials to extension...');

                // Chrome Extension Message Passing
                // @ts-ignore - 'chrome' is not defined in standard window
                if (typeof window.chrome !== 'undefined' && window.chrome.runtime) {
                    // @ts-ignore
                    window.chrome.runtime.sendMessage(
                        extensionId,
                        {
                            type: 'SS_HANDSHAKE',
                            token,
                            user: {
                                id: user?.id,
                                email: user?.primaryEmailAddress?.emailAddress,
                                fullName: user?.fullName
                            }
                        },
                        (response: any) => {
                            // Check for chrome.runtime.lastError
                            // @ts-ignore
                            const lastError = window.chrome.runtime.lastError;
                            if (lastError) {
                                console.error('Extension handshake failed:', lastError);
                                setStatus('error');
                                setMessage('Could not reach the extension. Is it installed and active?');
                                return;
                            }

                            if (response && response.ok) {
                                setStatus('success');
                                setMessage('Successfully connected! You can close this tab.');
                            } else {
                                setStatus('error');
                                setMessage('Extension rejected the connection.');
                            }
                        }
                    );
                } else {
                    throw new Error('Chrome runtime not found. Are you using Chrome?');
                }

            } catch (err) {
                console.error(err);
                setStatus('error');
                setMessage(err instanceof Error ? err.message : 'Unknown error occurred');
            }
        };

        connect();
    }, [isLoaded, isSignedIn, extensionId, getToken, user]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-emerald-100 p-8 text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mb-4" />
                        <h1 className="text-xl font-bold text-emerald-950 mb-2">Connecting ScopeShield</h1>
                        <p className="text-emerald-900/60">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
                        <h1 className="text-xl font-bold text-emerald-950 mb-2">Connected!</h1>
                        <p className="text-emerald-900/60 mb-6">{message}</p>
                        <button
                            onClick={() => window.close()}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                        >
                            Close Tab
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <XCircle className="h-12 w-12 text-red-500 mb-4" />
                        <h1 className="text-xl font-bold text-red-700 mb-2">Connection Failed</h1>
                        <p className="text-red-600/80 mb-6">{message}</p>
                        <a
                            href="/dashboard"
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                        >
                            Back to Dashboard
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ExtensionConnectPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
            </div>
        }>
            <ExtensionConnectContent />
        </Suspense>
    );
}
