'use client';

import React, { useState } from 'react';
import { useAdminSchools, useAdminPlans, useAdminRevenue, useStrategicAnalytics, usePlatformGovernance } from '@/lib/hooks/use-data';
import { useToast } from '@/components/providers/toast-provider';
import apiClient from '@/lib/api-client';
import { TenantsTab } from '../components/TenantsTab';
import { SchoolEditModal } from '../components/SchoolEditModal';
import { ConfirmActionModal } from '../components/ConfirmActionModal';
import { useSchoolStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function TenantsPage() {
    const { addToast } = useToast();
    const router = useRouter();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSchoolForEdit, setSelectedSchoolForEdit] = useState<any>(null);
    const [impersonateTarget, setImpersonateTarget] = useState<number | null>(null);
    const [isImpersonating, setIsImpersonating] = useState(false);

    const { data: schools = [], refetch: refetchSchools } = useAdminSchools();
    const { data: plans = [], refetch: refetchPlans } = useAdminPlans();
    const { refetch: refetchRevenue } = useAdminRevenue();
    const { refetch: refetchStrategicAnalytics } = useStrategicAnalytics();
    const { refetch: refetchPlatformGovernance } = usePlatformGovernance();

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

    const handleUpdateSchool = async (id: number, data: any) => {
        try {
            await apiClient.put(`/schools/manage/${id}/`, data);
            await Promise.all([refetchSchools(), refetchRevenue(), refetchStrategicAnalytics()]);
            addToast('School details updated successfully', 'success');
        } catch (error) {
            addToast('Failed to update school details', 'error');
        }
    };

    const handleTenantDataChanged = async () => {
        await Promise.all([
            refetchSchools(),
            refetchRevenue(),
            refetchStrategicAnalytics(),
            refetchPlatformGovernance(),
        ]);
    };

    return (
        <>
            <TenantsTab 
                schools={schools} 
                plans={plans} 
                onImpersonate={handleImpersonate} 
                onEdit={(school: any) => { setSelectedSchoolForEdit(school); setIsEditModalOpen(true); }} 
                onDataChanged={handleTenantDataChanged} 
            />

            {isEditModalOpen && (
                <SchoolEditModal
                    school={selectedSchoolForEdit}
                    plans={plans}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={(data: any) => handleUpdateSchool(selectedSchoolForEdit.id, data)}
                />
            )}

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
