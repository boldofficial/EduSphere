/**
 * Redis Caching Layer
 * 
 * Provides Redis caching when available, graceful fallback to memory.
 * Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable.
 */

export const CACHE_TTL = {
    short: 60,
    medium: 300,
    long: 3600,
    day: 86400,
} as const;

export type CacheTTL = keyof typeof CACHE_TTL;

let redis: any = null;
let redisPromise: Promise<any> | null = null;

async function getRedis(): Promise<any> {
    if (redis) return redis;
    if (redisPromise) return redisPromise;
    
    redisPromise = (async () => {
        try {
            const { Redis } = await import('@upstash/redis');
            if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
                redis = new Redis({
                    url: process.env.UPSTASH_REDIS_REST_URL,
                    token: process.env.UPSTASH_REDIS_REST_TOKEN,
                });
                return redis;
            }
        } catch (e) {
            console.warn('[CACHE] Redis init failed:', e);
        }
        return null;
    })();
    
    return redisPromise;
}

function getCacheKey(tenantId: string | null, path: string, query?: string): string {
    const base = tenantId ? `tenant:${tenantId}` : 'public';
    const cleanPath = path.replace(/^\/api\//, '').replace(/\/$/, '');
    const suffix = query ? `:${query}` : '';
    return `cache:${base}:${cleanPath}${suffix}`;
}

export async function getCached<T>(tenantId: string | null, path: string, query?: string): Promise<T | null> {
    const client = await getRedis();
    if (!client) return null;
    
    try {
        const key = getCacheKey(tenantId, path, query);
        const data = await client.get(key);
        return data as T | null;
    } catch {
        return null;
    }
}

export async function setCache<T>(
    tenantId: string | null,
    path: string,
    data: T,
    query?: string,
    ttl: CacheTTL = 'medium'
): Promise<void> {
    const client = await getRedis();
    if (!client) return;
    
    try {
        const key = getCacheKey(tenantId, path, query);
        await client.set(key, JSON.stringify(data), { ex: CACHE_TTL[ttl] as number });
    } catch {
        // Silently fail
    }
}

export async function invalidateCache(tenantId: string | null, pathPattern?: string): Promise<void> {
    const client = await getRedis();
    if (!client) return;
    
    try {
        const base = tenantId ? `tenant:${tenantId}` : 'public';
        const pattern = pathPattern ? `${base}:${pathPattern}*` : `${base}:*`;
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(...keys);
        }
    } catch {
        // Silently fail
    }
}

export const PUBLIC_CACHE_PATHS = [
    'core/public-settings',
    'core/public-stats',
    'schools/public',
];

export const CACHEABLE_PATHS = [
    'academic/classes/',
    'academic/subjects/',
    'academic/students/',  // High-read, low-churn
    'bursary/fees/',
    'bursary/fee-structures/',
    'academic/teachers/',
    'academic/staff/',
    'learning/lessons/',
    'announcements/',
    'calendar/events/',
];

export function isCacheable(path: string): boolean {
    if (PUBLIC_CACHE_PATHS.some(p => path.includes(p))) return true;
    if (CACHEABLE_PATHS.some(p => path.includes(p))) return true;
    return false;
}

export function getCacheTTL(path: string): CacheTTL {
    if (path.includes('public-stats')) return 'short';
    if (path.includes('public-settings')) return 'medium';
    if (path.includes('students/') || path.includes('fees/')) return 'long';
    return 'medium';
}