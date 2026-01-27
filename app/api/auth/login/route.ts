import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://127.0.0.1:8000'; // Define strictly for server-side

export async function POST(request: NextRequest) {
    try {
        const djangoUrl = process.env.DJANGO_API_URL;
        console.log('Attempting login. DJANGO_API_URL set to:', djangoUrl);

        if (!djangoUrl) {
            console.error('CRITICAL: DJANGO_API_URL is NOT set in environment variables.');
        }

        const baseUrl = djangoUrl || 'http://127.0.0.1:8000';
        // Ensure we don't have double slashes and have a trailing slash for Django if needed
        const tokenUrl = `${baseUrl.replace(/\/$/, '')}/api/token/`;

        console.log('Fetching from:', tokenUrl);

        const body = await request.json();
        const { username, password } = body;

        const tenantId = request.headers.get('x-tenant-id');
        const authHeaders: HeadersInit = { 'Content-Type': 'application/json' };
        if (tenantId) {
            authHeaders['X-Tenant-ID'] = tenantId;
        }

        // Call Django to get tokens
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ username, password }),
        });

        console.log('Django token response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Django token error response:', errorText);
            try {
                const errorData = JSON.parse(errorText);
                return NextResponse.json(errorData, { status: response.status });
            } catch (k) {
                return NextResponse.json({ error: 'Backend error', details: errorText }, { status: response.status });
            }
        }

        const data = await response.json();
        const { access, refresh } = data;

        // Set cookies
        const cookieStore = await cookies();

        // Access Token
        cookieStore.set('access_token', access, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60, // 1 hour
        });

        // Refresh Token
        cookieStore.set('refresh_token', refresh, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24, // 1 day
        });

        const meUrl = `${baseUrl.replace(/\/$/, '')}/api/users/me/`;
        console.log('Fetching user details from:', meUrl);

        const meHeaders: HeadersInit = {
            'Authorization': `Bearer ${access}`,
            'Content-Type': 'application/json'
        };
        if (tenantId) {
            meHeaders['X-Tenant-ID'] = tenantId;
        }

        // Fetch User Details to return to frontend
        const userRes = await fetch(meUrl, {
            headers: meHeaders
        });

        console.log('Django user/me response status:', userRes.status);

        let userData: any = { username };
        if (userRes.ok) {
            userData = await userRes.json();
            // Normalize role
            if (userData.role === 'SUPER_ADMIN') userData.role = 'super_admin';
            else if (userData.role === 'SCHOOL_ADMIN') userData.role = 'admin';
        }

        return NextResponse.json({ success: true, user: userData });
    } catch (error: any) {
        console.error('Detailed login error:', {
            name: error?.name,
            message: error?.message,
            stack: error?.stack,
            cause: error?.cause
        });
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error?.message,
            django_url: process.env.DJANGO_API_URL
        }, { status: 500 });
    }
}
