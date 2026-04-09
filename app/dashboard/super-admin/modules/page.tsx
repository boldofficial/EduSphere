'use client';

import React, { Suspense } from 'react';
import { useModules, useAdminPlans } from '@/lib/hooks/use-data';
import { ModulesTab } from '../components/ModulesTab';

function ModulesContent() {
    const { data: modules = [], refetch: refetchModules } = useModules();
    const { refetch: refetchPlans } = useAdminPlans();

    const handleModulesChanged = async () => {
        await Promise.all([refetchModules(), refetchPlans()]);
    };

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Modules Library</h1>
                <p className="text-gray-500 mt-1 font-medium">Manage platform features, extensions, and their availability across plans.</p>
            </div>
            <ModulesTab modules={modules} onModulesChanged={handleModulesChanged} />
        </div>
    );
}

export default function ModulesPage() {
    return (
        <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent mx-auto mt-20"></div>}>
            <ModulesContent />
        </Suspense>
    );
}
