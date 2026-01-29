'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingSuccessPage() {
    const searchParams = useSearchParams();
    const url = searchParams.get('url') || '/';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} className="text-green-600" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-4">Registration Received!</h1>
                <p className="text-gray-500 mb-8 font-medium">
                    Your school account has been successfully created and is now **pending approval**.
                    Our team will review your application for security compliance and activate your portal shortly (usually within 24 hours).
                </p>
                <a
                    href="/"
                    className="block w-full py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
                >
                    Back to Home
                    <ArrowRight size={20} />
                </a>
            </div>
        </div>
    );
}
