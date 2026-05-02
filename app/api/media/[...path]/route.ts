import { NextRequest, NextResponse } from 'next/server';

function getDjangoUrl(): string {
    const envUrl = process.env.DJANGO_API_URL;
    const isDev = process.env.NODE_ENV !== 'production';
    const defaultUrl = isDev ? 'http://127.0.0.1:8001' : 'http://backend:8000';
    
    if (envUrl) {
        if (envUrl.startsWith('http')) {
            try {
                const url = new URL(envUrl);
                return url.origin;
            } catch {
                return defaultUrl;
            }
        }
        return `http://${envUrl}`;
    }
    return defaultUrl;
}

// GET /api/media/:path - Serve media files directly from Django
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const mediaPath = path.join('/');
    
    const djangoUrl = getDjangoUrl();
    const fullUrl = `${djangoUrl}/media/${mediaPath}`;
    
    console.log(`[MEDIA_ROUTE] Fetching: ${fullUrl}`);
    
    try {
        const response = await fetch(fullUrl, {
            method: 'GET',
            cache: 'no-store',
        });
        
        if (!response.ok) {
            console.error(`[MEDIA_ROUTE] Not found: ${response.status}`);
            return new Response('Not found', { status: 404 });
        }
        
        const blob = await response.blob();
        const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
        
        return new NextResponse(blob, {
            status: 200,
            headers: {
                'Content-Type': contentType,
            },
        });
    } catch (error) {
        console.error(`[MEDIA_ROUTE] Error:`, error);
        return NextResponse.json({ error: 'Error loading media' }, { status: 500 });
    }
}
