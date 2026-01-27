'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Dashboard error:', error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center max-w-md mx-auto p-8">
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Something went wrong
                </h2>
                <p className="text-gray-500 mb-6">
                    We encountered an unexpected error. This might be a temporary issue.
                </p>

                {error.message && process.env.NODE_ENV === 'development' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                        <p className="text-sm text-red-700 font-mono break-all">
                            {error.message}
                        </p>
                    </div>
                )}

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </button>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        <Home className="h-4 w-4" />
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
