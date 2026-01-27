'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function AuthErrorPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full text-center">
                <div className="bg-white rounded-2xl shadow-lg p-8 border">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Authentication Error
                    </h1>
                    <p className="text-gray-600 mb-6">
                        We couldn't complete the sign-in process. This could happen if the link has expired or was already used.
                    </p>
                    <div className="space-y-3">
                        <Link
                            href="/"
                            className="block w-full py-3 px-4 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
                        >
                            Try Again
                        </Link>
                        <Link
                            href="/"
                            className="block w-full py-3 px-4 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Return to Home
                        </Link>
                    </div>
                </div>
                <p className="mt-6 text-sm text-gray-500">
                    If this problem persists, please contact the school administrator.
                </p>
            </div>
        </div>
    );
}
