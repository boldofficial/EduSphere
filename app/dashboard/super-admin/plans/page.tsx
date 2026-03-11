'use client';

import React from 'react';
import { useAdminPlans, useModules } from '@/lib/hooks/use-data';
import { PlansTab } from '../components/PlansTab';

export default function PlansPage() {
    const { data: plans = [], refetch: refetchPlans } = useAdminPlans();
    const { data: modules = [] } = useModules();

    const handlePlansChanged = async () => {
        await refetchPlans();
    };

    return <PlansTab plans={plans} modules={modules} onPlansChanged={handlePlansChanged} />;
}
