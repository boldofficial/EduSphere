import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || '';
    let rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';
    // Cleanup rootDomain to remove port if present
    rootDomain = rootDomain.split(':')[0];

    // 1. Identify if we are on a subdomain of the root domain
    // Example: vine.myregistra.net vs myregistra.net
    // Cleanup host to remove port if present (e.g. for local dev or proxy mismatch)
    const host = hostname.split(':')[0];
    const isSubdomain = host.endsWith(`.${rootDomain}`);
    const isRoot = host === rootDomain || host === `www.${rootDomain}`;

    let tenantId = null;

    if (isSubdomain) {
        // Subdomain mode: extract the slug
        tenantId = host.replace(`.${rootDomain}`, '');
    } else if (!isRoot && host !== 'localhost' && !host.includes('127.0.0.1')) {
        // Custom Domain mode: use the full hostname to look up in DB
        tenantId = host;
    }

    console.log(`[MIDDLEWARE_DEBUG] Host: ${host}, Root: ${rootDomain}, isSubdomain: ${isSubdomain}, isRoot: ${isRoot}, tenantId: ${tenantId}`);

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
    ],
}
