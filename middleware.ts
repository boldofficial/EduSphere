import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || '';
    let rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';
    // Cleanup rootDomain to remove port if present
    rootDomain = rootDomain.split(':')[0];

    // 1. Identify if we are on a subdomain of the root domain
    const host = hostname.split(':')[0];
    const isRoot = host === rootDomain || host === `www.${rootDomain}`;

    // Subdomain mode: Only if it's NOT root and ends with .rootDomain
    const isSubdomain = !isRoot && host.endsWith(`.${rootDomain}`);

    let tenantId = null;

    if (isSubdomain) {
        tenantId = host.replace(`.${rootDomain}`, '');
    } else if (!isRoot && host !== 'localhost' && !host.includes('127.0.0.1')) {
        tenantId = host;
    }

    const { pathname } = request.nextUrl;
    const accessToken = request.cookies.get('access_token')?.value;

    // console.log(`[MIDDLEWARE] ${request.method} ${host}${pathname} | tenantId: ${tenantId}`);

    console.log(`[MIDDLEWARE] ${request.method} ${host}${pathname} | tenantId: ${tenantId}`);

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
    if (!accessToken &&
        !pathname.startsWith('/api/') &&
        pathname !== '/login' &&
        pathname !== '/' &&
        !pathname.startsWith('/(marketing)') &&
        !pathname.startsWith('/onboarding')
    ) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';

        // Prevent infinite loop if already on /login
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

    // Add trace to response so browser network tab shows it
    response.headers.set('x-middleware-trace', '1');
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
