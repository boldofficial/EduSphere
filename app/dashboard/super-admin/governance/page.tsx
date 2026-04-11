'use client';

import React, { Suspense } from 'react';
import { usePlatformGovernance } from '@/lib/hooks/use-data';
import { GovernanceTab } from '../components/GovernanceTab';

function GovernanceContent() {
    const { data: governanceData } = usePlatformGovernance();

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Platform Governance</h1>
                <p className="text-gray-500 mt-1 font-medium">Audit logs, system activities, and administrative oversight.</p>
            </div>
            <GovernanceTab activities={governanceData?.activities} />
        </div>
    );
}

export default function GovernancePage() {
    return (
        <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent mx-auto mt-20"></div>}>
            <GovernanceContent />
        </Suspense>
    );
}
