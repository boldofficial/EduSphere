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

let redisClient: any = null;

function getRedisSync(): any {
    if (redisClient) return redisClient;
    
    try {
        // Using static import - will be tree-shaken if not used
        const { Redis } = require('@upstash/redis');
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            redisClient = new Redis({
                url: process.env.UPSTASH_REDIS_REST_URL,
                token: process.env.UPSTASH_REDIS_REST_TOKEN,
            });
        }
    } catch {
        console.warn('[API_CACHE] Redis not available');
    }
    
    return redisClient;
}

function getCacheKey(tenantId: string | null, path: string, query?: string): string {
    const base = tenantId ? `tenant:${tenantId}` : 'public';
    const cleanPath = path.replace(/^\/api\//, '').replace(/\/$/, '');
    const suffix = query ? `:${query}` : '';
    return `cache:${base}:${cleanPath}${suffix}`;
}

export async function getCached<T>(tenantId: string | null, path: string, query?: string): Promise<T | null> {
    // Return null to skip caching - can be enabled when Redis is properly configured
    return null;
}

export async function setCache<T>(
    tenantId: string | null,
    path: string,
    data: T,
    query?: string,
    ttl: CacheTTL = 'medium'
): Promise<void> {
    // No-op - caching disabled
}

export async function invalidateCache(tenantId: string | null, pathPattern?: string): Promise<void> {
    // No-op
}

export const PUBLIC_CACHE_PATHS = [
    'core/public-settings',
    'core/public-stats',
    'schools/public',
];

export function isCacheable(path: string): boolean {
    return PUBLIC_CACHE_PATHS.some(p => path.includes(p));
}

export function getCacheTTL(path: string): CacheTTL {
    if (path.includes('public-stats')) return 'short';
    if (path.includes('public-settings')) return 'medium';
    return 'medium';
}