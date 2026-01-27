import { cookies } from 'next/headers';

const DJANGO_API_URL = (process.env.DJANGO_API_URL || 'http://localhost:8000').replace(/\/$/, '') + '/api';

export async function fetchServer(endpoint: string, options: RequestInit = {}) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const res = await fetch(`${DJANGO_API_URL}${endpoint}`, {
        ...options,
        headers,
        cache: options.cache || 'no-store', // Default to no-store for dynamic data
    });

    if (!res.ok) {
        // Handle 401? logic: maybe return null or throw
        if (res.status === 401) {
            console.warn(`[ServerFetch] Unauthorized access to ${endpoint}`);
            return null;
        }
        const error = await res.json().catch(() => ({}));
        throw new Error(error.detail || `API Error: ${res.statusText}`);
    }

    return res.json();
}
