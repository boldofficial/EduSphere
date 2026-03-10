'use client';

import React from 'react';
import { useAdminRevenue } from '@/lib/hooks/use-data';
import { FinancialsTab } from '../components/FinancialsTab';

export default function FinancialsPage() {
    const { data: revenueStats = { total_revenue: 0 } } = useAdminRevenue();
    return <FinancialsTab revenue={revenueStats} />;
}
