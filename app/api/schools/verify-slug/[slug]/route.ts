import { NextRequest, NextResponse } from 'next/server';

function getDjangoUrl(): string {
    const envUrl = process.env.DJANGO_API_URL;
    const isProd = process.env.NODE_ENV === 'production';
    const defaultUrl = isProd ? 'http://backend:8000' : 'http://127.0.0.1:8001';

    if (envUrl) {
        try {
            const normalized = envUrl.startsWith('http') ? envUrl : `http://${envUrl}`;
            return new URL(normalized).origin;
        } catch {
            return defaultUrl;
        }
    }
    return defaultUrl;
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const safeSlug = (slug || '').trim().toLowerCase();

        if (!safeSlug) {
            return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
        }

        const url = `${getDjangoUrl()}/api/schools/verify-slug/${encodeURIComponent(safeSlug)}/`;
        const response = await fetch(url, {
            method: 'GET',
            cache: 'no-store',
            signal: AbortSignal.timeout(15000),
        });

        const text = await response.text();
        let data: unknown = {};
        try {
            data = JSON.parse(text || '{}');
        } catch {
            data = { error: 'Invalid response from backend' };
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[VERIFY_SLUG_ROUTE] Error:', error);
        return NextResponse.json(
            { error: 'Unable to connect to the server. Please try again in a moment.' },
            { status: 502 }
        );
    }
}

