'use client';

import React from 'react';
import { useEmailLogs } from '@/lib/hooks/use-data';
import { EmailLogsTab } from '../components/EmailManagement';

export default function LogsPage() {
    const { data: emailLogs = [] } = useEmailLogs();
    return <EmailLogsTab logs={emailLogs} />;
}
