/**
 * API Response Caching
 *
 * Redis-based caching for GET requests to reduce database load.
 * Uses Upstash Redis with automatic expiration.
 */

export const CACHE_TTL = {
  short: 60,
  medium: 300,
  long: 3600,
  day: 86400,
} as const;

export type CacheTTL = keyof typeof CACHE_TTL;

export async function getCached<T>(
  _tenantId: string | null,
  _path: string,
  _query?: string
): Promise<T | null> {
  // Return null to skip caching - can be enabled when Redis is properly configured
  return null;
}

export async function setCache<T>(
  _tenantId: string | null,
  _path: string,
  _data: T,
  _query?: string,
  _ttl: CacheTTL = 'medium'
): Promise<void> {
  // No-op - caching disabled
}

export async function invalidateCache(
  _tenantId: string | null,
  _pathPattern?: string
): Promise<void> {
  // No-op
}

export const PUBLIC_CACHE_PATHS = ['core/public-settings', 'core/public-stats', 'schools/public'];

export function isCacheable(path: string): boolean {
  return PUBLIC_CACHE_PATHS.some((p) => path.includes(p));
}

export function getCacheTTL(path: string): CacheTTL {
  if (path.includes('public-stats')) return 'short';
  if (path.includes('public-settings')) return 'medium';
  return 'medium';
}
