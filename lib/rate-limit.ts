/**
 * Rate Limiting Utility
 * 
 * In-memory rate limiter for API routes.
 */

export const RATE_LIMITS = {
    default: { limit: 100, window: 60000 },
    auth: { limit: 10, window: 60000 },
    upload: { limit: 20, window: 60000 },
    reports: { limit: 10, window: 60000 },
    sensitive: { limit: 30, window: 60000 },
    read: { limit: 200, window: 60000 },
};

export type RateLimitConfig = typeof RATE_LIMITS[keyof typeof RATE_LIMITS];

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetTime: number;
}

const memoryStore = new Map<string, { count: number; resetTime: number }>();

export async function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = RATE_LIMITS.default
): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = memoryStore.get(identifier);

    if (!entry || now > entry.resetTime) {
        memoryStore.set(identifier, {
            count: 1,
            resetTime: now + config.window,
        });
        
        if (memoryStore.size > 1000) {
            for (const [key, val] of memoryStore.entries()) {
                if (now > val.resetTime) memoryStore.delete(key);
            }
        }
        
        return {
            success: true,
            remaining: config.limit - 1,
            resetTime: now + config.window,
        };
    }

    if (entry.count < config.limit) {
        entry.count++;
        return {
            success: true,
            remaining: config.limit - entry.count,
            resetTime: entry.resetTime,
        };
    }

    return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
    };
}

export function getClientIdentifier(request: Request): string {
    const userId = request.headers.get('x-user-id');
    if (userId) return `user:${userId}`;
    
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    return `ip:${ip}`;
}

export function getRateLimitConfig(endpoint: string): RateLimitConfig {
    const lower = endpoint.toLowerCase();
    
    if (lower.includes('/auth/') || lower.includes('/login')) return RATE_LIMITS.auth as RateLimitConfig;
    if (lower.includes('/upload')) return RATE_LIMITS.upload as RateLimitConfig;
    if (lower.includes('/report') || lower.includes('/generate')) return RATE_LIMITS.reports as RateLimitConfig;
    if (lower.includes('/bursary/payment') || lower.includes('/staff')) return RATE_LIMITS.sensitive as RateLimitConfig;
    if (lower.endsWith('/') || lower.match(/^\/api\/\w+$/)) return RATE_LIMITS.read as RateLimitConfig;
    
    return RATE_LIMITS.default as RateLimitConfig;
}