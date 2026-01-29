import { headers } from 'next/headers';
import { TenantLandingWrapper } from '@/components/features/TenantLandingWrapper';
import { SystemLandingPage } from '@/components/features/SystemLandingPage';

export default async function Page() {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const tenantId = headersList.get('x-tenant-id');

    // Logic to determine if we are on the main system or a tenant site
    // Middleware sets 'x-tenant-id' if it detects a subdomain

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';

    // If no tenant ID, or explicitly 'www' or root domain, show System Landing
    const isSystem = !tenantId || tenantId === `www.${rootDomain}` || host === rootDomain || (!tenantId && host.includes('localhost'));

    if (isSystem) {
        return <SystemLandingPage />;
    }

    return <TenantLandingWrapper />;
}
