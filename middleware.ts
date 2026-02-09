import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || '';
    let rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';
    // Cleanup rootDomain to remove port if present
    rootDomain = rootDomain.split(':')[0];

    // 1. Identify domain and tenant
    const host = hostname.split(':')[0];
    const cleanRoot = rootDomain.replace(/^www\./, '');
    const cleanHost = host.replace(/^www\./, '');

    // It's root if it matches the root domain (ignoring www prefix)
    const isRoot = cleanHost === cleanRoot;

    // Subdomain mode: Only if it's NOT root and ends with .rootDomain
    const isSubdomain = !isRoot && host.endsWith(`.${rootDomain}`);

    let tenantId = null;
    if (isSubdomain) {
        // Handle www.tenant.domain -> should still be tenant
        tenantId = cleanHost.replace(`.${cleanRoot}`, '');
    } else if (!isRoot &&
        host !== 'localhost' &&
        !host.includes('127.0.0.1') &&
        !host.includes('localhost') // Defensive against things like localhost:3001
    ) {
        tenantId = host;
    }

    const { pathname } = request.nextUrl;
    const accessToken = request.cookies.get('access_token')?.value;

    // Deep Tracing for Debugging
    console.log(`[MIDDLEWARE_TRACE] ${request.method} ${host}${pathname}`);
    console.log(`[MIDDLEWARE_INFO] isRoot: ${isRoot}, isSubdomain: ${isSubdomain}, tenantId: ${tenantId}`);
    console.log(`[MIDDLEWARE_HEADERS] Proto: ${request.headers.get('x-forwarded-proto')}, Host: ${request.headers.get('x-forwarded-host')}`);

    // Debug helper: allow checking if middleware is active on subdomain
    if (pathname === '/api/middleware-check') {
        return NextResponse.json({
            success: true,
            host,
            tenantId,
            isSubdomain,
            isRoot,
            rootDomain
        });
    }

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
        '/admission'
    ];

    const isPublicPath = publicPaths.includes(pathname) ||
        publicPaths.some(p => pathname.startsWith(p + '/')) ||
        pathname.startsWith('/api/') ||
        pathname.includes('.'); // Static files (fallback)

    if (!accessToken && !isPublicPath) {
        console.log(`[MIDDLEWARE_REDIRECT] Redirecting unauthenticated user from ${pathname} to /login`);
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

    // Add trace headers for debugging
    requestHeaders.set('x-middleware-auth', accessToken ? 'true' : 'false');
    requestHeaders.set('x-middleware-tenant', tenantId || 'none');

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    // Add trace to response for browser viewing
    response.headers.set('x-middleware-trace', '2');
    response.headers.set('x-tenant-detected', tenantId || 'none');
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
