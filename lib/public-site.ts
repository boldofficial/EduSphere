import { cache } from 'react';
import { headers } from 'next/headers';
import type { Settings } from '@/lib/types';
import { INITIAL_SETTINGS } from '@/lib/utils';
import { resolveTenantFromHost } from '@/lib/tenant-host';
import { siteCacheTag } from '@/lib/site-cache';

const DJANGO_API_URL = (process.env.DJANGO_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

/** Cached for 5 minutes, and refreshed immediately when the school publishes (see the API proxy). */
const REVALIDATE_SECONDS = 300;

/** The school this request is for, or null on the Registra marketing site. */
export const getRequestTenant = cache(async (): Promise<string | null> => {
  const headersList = await headers();
  const fromProxy = headersList.get('x-tenant-id');
  if (fromProxy && fromProxy !== 'null' && fromProxy !== 'undefined') return fromProxy;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';
  return resolveTenantFromHost(headersList.get('host') || '', rootDomain).tenantId;
});

/**
 * A school's public website settings, fetched on the server so the first paint already shows the
 * school's own logo, images and sections (no flash of platform defaults). One request per page render.
 */
export const getPublicSite = cache(async (tenantId: string): Promise<Settings | null> => {
  try {
    const res = await fetch(`${DJANGO_API_URL}/api/core/public-settings/`, {
      headers: { 'X-Tenant-ID': tenantId },
      next: { revalidate: REVALIDATE_SECONDS, tags: [siteCacheTag(tenantId)] },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { ...INITIAL_SETTINGS, ...data } as Settings;
  } catch {
    return null;
  }
});
