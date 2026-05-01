/**
 * Redis-backed Rate Limiting
 * 
 * Uses @upstash/redis for cluster-safe rate limiting.
 * Falls back to in-memory if Redis is unavailable.
 */

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

export const RATE_LIMITS = {
    default: { limit: 100, window: '60s' },
    auth: { limit: 10, window: '60s' },
    upload: { limit: 20, window: '60s' },
    reports: { limit: 10, window: '60s' },
    sensitive: { limit: 30, window: '60s' },
    read: { limit: 200, window: '60s' },
};

export type RateLimitConfig = { limit: number; window: string | any };

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetTime: number;
}

let redisInstance: Redis | null = null;
const ratelimiters = new Map<string, Ratelimit>();
const memoryStore = new Map<string, { count: number; resetTime: number }>();

function getRedis(): Redis | null {
    if (redisInstance) return redisInstance;
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        redisInstance = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        return redisInstance;
    }
    return null;
}

export async function checkRateLimit(
    identifier: string,
    config: any = RATE_LIMITS.default
): Promise<RateLimitResult> {
    const redis = getRedis();
    const now = Date.now();

    if (redis) {
        try {
            const configKey = `${config.limit}-${config.window}`;
            let limiter = ratelimiters.get(configKey);
            
            if (!limiter) {
                limiter = new Ratelimit({
                    redis: redis,
                    limiter: Ratelimit.slidingWindow(config.limit, config.window),
                    analytics: true,
                    prefix: '@upstash/ratelimit',
                });
                ratelimiters.set(configKey, limiter);
            }

            const { success, remaining, reset } = await limiter.limit(identifier);
            return { success, remaining, resetTime: reset };
        } catch (e) {
            console.error('[RATELIMIT] Redis check failed, falling back to memory:', e);
        }
    }

    // Fallback to in-memory Map
    const windowMs = 60000; // Default fallback window
    const entry = memoryStore.get(identifier);

    if (!entry || now > entry.resetTime) {
        memoryStore.set(identifier, {
            count: 1,
            resetTime: now + windowMs,
        });
        return { success: true, remaining: config.limit - 1, resetTime: now + windowMs };
    }

    if (entry.count < config.limit) {
        entry.count++;
        return { success: true, remaining: config.limit - entry.count, resetTime: entry.resetTime };
    }

    return { success: false, remaining: 0, resetTime: entry.resetTime };
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

export function isUsingRedis(): boolean {
    return redisInstance !== null;
}