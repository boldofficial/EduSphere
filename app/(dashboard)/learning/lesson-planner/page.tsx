'use client';

import LessonPlanGenerator from '@/components/features/learning/LessonPlanGenerator';

import { useSchoolStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LessonPlannerPage() {
    const { currentRole } = useSchoolStore();
    const router = useRouter();

    useEffect(() => {
        if (currentRole === 'student') {
            router.push('/dashboard');
        }
    }, [currentRole, router]);

    if (currentRole === 'student') return null;

    return <LessonPlanGenerator />;
}
