'use client';

import React, { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { 
    useSystemHealth, useAdminSchools, useAdminPlans, 
    useAdminRevenue, useStrategicAnalytics, usePlatformGovernance 
} from '@/lib/hooks/use-data';
import { OverviewTab } from './components/OverviewTab';

function OverviewContent() {
    const { data: healthData, error: healthError } = useSystemHealth();
    const { data: schools = [] } = useAdminSchools();
    const { data: plans = [] } = useAdminPlans();
    const { data: revenueStats = { total_revenue: 0 } } = useAdminRevenue();
    const { data: strategicData } = useStrategicAnalytics();
    const { data: governanceData } = usePlatformGovernance();

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Platform Overview</h1>
                <p className="text-gray-500 mt-1 font-medium">Real-time system health and strategic performance analytics.</p>
            </div>

            {healthError && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                    <AlertCircle size={20} />
                    <div>
                        <p className="font-bold">System Health Check Failed</p>
                        <p className="text-sm">{(healthError as any)?.message || 'Unknown error occurred while fetching system data.'}</p>
                    </div>
                </div>
            )}

            <OverviewTab 
                schools={schools} 
                plans={plans} 
                revenue={revenueStats} 
                health={healthData} 
                strategic={strategicData} 
                governance={governanceData} 
                onImpersonate={(userId) => {
                    // Impersonation is handled via ConfirmActionModal in the Layout
                    // We can either pass it down or handle it via a shared store/context
                }}
            />
        </div>
    );
}

export default function SuperAdminOverview() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
            </div>
        }>
            <OverviewContent />
        </Suspense>
    );
}
