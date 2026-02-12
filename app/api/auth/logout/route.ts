import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDeleteOptions } from '@/lib/auth-utils';

export async function POST() {
    try {
        const cookieStore = await cookies();

        // Clear cookies
        const options = getDeleteOptions();
        cookieStore.set('access_token', '', { ...options, maxAge: 0 });
        cookieStore.set('refresh_token', '', { ...options, maxAge: 0 });

        return NextResponse.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
    }
}
