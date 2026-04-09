'use client';

import React, { Suspense } from 'react';
import { SupportTab } from '../components/SupportTab';

export default function SupportPage() {
    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Support Tickets</h1>
                <p className="text-gray-500 mt-1 font-medium">Manage and resolve institutional support requests.</p>
            </div>
            <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent mx-auto mt-20"></div>}>
                <SupportTab />
            </Suspense>
        </div>
    );
}
