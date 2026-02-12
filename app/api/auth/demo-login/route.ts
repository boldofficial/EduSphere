import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCookieOptions } from '@/lib/auth-utils';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { role } = body;

        // Call the Django backend demo-login endpoint
        const response = await fetch(`${DJANGO_API_URL}/api/users/demo-login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = await response.json();
        const { access, refresh, user } = data;

        // Set cookies
        const cookieStore = await cookies();

        // Access Token
        cookieStore.set('access_token', access, getCookieOptions('access'));

        // Refresh Token
        cookieStore.set('refresh_token', refresh, getCookieOptions('refresh'));

        return NextResponse.json({ success: true, user });
    } catch (error: any) {
        console.error('Demo login error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error?.message
        }, { status: 500 });
    }
}
