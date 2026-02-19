'use client';

import PredictiveDashboard from '@/components/features/analytics/PredictiveDashboard';

import { useSchoolStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PredictiveInsightsPage() {
    const { currentRole } = useSchoolStore();
    const router = useRouter();

    useEffect(() => {
        if (currentRole === 'student') {
            router.push('/dashboard');
        }
    }, [currentRole, router]);

    if (currentRole === 'student') return null;

    return <PredictiveDashboard />;
}
