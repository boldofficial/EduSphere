import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCookieOptions } from '@/lib/auth-utils';
import { resolveTenantFromHost } from '@/lib/tenant-host';

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

export async function POST(request: NextRequest) {
    try {
        const baseUrl = getDjangoUrl();
        
        // Get the temporary token from Authorization header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const tempToken = authHeader.substring(7);
        
        const body = await request.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
        }

        const headerTenantId = request.headers.get('x-tenant-id');
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';
        const fallbackTenantId = resolveTenantFromHost(request.headers.get('host') || '', rootDomain).tenantId;
        const tenantId = headerTenantId || fallbackTenantId;

        const authHeaders: HeadersInit = { 
            'Content-Type': 'application/json'
        };
        if (tenantId) {
            authHeaders['X-Tenant-ID'] = tenantId;
        }

        // Call Django 2FA login endpoint
        const response = await fetch(`${baseUrl}/api/users/2fa/login/`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ code, two_factor_token: tempToken }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = await response.json();
        const { access, refresh } = data;

        // Set the actual tokens
        const cookieStore = await cookies();
        cookieStore.set('access_token', access, getCookieOptions('access'));
        cookieStore.set('refresh_token', refresh, getCookieOptions('refresh'));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('2FA verification error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
