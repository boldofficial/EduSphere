/**
 * API Utilities for Single-School System
 * 
 * Simplified authentication and rate limiting helpers.
 * No multi-tenancy - all authenticated users belong to the same school.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, type RateLimitConfig } from './rate-limit'

/**
 * Helper to safely parse JSON from request body
 */
export async function safeJsonParse(request: NextRequest) {
    try {
        return { data: await request.json(), error: null }
    } catch {
        return { data: null, error: 'Invalid JSON in request body' }
    }
}

/**
 * Simplified auth context for single-school system.
 */
export async function getAuthContext(supabase: any) {
    // During refactor, return a guest admin context or check JWT when Django is ready
    return {
        user: { id: 'demo' },
        role: 'admin',
        error: null
    }
}

/**
 * Check rate limit and return error response if exceeded
 */
export function withRateLimit(
    request: NextRequest,
    config: RateLimitConfig = RATE_LIMITS.default
): { limited: boolean; response?: NextResponse } {
    const clientId = getClientIdentifier(request)
    const result = checkRateLimit(clientId, config)

    if (!result.success) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
        return {
            limited: true,
            response: NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(retryAfter),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(result.resetTime)
                    }
                }
            )
        }
    }

    return { limited: false }
}

/**
 * Standard error response helper
 */
export function errorResponse(message: string, status: number = 500) {
    return NextResponse.json({ error: message }, { status })
}

/**
 * Standard unauthorized response
 */
export function unauthorizedResponse() {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

/**
 * Standard forbidden response
 */
export function forbiddenResponse(message: string = 'Permission denied') {
    return NextResponse.json({ error: message }, { status: 403 })
}
