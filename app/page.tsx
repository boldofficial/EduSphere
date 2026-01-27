import { headers } from 'next/headers';
import { TenantLandingWrapper } from '@/components/features/TenantLandingWrapper';
import { SystemLandingPage } from '@/components/features/SystemLandingPage';

export default async function Page() {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const tenantId = headersList.get('x-tenant-id');

    // Logic to determine if we are on the main system or a tenant site
    // Middleware sets 'x-tenant-id' if it detects a subdomain

    // If no tenant ID, or explicitly 'www' or 'edusphere.ng', show System Landing
    const isSystem = !tenantId || tenantId === 'www.edusphere.ng' || tenantId === 'edusphere.ng' || (!tenantId && host.includes('localhost'));

    if (isSystem) {
        return <SystemLandingPage />;
    }

    return <TenantLandingWrapper />;
}
