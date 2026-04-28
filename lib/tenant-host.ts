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

const TENANT_ID_REGEX = /^[a-z0-9-]{1,63}$/;

const isValidTenantId = (tenantId: string | null | undefined): boolean => {
    if (!tenantId || tenantId === 'null' || tenantId === 'undefined') return false;
    // Allow localhost and standard IPs
    if (tenantId === 'localhost' || tenantId === '127.0.0.1') return true;
    // Lenient validation in development
    if (process.env.NODE_ENV !== 'production') {
        // Allow any alphanumeric slug
        if (/^[a-z0-9-]+$/.test(tenantId) && tenantId.length >= 1) return true;
    }
    // Stricter in production
    return TENANT_ID_REGEX.test(tenantId);
};

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
        const tenantId = isValidTenantId(localSlug) ? localSlug : null;
        return { cleanHost, cleanRoot, isRootHost: false, tenantId };
    }

    if (cleanRoot && cleanHost.endsWith(`.${cleanRoot}`)) {
        const slug = cleanHost.slice(0, -(`.${cleanRoot}`.length));
        if (!slug || slug === 'www') {
            return { cleanHost, cleanRoot, isRootHost: true, tenantId: null };
        }
        const tenantId = isValidTenantId(slug) ? slug : null;
        return { cleanHost, cleanRoot, isRootHost: false, tenantId };
    }

    // Non-root host that is not a known subdomain pattern => treat as custom domain.
    const tenantId = isValidTenantId(cleanHost) ? cleanHost : null;
    return { cleanHost, cleanRoot, isRootHost: false, tenantId };
}
