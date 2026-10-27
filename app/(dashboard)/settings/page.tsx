'use client';
import { useSchoolStore } from '@/lib/store';
import {
  useSettings,
  useUpdateSettings,
  useSchoolPaymentSettings,
  useUpdateSchoolPaymentSettings,
  useVerifyCustomDomain,
} from '@/lib/hooks/use-data';
import { SettingsView } from '@/components/features/SettingsView';
import * as Utils from '@/lib/utils';

export default function SettingsPage() {
  const { currentRole } = useSchoolStore();
  const canManagePaymentSettings = currentRole === 'admin' || currentRole === 'super_admin';
  const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();
  const { data: paymentSettings } = useSchoolPaymentSettings();
  const { mutateAsync: updateSettings } = useUpdateSettings();
  const { mutateAsync: updatePaymentSettings } = useUpdateSchoolPaymentSettings();
  const { mutateAsync: verifyCustomDomain, isPending: isVerifyingDomain } = useVerifyCustomDomain();

  return (
    <SettingsView
      settings={settings}
      onUpdate={updateSettings}
      paymentSettings={paymentSettings}
      onUpdatePaymentSettings={updatePaymentSettings}
      canManagePaymentSettings={canManagePaymentSettings}
      onVerifyDomain={verifyCustomDomain}
      isVerifyingDomain={isVerifyingDomain}
    />
  );
}
