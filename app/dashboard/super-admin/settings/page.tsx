'use client';

import React from 'react';
import { usePlatformSettings } from '@/lib/hooks/use-data';
import { PlatformSettingsTab } from '../components/PlatformSettingsTab';

export default function SettingsPage() {
    const { data: platformSettings } = usePlatformSettings();
    return <PlatformSettingsTab settings={platformSettings} />;
}
