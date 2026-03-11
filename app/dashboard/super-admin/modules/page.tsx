'use client';

import React from 'react';
import { useModules } from '@/lib/hooks/use-data';
import { ModulesTab } from '../components/ModulesTab';

export default function ModulesPage() {
    const { data: modules = [], refetch: refetchModules } = useModules();

    const handleModulesChanged = async () => {
        await refetchModules();
    };

    return <ModulesTab modules={modules} onModulesChanged={handleModulesChanged} />;
}
