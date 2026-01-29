import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || '';
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';

    // 1. Identify if we are on a subdomain of the root domain
    // Example: vine.myregistra.net vs myregistra.net
    const isSubdomain = hostname.endsWith(`.${rootDomain}`);
    const isRoot = hostname === rootDomain || hostname === `www.${rootDomain}`;

    let tenantId = null;

    if (isSubdomain) {
        // Subdomain mode: extract the slug
        tenantId = hostname.replace(`.${rootDomain}`, '');
    } else if (!isRoot) {
        // Custom Domain mode: use the full hostname to look up in DB
        tenantId = hostname;
    }

    console.log(`[MIDDLEWARE_DEBUG] Host: ${hostname}, Root: ${rootDomain}, isSubdomain: ${isSubdomain}, isRoot: ${isRoot}, tenantId: ${tenantId}`);

    const accessToken = request.cookies.get('access_token')?.value;
    const { pathname } = request.nextUrl;

    // 2. Access Control
    // If trying to access protected routes without token, redirect to login
    // BUT allow /api calls to pass through (as they might be for login itself)
    if (!accessToken &&
        !pathname.startsWith('/api/') &&
        pathname !== '/login' &&
        pathname !== '/' &&
        !pathname.startsWith('/(marketing)') &&
        !pathname.startsWith('/onboarding')
    ) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // 3. Inject Tenant Header for internal proxy
    const requestHeaders = new Headers(request.headers);
    if (tenantId) {
        requestHeaders.set('x-tenant-id', tenantId);
    }

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: [
        '/',
        '/dashboard/:path*',
        '/students/:path*',
        '/teachers/:path*',
        '/classes/:path*',
        '/grading/:path*',
        '/attendance/:path*',
        '/bursary/:path*',
        '/settings/:path*',
        '/admissions/:path*',
        '/analytics/:path*',
        '/announcements/:path*',
        '/api/:path*',
    ],
}
