/**
 * Redis-backed Rate Limiting
 * 
 * Uses @upstash/redis for cluster-safe rate limiting.
 * Falls back to in-memory if Redis is unavailable.
 */

import { Redis } from '@upstash/redis';

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

let redisInstance: Redis | null = null;
let usingRedis = false;

const memoryStore = new Map<string, { count: number; resetTime: number }>();

async function getRedis(): Promise<Redis | null> {
    if (redisInstance) return redisInstance;
    
    try {
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            try {
                redisInstance = new Redis({
                    url: process.env.UPSTASH_REDIS_REST_URL,
                    token: process.env.UPSTASH_REDIS_REST_TOKEN,
                    signal: controller.signal as AbortSignal,
                });
                await redisInstance.ping();
                clearTimeout(timeoutId);
                usingRedis = true;
                return redisInstance;
            } catch (e) {
                clearTimeout(timeoutId);
                console.warn('[RATELIMIT] Redis connection failed:', e);
                redisInstance = null;
            }
        }
    } catch (e) {
        console.warn('[RATELIMIT] Redis init failed:', e);
    }
    
    return null;
}

async function checkRedisRateLimit(
    identifier: string,
    config: RateLimitConfig
): Promise<RateLimitResult | null> {
    const redis = await getRedis();
    if (!redis) return null;

    const key = `ratelimit:${identifier}`;
    const windowSec = Math.ceil(config.window / 1000);
    const limit = config.limit;
    const now = Date.now();
    const nowSec = Math.floor(now / 1000);
    const windowStart = nowSec - windowSec;

    try {
        const [removed, added, count] = await Promise.all([
            redis.zremrangebyscore(key, 0, windowStart),
            redis.zadd(key, { score: nowSec, member: `${nowSec}:${Math.random().toString(36).slice(2)}` }),
            redis.zcount(key, windowStart, nowSec),
        ]);

        redis.expire(key, windowSec + 60);

        if (typeof count !== 'number') return null;

        if (count >= limit) {
            return {
                success: false,
                remaining: 0,
                resetTime: now + config.window,
            };
        }

        return {
            success: true,
            remaining: limit - count - 1,
            resetTime: now + config.window,
        };
    } catch {
        return null;
    }
}

export async function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = RATE_LIMITS.default
): Promise<RateLimitResult> {
    const now = Date.now();
    
    const redisResult = await checkRedisRateLimit(identifier, config);
    if (redisResult) {
        return redisResult;
    }
    
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

export function isUsingRedis(): boolean {
    return usingRedis;
}