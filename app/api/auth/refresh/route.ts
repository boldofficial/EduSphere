import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCookieOptions, getDeleteOptions } from '@/lib/auth-utils';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://127.0.0.1:8000';

/**
 * API Route to refresh the JWT access token using the refresh token stored in cookies.
 * This route proxies the request to the Django backend.
 */
export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const refreshToken = (await cookieStore).get('refresh_token')?.value;

    if (!refreshToken) {
        return NextResponse.json({ error: 'No refresh token available' }, { status: 401 });
    }

    try {
        const tenantId = request.headers.get('x-tenant-id');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (tenantId) {
            headers['X-Tenant-ID'] = tenantId;
        }

        const response = await fetch(`${DJANGO_API_URL}/api/token/refresh/`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ refresh: refreshToken }),
        });

        if (!response.ok) {
            // Refresh token is likely expired or invalid
            const res = NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
            // Clear invalid cookies
            const deleteOptions = getDeleteOptions();
            res.cookies.set('access_token', '', { ...deleteOptions, maxAge: 0 });
            res.cookies.set('refresh_token', '', { ...deleteOptions, maxAge: 0 });
            return res;
        }

        const data = await response.json();

        const res = NextResponse.json({ success: true });

        // Update access token cookie
        res.cookies.set('access_token', data.access, getCookieOptions('access'));

        // Update refresh token if rotated by backend
        if (data.refresh) {
            res.cookies.set('refresh_token', data.refresh, getCookieOptions('refresh'));
        }

        return res;
    } catch (error) {
        console.error('Token refresh error:', error);
        return NextResponse.json({ error: 'Unexpected error during token refresh' }, { status: 500 });
    }
}
