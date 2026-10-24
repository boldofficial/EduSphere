import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/features/auth/PasswordForms';

export const metadata: Metadata = { title: 'Reset password', robots: { index: false } };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string; token?: string }>;
}) {
  const { uid = '', token = '' } = await searchParams;
  return <ResetPasswordForm uid={uid} token={token} />;
}
