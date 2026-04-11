'use client';

import React, { Suspense } from 'react';
import { useEmailTemplates } from '@/lib/hooks/use-data';
import { EmailTemplatesTab } from '../components/EmailManagement';

function TemplatesContent() {
    const { data: templates = [], refetch: refetchEmailTemplates } = useEmailTemplates();

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Email Templates</h1>
                <p className="text-gray-500 mt-1 font-medium">Design and manage system-wide transactional and marketing templates.</p>
            </div>
            <EmailTemplatesTab templates={templates} onTemplatesChanged={refetchEmailTemplates} />
        </div>
    );
}

export default function TemplatesPage() {
    return (
        <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent mx-auto mt-20"></div>}>
            <TemplatesContent />
        </Suspense>
    );
}
