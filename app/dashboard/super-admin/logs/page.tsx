'use client';

import React, { Suspense } from 'react';
import { useEmailLogs } from '@/lib/hooks/use-data';
import { EmailLogsTab } from '../components/EmailManagement';

function LogsContent() {
    const { data: emailLogs = [] } = useEmailLogs();

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Delivery Logs</h1>
                <p className="text-gray-500 mt-1 font-medium">Detailed audit trail of all platform-generated communications.</p>
            </div>
            <EmailLogsTab logs={emailLogs} />
        </div>
    );
}

export default function LogsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-12 mt-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
            </div>
        }>
            <LogsContent />
        </Suspense>
    );
}
