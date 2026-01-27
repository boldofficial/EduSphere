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

    // For media, don't append trailing slash. For API, keep it for Django consistency.
    const url = isMedia ? `${baseUrl}/${path}` : `${baseUrl}/${path}/`;

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
        const body = request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined;

        const response = await fetch(fullUrl, {
            method: request.method,
            headers: headers,
            body: body,
            cache: 'no-store',
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

        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        console.error(`Proxy Error [${request.method} ${path}]:`, error);
        return NextResponse.json({ error: 'Proxy Request Failed' }, { status: 502 });
    }
}
