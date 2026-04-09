'use client';

import React, { useState, Suspense } from 'react';
import { useAdminSchools, useAdminPlans, useAdminRevenue, useStrategicAnalytics, usePlatformGovernance } from '@/lib/hooks/use-data';
import { TenantsTab } from '../components/TenantsTab';
import { SchoolEditModal } from '../components/SchoolEditModal';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/providers/toast-provider';

function TenantsContent() {
    const { addToast } = useToast();
    const { data: schools = [], refetch: refetchSchools } = useAdminSchools();
    const { data: plans = [], refetch: refetchPlans } = useAdminPlans();
    
    // Dependencies that might need refreshing after school edits
    const { refetch: refetchRevenue } = useAdminRevenue();
    const { refetch: refetchStrategicAnalytics } = useStrategicAnalytics();
    const { refetch: refetchPlatformGovernance } = usePlatformGovernance();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSchoolForEdit, setSelectedSchoolForEdit] = useState<any>(null);

    const handleUpdateSchool = async (id: number, data: any) => {
        try {
            await apiClient.put(`schools/manage/${id}/`, data);
            await Promise.all([
                refetchSchools(), 
                refetchRevenue(), 
                refetchStrategicAnalytics()
            ]);
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
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tenants (Schools)</h1>
                <p className="text-gray-500 mt-1 font-medium">Manage institutional accounts, verification status, and school settings.</p>
            </div>

            <TenantsTab 
                schools={schools} 
                plans={plans} 
                onImpersonate={(userId: number) => {
                    // Logic for impersonation selection
                }} 
                onEdit={(school: any) => { 
                    setSelectedSchoolForEdit(school); 
                    setIsEditModalOpen(true); 
                }} 
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
        </div>
    );
}

export default function TenantsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
            </div>
        }>
            <TenantsContent />
        </Suspense>
    );
}
