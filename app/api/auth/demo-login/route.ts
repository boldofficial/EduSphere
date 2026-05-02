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

const DEMO_TENANT_DOMAIN = process.env.DEMO_TENANT_DOMAIN || 'demo.myregistra.net';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { role } = body;

        const demoTenantId = DEMO_TENANT_DOMAIN.split('.')[0];

        const response = await fetch(`${getDjangoUrl()}/api/users/demo-login/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Tenant-ID': demoTenantId
            },
            body: JSON.stringify({ role }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = await response.json();
        const { access, refresh, user } = data;

        const cookieStore = await cookies();

        cookieStore.set('access_token', access, getCookieOptions('access'));

        cookieStore.set('refresh_token', refresh, getCookieOptions('refresh'));

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error('Demo login error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
        }, { status: 500 });
    }
}
