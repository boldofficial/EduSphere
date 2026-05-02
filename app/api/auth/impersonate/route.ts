import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCookieOptions } from '@/lib/auth-utils';

function getDjangoUrl(): string {
    const envUrl = process.env.DJANGO_API_URL;
    const isProd = process.env.NODE_ENV === 'production';
    const defaultUrl = isProd ? 'http://backend:8000' : 'http://127.0.0.1:8001';
    if (envUrl) {
        try {
            const url = new URL(envUrl.startsWith('http') ? envUrl : `http://${envUrl}`);
            return url.origin;
        } catch {
            return defaultUrl;
        }
    }
    return defaultUrl;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
        return JSON.parse(payload);
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { user_id } = body;

        const cookieStore = await cookies();
        const currentAccessToken = cookieStore.get('access_token')?.value;

        if (!currentAccessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = decodeJwtPayload(currentAccessToken);
        if (!payload || payload.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden - SUPER_ADMIN role required' }, { status: 403 });
        }

        const response = await fetch(`${getDjangoUrl()}/api/users/impersonate/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentAccessToken}`
            },
            body: JSON.stringify({ user_id }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = await response.json();
        const { access, refresh, user } = data;

        // 4. Set the NEW cookies
        cookieStore.set('access_token', access, getCookieOptions('access'));

        cookieStore.set('refresh_token', refresh, getCookieOptions('refresh'));

        // 5. Return success and new user data
        return NextResponse.json({
            success: true,
            user: {
                ...user,
                role: user.role === 'SCHOOL_ADMIN' ? 'admin' : user.role.toLowerCase()
            }
        });
    } catch (error) {
        console.error('Impersonation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
