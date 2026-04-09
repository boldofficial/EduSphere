'use client';

import React, { Suspense } from 'react';
import { usePlatformGovernance } from '@/lib/hooks/use-data';
import { BroadcastsTab } from '../components/GovernanceTab';

function BroadcastsContent() {
    const { data: governanceData, refetch: refetchPlatformGovernance } = usePlatformGovernance();

    const handleGovernanceChanged = async () => {
        await refetchPlatformGovernance();
    };

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Platform Broadcasts</h1>
                <p className="text-gray-500 mt-1 font-medium">Send and manage system-wide notifications and announcements.</p>
            </div>
            <BroadcastsTab announcements={governanceData?.announcements} onBroadcastChanged={handleGovernanceChanged} />
        </div>
    );
}

export default function BroadcastsPage() {
    return (
        <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent mx-auto mt-20"></div>}>
            <BroadcastsContent />
        </Suspense>
    );
}
