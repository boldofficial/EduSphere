'use client';

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
    useSystemHealth, useAdminSchools, useAdminPlans, useAdminRevenue,
    useStrategicAnalytics, usePlatformGovernance
} from '@/lib/hooks/use-data';
import { useToast } from '@/components/providers/toast-provider';
import { OverviewTab } from './components/OverviewTab';
import { ConfirmActionModal } from './components/ConfirmActionModal';
import { useSchoolStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function OverviewPage() {
    const { addToast } = useToast();
    const router = useRouter();
    const [impersonateTarget, setImpersonateTarget] = useState<number | null>(null);
    const [isImpersonating, setIsImpersonating] = useState(false);

    const { data: healthData, error: healthError } = useSystemHealth();
    const { data: schools = [] } = useAdminSchools();
    const { data: plans = [] } = useAdminPlans();
    const { data: revenueStats = { total_revenue: 0 } } = useAdminRevenue();
    const { data: strategicData } = useStrategicAnalytics();
    const { data: governanceData } = usePlatformGovernance();

    const handleImpersonate = (userId: number) => {
        if (!userId) {
            addToast('No administrator found for this school.', 'error');
            return;
        }
        setImpersonateTarget(userId);
    };

    const confirmImpersonate = async () => {
        if (!impersonateTarget) return;
        setIsImpersonating(true);
        try {
            const res = await fetch('/api/auth/impersonate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: impersonateTarget }),
            });
            if (res.ok) {
                const data = await res.json();
                useSchoolStore.getState().login(data.user.role, data.user);
                addToast('Impersonation started successfully.', 'success');
                router.push('/dashboard');
            } else {
                addToast('Impersonation failed', 'error');
            }
        } catch (error) {
            addToast('An error occurred while impersonating.', 'error');
        } finally {
            setIsImpersonating(false);
            setImpersonateTarget(null);
        }
    };

    return (
        <>
            {healthError && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                    <AlertCircle size={20} />
                    <div>
                        <p className="font-bold">System Health Check Failed</p>
                        <p className="text-sm">{(healthError as any)?.message || 'Unknown error occurred.'}</p>
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
                onImpersonate={handleImpersonate} 
            />

            <ConfirmActionModal
                isOpen={Boolean(impersonateTarget)}
                title="Confirm Impersonation"
                message="You will be logged in as this school's administrator."
                confirmLabel="Impersonate Admin"
                confirmVariant="warning"
                isProcessing={isImpersonating}
                onConfirm={confirmImpersonate}
                onCancel={() => setImpersonateTarget(null)}
            />
        </>
    );
}
