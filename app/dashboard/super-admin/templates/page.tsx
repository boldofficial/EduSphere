'use client';

import React from 'react';
import { useEmailTemplates } from '@/lib/hooks/use-data';
import { EmailTemplatesTab } from '../components/EmailManagement';

export default function TemplatesPage() {
    const { data: templates = [], refetch: refetchEmailTemplates } = useEmailTemplates();

    const handleTemplatesChanged = async () => {
        await refetchEmailTemplates();
    };

    return <EmailTemplatesTab templates={templates} onTemplatesChanged={handleTemplatesChanged} />;
}
