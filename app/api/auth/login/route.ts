import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCookieOptions } from '@/lib/auth-utils';
import { resolveTenantFromHost } from '@/lib/tenant-host';
import { logError, logInfo } from '@/lib/logger';

function getDjangoUrl(): string {
    const envUrl = process.env.DJANGO_API_URL;
    const isProd = process.env.NODE_ENV === 'production';
    if (envUrl) {
        try {
            const url = new URL(envUrl.startsWith('http') ? envUrl : `http://${envUrl}`);
            return url.origin;
        } catch {
            return isProd ? 'http://127.0.0.1:8000' : 'http://127.0.0.1:8001';
        }
    }
    return isProd ? 'http://127.0.0.1:8000' : 'http://127.0.0.1:8001';
}

export async function POST(request: NextRequest) {
    try {
        const isProd = process.env.NODE_ENV === 'production';
        const baseUrl = getDjangoUrl();
        const tokenUrl = `${baseUrl}/api/token/`;

        if (!isProd) {
            logInfo(`Login request to ${tokenUrl}`);
        }

        const body = await request.json();
        const { username, password } = body;

        const headerTenantId = request.headers.get('x-tenant-id');
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';
        const fallbackTenantId = resolveTenantFromHost(request.headers.get('host') || '', rootDomain).tenantId;
        const tenantId = headerTenantId || fallbackTenantId;
        const authHeaders: HeadersInit = { 'Content-Type': 'application/json' };
        if (tenantId) {
            authHeaders['X-Tenant-ID'] = tenantId;
        }

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ username, password }),
            cache: 'no-store',
            signal: AbortSignal.timeout(20000),
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                return NextResponse.json(errorData, { status: response.status });
            } catch {
                return NextResponse.json({ error: 'Backend error', details: errorText }, { status: response.status });
            }
        }

        const data = await response.json();
        const { access, refresh } = data;

        const cookieStore = await cookies();
        cookieStore.set('access_token', access, getCookieOptions('access'));
        cookieStore.set('refresh_token', refresh, getCookieOptions('refresh'));

        const meUrl = `${baseUrl}/api/users/me/`;

        const meHeaders: HeadersInit = {
            'Authorization': `Bearer ${access}`,
            'Content-Type': 'application/json'
        };
        if (tenantId) {
            meHeaders['X-Tenant-ID'] = tenantId;
        }

        const userRes = await fetch(meUrl, {
            headers: meHeaders,
            cache: 'no-store',
            signal: AbortSignal.timeout(20000),
        });

        let userData: Record<string, unknown> = { username };
        if (userRes.ok) {
            userData = await userRes.json();
            if (userData.role === 'SUPER_ADMIN') userData.role = 'super_admin';
            else if (userData.role === 'SCHOOL_ADMIN') userData.role = 'admin';
        }

        // Check if 2FA is required
        const twoFactorEnabled = userData.two_factor_enabled as boolean;
        
        if (twoFactorEnabled) {
            // Return partial success with 2FA required
            // Don't set cookies yet - wait for 2FA verification
            return NextResponse.json({ 
                success: true, 
                user: userData,
                requires_2fa: true,
                temp_token: access // Temporary token for 2FA verification
            });
        }

        return NextResponse.json({ success: true, user: userData });
    } catch (error) {
        const isProd = process.env.NODE_ENV === 'production';
        logError('Login failed', error, { isProd });
        
        const isConnectionError = (error as NodeJS.ErrnoException)?.code === 'ECONNREFUSED' || (error as Error)?.message?.includes('fetch failed');

        const payload: Record<string, unknown> = {
            error: isConnectionError ? 'Backend Connection Error' : 'Internal Server Error',
        };

        return NextResponse.json(payload, { status: 500 });
    }
}
