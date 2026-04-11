'use client';

import React, { Suspense } from 'react';
import { usePlatformSettings } from '@/lib/hooks/use-data';
import { PlatformSettingsTab } from '../components/PlatformSettingsTab';

function SettingsContent() {
    const { data: platformSettings } = usePlatformSettings();

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Platform Settings</h1>
                <p className="text-gray-500 mt-1 font-medium">Global platform configuration and system parameters.</p>
            </div>
            <PlatformSettingsTab settings={platformSettings} />
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent mx-auto mt-20"></div>}>
            <SettingsContent />
        </Suspense>
    );
}
