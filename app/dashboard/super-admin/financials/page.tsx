'use client';

import React, { Suspense } from 'react';
import { useAdminRevenue } from '@/lib/hooks/use-data';
import { FinancialsTab } from '../components/FinancialsTab';

function FinancialsContent() {
    const { data: revenueStats = { total_revenue: 0 } } = useAdminRevenue();

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Financial Analytics</h1>
                <p className="text-gray-500 mt-1 font-medium">Aggregated platform revenue, collections, and growth tracking.</p>
            </div>
            <FinancialsTab revenue={revenueStats} />
        </div>
    );
}

export default function FinancialsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
            </div>
        }>
            <FinancialsContent />
        </Suspense>
    );
}
