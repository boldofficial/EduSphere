// Supabase imports removed
import { uploadBase64ToR2, generateFileKey } from '@/lib/r2'
import { NextRequest, NextResponse } from 'next/server'
import {
    safeJsonParse,
    withRateLimit,
    errorResponse,
    unauthorizedResponse
} from '@/lib/api-utils'
import { RATE_LIMITS } from '@/lib/rate-limit'

// POST /api/upload - Upload a file to R2
export async function POST(request: NextRequest) {
    // Stricter rate limit for uploads
    const rateCheck = withRateLimit(request, RATE_LIMITS.upload)
    if (rateCheck.limited) return rateCheck.response!

    try {
        // Dummy user context for refactor phase
        const user = { id: 'demo' };
        if (!user) {
            return unauthorizedResponse()
        }

        const { data: body, error: parseError } = await safeJsonParse(request)
        if (parseError) {
            return errorResponse(parseError, 400)
        }

        const { base64Data, folder, fileName, contentType } = body

        if (!base64Data || !folder || !fileName) {
            return errorResponse('Missing required fields: base64Data, folder, fileName', 400)
        }

        // Validate file size (max 5MB for base64)
        const base64Size = base64Data.length * 0.75 // Approximate decoded size
        if (base64Size > 5 * 1024 * 1024) {
            return errorResponse('File too large. Maximum size is 5MB.', 400)
        }

        // Generate unique file key (no school_id prefix for single school)
        const key = generateFileKey(folder, fileName)

        // Upload to R2
        const url = await uploadBase64ToR2(
            base64Data,
            key,
            contentType || 'image/jpeg'
        )

        return NextResponse.json({ url, key })
    } catch (error) {
        console.error('Upload API error:', error)
        return errorResponse('Upload failed')
    }
}

