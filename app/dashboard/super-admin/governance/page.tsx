'use client';

import React from 'react';
import { usePlatformGovernance } from '@/lib/hooks/use-data';
import { GovernanceTab } from '../components/GovernanceTab';

export default function GovernancePage() {
    const { data: governanceData } = usePlatformGovernance();
    return <GovernanceTab activities={governanceData?.activities} />;
}
