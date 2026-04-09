'use client';

import React, { Suspense } from 'react';
import { EmailMarketingTab } from '@/components/features/dashboard/EmailMarketingTab';

export default function EmailMarketingPage() {
    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Email Marketing</h1>
                <p className="text-gray-500 mt-1 font-medium">Platform-wide campaigns and communication strategies.</p>
            </div>
            <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent mx-auto mt-20"></div>}>
                <EmailMarketingTab />
            </Suspense>
        </div>
    );
}
