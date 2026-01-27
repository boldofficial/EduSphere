'use client';
import { useSettings, useUpdateSettings } from '@/lib/hooks/use-data';
import { SettingsView } from '@/components/features/SettingsView';
import * as Utils from '@/lib/utils';

export default function SettingsPage() {
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();
    const { mutateAsync: updateSettings } = useUpdateSettings();

    return <SettingsView settings={settings} onUpdate={updateSettings} />;
}
