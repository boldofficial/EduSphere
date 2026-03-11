'use client';

import React from 'react';
import { usePlatformGovernance } from '@/lib/hooks/use-data';
import { BroadcastsTab } from '../components/GovernanceTab';

export default function BroadcastsPage() {
    const { data: governanceData, refetch: refetchPlatformGovernance } = usePlatformGovernance();

    const handleGovernanceChanged = async () => {
        await refetchPlatformGovernance();
    };

    return <BroadcastsTab announcements={governanceData?.announcements} onBroadcastChanged={handleGovernanceChanged} />;
}
