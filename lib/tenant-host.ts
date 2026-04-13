export interface TenantResolution {
    cleanHost: string;
    cleanRoot: string;
    isRootHost: boolean;
    tenantId: string | null;
}

function normalizeHost(rawHost: string): string {
    return rawHost
        .split(':')[0]
        .trim()
        .toLowerCase()
        .replace(/^www\./, '');
}

function isLocalRootHost(cleanHost: string): boolean {
    return cleanHost === 'localhost' || cleanHost === '127.0.0.1';
}

/**
 * Resolve tenant identity from a host/root-domain pair.
 * Supports:
 * - Production subdomains: tenant.myregistra.net -> tenant
 * - Local subdomains: tenant.localhost -> tenant
 * - Custom domains: school-example.org -> school-example.org
 */
export function resolveTenantFromHost(host: string, rootDomain: string): TenantResolution {
    const cleanHost = normalizeHost(host);
    const cleanRoot = normalizeHost(rootDomain);

    if (!cleanHost) {
        return { cleanHost, cleanRoot, isRootHost: true, tenantId: null };
    }

    if (isLocalRootHost(cleanHost) || cleanHost === cleanRoot) {
        return { cleanHost, cleanRoot, isRootHost: true, tenantId: null };
    }

    if (cleanHost.endsWith('.localhost')) {
        const localSlug = cleanHost.slice(0, -'.localhost'.length);
        if (!localSlug || localSlug === 'www') {
            return { cleanHost, cleanRoot, isRootHost: true, tenantId: null };
        }
        return { cleanHost, cleanRoot, isRootHost: false, tenantId: localSlug };
    }

    if (cleanRoot && cleanHost.endsWith(`.${cleanRoot}`)) {
        const slug = cleanHost.slice(0, -(`.${cleanRoot}`.length));
        if (!slug || slug === 'www') {
            return { cleanHost, cleanRoot, isRootHost: true, tenantId: null };
        }
        return { cleanHost, cleanRoot, isRootHost: false, tenantId: slug };
    }

    // Non-root host that is not a known subdomain pattern => treat as custom domain.
    return { cleanHost, cleanRoot, isRootHost: false, tenantId: cleanHost };
}
