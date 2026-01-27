/**
 * Rate Limiting Utility
 * 
 * Simple in-memory rate limiter for API routes.
 * 
 * IMPORTANT: This implementation works best for single-instance deployments.
 * For production at scale with multiple instances:
 * - Use Redis (Upstash Redis is great for serverless)
 * - Or use Vercel's Edge Config / KV
 * - Or use a dedicated rate limiting service (e.g., Arcjet)
 * 
 * The current implementation is suitable for:
 * - Development
 * - Single-instance production (single Vercel function)
 * - Low-traffic applications
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store (for single instance deployments)
// For multi-instance deployments, use Redis
const rateLimitStore = new Map<string, RateLimitEntry>();

// Lazy cleanup on access (serverless-friendly, no setInterval)
function cleanupExpired(): void {
    const now = Date.now();
    // Only cleanup if store is getting large (memory optimization)
    if (rateLimitStore.size > 1000) {
        for (const [key, entry] of rateLimitStore.entries()) {
            if (now > entry.resetTime) {
                rateLimitStore.delete(key);
            }
        }
    }
}

export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetTime: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns RateLimitResult indicating if request is allowed
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }
): RateLimitResult {
    // Lazy cleanup for serverless environments
    cleanupExpired();
    
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    // First request or window expired
    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime: now + config.windowMs
        });
        return {
            success: true,
            remaining: config.maxRequests - 1,
            resetTime: now + config.windowMs
        };
    }

    // Within window
    if (entry.count < config.maxRequests) {
        entry.count++;
        return {
            success: true,
            remaining: config.maxRequests - entry.count,
            resetTime: entry.resetTime
        };
    }

    // Rate limited
    return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime
    };
}

/**
 * Get client identifier from request
 * Uses X-Forwarded-For header for proxied requests, falls back to a default
 */
export function getClientIdentifier(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    return ip;
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
    // General API endpoints
    default: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
    
    // Auth endpoints (stricter)
    auth: { maxRequests: 10, windowMs: 60000 }, // 10 login attempts per minute
    
    // Upload endpoints (file uploads are expensive)
    upload: { maxRequests: 20, windowMs: 60000 }, // 20 uploads per minute
    
    // Report generation (CPU intensive)
    reports: { maxRequests: 10, windowMs: 60000 }, // 10 reports per minute
} as const;
