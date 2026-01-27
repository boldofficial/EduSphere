'use client';

import React, { useState, useEffect } from 'react';
import * as DataService from '@/lib/data-service';
import * as Types from '@/lib/types';
import { AdmissionsView } from '@/components/features/AdmissionsView';

export default function AdmissionsPage() {
    const [admissions, setAdmissions] = useState<Types.Admission[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const load = async () => {
            const data = await DataService.fetchAll<Types.Admission>('admissions');
            setAdmissions(data);
            setIsLoaded(true);
        };
        load();
    }, []);

    const handleUpdate = async (updatedAdmission: Types.Admission) => {
        // Optimistic update
        setAdmissions(prev => prev.map(a => a.id === updatedAdmission.id ? updatedAdmission : a));

        // Persist to server
        await DataService.updateItem('admissions', updatedAdmission.id, updatedAdmission);
    };

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return <AdmissionsView admissions={admissions} onUpdate={handleUpdate} />;
}
