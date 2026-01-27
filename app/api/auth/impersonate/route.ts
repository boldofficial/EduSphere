import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { user_id } = body;

        // 1. Get current Super Admin token from cookies to authorize the request
        const cookieStore = await cookies();
        const currentAccessToken = cookieStore.get('access_token')?.value;

        if (!currentAccessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Call Django to impersonate and get new tokens
        const response = await fetch(`${DJANGO_API_URL}/api/users/impersonate/`, {
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

        // 3. Set the NEW cookies (logging out of super admin, into target user)
        cookieStore.set('access_token', access, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60, // 1 hour
        });

        cookieStore.set('refresh_token', refresh, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24, // 1 day
        });

        // 4. Return success and new user data
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
