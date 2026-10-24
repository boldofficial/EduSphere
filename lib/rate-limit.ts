/**
 * Redis-backed Rate Limiting
 *
 * Uses @upstash/redis for cluster-safe rate limiting.
 * Falls back to in-memory if Redis is unavailable.
 *
 * Counts are kept per category (auth, reads, expensive reports…) and per signed-in user, so one
 * teacher paging through classes never uses up another category's allowance, and a school whose
 * staff share one internet connection is not limited as if it were a single person.
 */

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

export const RATE_LIMITS = {
  default: { name: 'default', limit: 100, window: '60s' },
  auth: { name: 'auth', limit: 10, window: '60s' },
  upload: { name: 'upload', limit: 20, window: '60s' },
  // Expensive work only: PDFs, exports, AI and generation, not ordinary report-card reads.
  reports: { name: 'reports', limit: 10, window: '60s' },
  sensitive: { name: 'sensitive', limit: 30, window: '60s' },
  read: { name: 'read', limit: 200, window: '60s' },
};

export type RateLimitConfig = { name?: string; limit: number; window: string | any };

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

let redisInstance: Redis | null = null;
const ratelimiters = new Map<string, Ratelimit>();
const memoryStore = new Map<string, { count: number; resetTime: number }>();
const MEMORY_STORE_MAX = 10000;

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

function bucketName(config: RateLimitConfig) {
  return config.name || `${config.limit}-${config.window}`;
}

function windowMs(window: unknown): number {
  const match = /^(\d+)\s*(ms|s|m|h)$/.exec(String(window ?? '').trim());
  if (!match) return 60000;
  const unit = { ms: 1, s: 1000, m: 60000, h: 3600000 }[match[2] as 'ms' | 's' | 'm' | 'h'];
  return Number(match[1]) * unit;
}

function pruneMemoryStore(now: number) {
  if (memoryStore.size < MEMORY_STORE_MAX) return;
  for (const [key, entry] of memoryStore) {
    if (now > entry.resetTime) memoryStore.delete(key);
  }
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.default
): Promise<RateLimitResult> {
  const redis = getRedis();
  const now = Date.now();
  const bucket = bucketName(config);

  if (redis) {
    try {
      let limiter = ratelimiters.get(bucket);

      if (!limiter) {
        limiter = new Ratelimit({
          redis: redis,
          limiter: Ratelimit.slidingWindow(config.limit, config.window),
          analytics: true,
          // One key space per category, so categories never share a count.
          prefix: `@upstash/ratelimit:${bucket}`,
        });
        ratelimiters.set(bucket, limiter);
      }

      const { success, remaining, reset } = await limiter.limit(identifier);
      return { success, remaining, resetTime: reset };
    } catch (e) {
      console.error('[RATELIMIT] Redis check failed, falling back to memory:', e);
    }
  }

  // Fallback to in-memory Map
  pruneMemoryStore(now);
  const key = `${bucket}:${identifier}`;
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs(config.window);
    memoryStore.set(key, { count: 1, resetTime });
    return { success: true, remaining: config.limit - 1, resetTime };
  }

  if (entry.count < config.limit) {
    entry.count++;
    return { success: true, remaining: config.limit - entry.count, resetTime: entry.resetTime };
  }

  return { success: false, remaining: 0, resetTime: entry.resetTime };
}

/** The user id inside a JWT, without verifying it: only used to choose whose allowance to count. */
function userIdFromToken(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    return json?.user_id != null ? String(json.user_id) : null;
  } catch {
    return null;
  }
}

/**
 * Signed-in requests count against the user; others against the IP address. (A forged token only
 * moves the sender into a bucket of its own; Django still rejects the request.)
 */
export function getClientIdentifier(request: Request, accessToken?: string): string {
  const userId = request.headers.get('x-user-id') || userIdFromToken(accessToken);
  if (userId) return `user:${userId}`;

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return `ip:${ip}`;
}

const EXPENSIVE = /(pdf|export|generate|suggest-remark|\/ai-|ai-insights|predictive)/;

export function getRateLimitConfig(endpoint: string, method?: string): RateLimitConfig {
  const lower = endpoint.toLowerCase();

  if (lower.includes('auth/') || lower.includes('login') || lower.includes('token'))
    return RATE_LIMITS.auth as RateLimitConfig;
  if (lower.includes('upload')) return RATE_LIMITS.upload as RateLimitConfig;
  if (EXPENSIVE.test(lower)) return RATE_LIMITS.reports as RateLimitConfig;
  if (lower.includes('bursary/payment') && method && method !== 'GET')
    return RATE_LIMITS.sensitive as RateLimitConfig;
  if (method === 'GET' || lower.endsWith('/') || lower.match(/^\/api\/\w+$/))
    return RATE_LIMITS.read as RateLimitConfig;

  return RATE_LIMITS.default as RateLimitConfig;
}

export function isUsingRedis(): boolean {
  return redisInstance !== null;
}
