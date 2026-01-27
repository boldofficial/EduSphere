import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://127.0.0.1:8000';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, params);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, params);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, params);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, params);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, params);
}

async function handleProxy(request: NextRequest, params: Promise<{ path: string[] }>) {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path;
    const path = pathSegments.join('/');
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    // Detect if this is a media request or a standard API request
    const isMedia = pathSegments[0] === 'media';
    const baseUrl = isMedia ? DJANGO_API_URL : `${DJANGO_API_URL}/api`;

    // For media, don't append trailing slash. For API, ensure a single trailing slash.
    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const url = isMedia ? `${baseUrl}/${path}` : `${baseUrl}/${cleanPath}/`;

    const queryString = request.nextUrl.search;
    const fullUrl = url + queryString;

    const headers: HeadersInit = isMedia ? {} : {
        'Content-Type': 'application/json',
    };

    if (accessToken && !isMedia) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Forward Tenant ID if present (set by Middleware)
    const tenantId = request.headers.get('x-tenant-id');
    if (tenantId) {
        headers['X-Tenant-ID'] = tenantId;
    }

    try {
        const bodyText = request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined;
        console.log(`[PROXY] ${request.method} ${fullUrl} (Body length: ${bodyText?.length || 0})`);

        const response = await fetch(fullUrl, {
            method: request.method,
            headers: headers,
            body: bodyText,
            cache: 'no-store',
            // @ts-ignore
            next: { revalidate: 0 },
            signal: AbortSignal.timeout(60000),
        });

        if (response.status === 204) {
            return new Response(null, { status: 204 });
        }

        // For media files, proxy the blob data directly
        if (isMedia) {
            const blob = await response.blob();
            const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
            return new Response(blob, {
                status: response.status,
                headers: { 'Content-Type': contentType }
            });
        }

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText || '{}');
        } catch (e) {
            console.error(`[PROXY] JSON Parse Error for ${fullUrl}. Body: ${responseText.slice(0, 200)}`);
            data = { error: 'Invalid JSON from backend', raw: responseText.slice(0, 200) };
        }

        if (!response.ok) {
            console.warn(`[PROXY] Backend Error ${response.status} for ${fullUrl}:`, data);
        }

        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        console.error(`[PROXY] System Error [${request.method} ${path}]:`, error);
        return NextResponse.json({ error: 'Proxy Request Failed', details: (error as Error).message }, { status: 502 });
    }
}
