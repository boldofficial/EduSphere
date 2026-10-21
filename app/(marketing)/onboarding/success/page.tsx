import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
type SuccessPageProps = {
  searchParams: Promise<{ domain?: string; email?: string }>;
};

export default async function OnboardingSuccessPage({ searchParams }: SuccessPageProps) {
  const { domain, email: adminEmail = '' } = await searchParams;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';
  const protocol = rootDomain === 'localhost' ? 'http' : 'https';
  const tenantLoginUrl = new URL(
    domain ? `${protocol}://${domain}.${rootDomain}/login` : `${protocol}://${rootDomain}/login`
  );
  tenantLoginUrl.searchParams.set('email', adminEmail);
  const loginUrl = domain ? tenantLoginUrl.toString() : `/login?${tenantLoginUrl.searchParams}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-4">Your school is ready!</h1>
        <p className="text-gray-500 mb-3 font-medium">
          Your school and administrator account are active. Sign in with the administrator email you
          registered:
        </p>
        {adminEmail && (
          <p className="text-gray-900 font-bold break-all mb-8" data-testid="admin-login-email">
            {adminEmail}
          </p>
        )}
        <a
          href={loginUrl}
          className="block w-full py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
        >
          Sign in to your school
          <ArrowRight size={20} />
        </a>
      </div>
    </div>
  );
}
