import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const DJANGO_API_URL = 'http://127.0.0.1:8000'; // Define strictly for server-side

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // Call Django to get tokens
        const response = await fetch(`${DJANGO_API_URL}/api/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(errorData, { status: response.status });
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

        // Fetch User Details to return to frontend
        const userRes = await fetch(`${DJANGO_API_URL}/api/users/me/`, {
            headers: {
                'Authorization': `Bearer ${access}`,
                'Content-Type': 'application/json'
            }
        });

        let userData: any = { username };
        if (userRes.ok) {
            userData = await userRes.json();
            // Normalize role
            if (userData.role === 'SUPER_ADMIN') userData.role = 'super_admin';
            else if (userData.role === 'SCHOOL_ADMIN') userData.role = 'admin';
        }

        return NextResponse.json({ success: true, user: userData });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
