import { type NextRequest, NextResponse } from 'next/server'
import { resolveTenantFromHost } from './lib/tenant-host';

export async function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || '';
    let rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';
    // Cleanup rootDomain to remove port if present
    rootDomain = rootDomain.split(':')[0];

    // 1. Identify domain and tenant
    const { tenantId } = resolveTenantFromHost(hostname, rootDomain);

    const { pathname } = request.nextUrl;
    const accessToken = request.cookies.get('access_token')?.value;

    // 2. Access Control
    // Define public paths that don't require authentication
    const publicPaths = [
        '/',
        '/login',
        '/onboarding',
        '/privacy-policy',
        '/terms-of-service',
        '/blog',
        '/careers',
        '/developers',
        '/help',
        '/resources',
        '/success-stories',
        '/admission',
        '/opengraph-image',
        '/twitter-image',
    ];

    const isPublicPath = publicPaths.includes(pathname) ||
        publicPaths.some(p => pathname.startsWith(p + '/')) ||
        pathname.startsWith('/api/') ||
        pathname.includes('.'); // Static files (fallback)

    if (!accessToken && !isPublicPath) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';

        // Prevent infinite loop
        if (pathname === '/login') return NextResponse.next();

        return NextResponse.redirect(url);
    }

    // 3. Inject Tenant Header for internal proxy
    const requestHeaders = new Headers(request.headers);
    if (tenantId) {
        requestHeaders.set('x-tenant-id', tenantId);
    }

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (svg, png, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
    ],
}
