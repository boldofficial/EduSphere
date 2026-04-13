import { headers } from 'next/headers';
import { TenantLandingWrapper } from '@/components/features/TenantLandingWrapper';
import { SystemLandingPage } from '@/components/features/SystemLandingPage';
import { resolveTenantFromHost } from '@/lib/tenant-host';

export default async function Page() {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const headerTenantId = headersList.get('x-tenant-id');

    // Logic to determine if we are on the main system or a tenant site
    // Middleware sets 'x-tenant-id' if it detects a subdomain

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';
    const fallbackResolution = resolveTenantFromHost(host, rootDomain);
    const effectiveTenantId = headerTenantId || fallbackResolution.tenantId;
    const isSystem = !effectiveTenantId;

    if (isSystem) {
        return <SystemLandingPage />;
    }

    return <TenantLandingWrapper />;
}
