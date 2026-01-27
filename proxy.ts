import { type NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
    const url = request.nextUrl
    const hostname = request.headers.get('host') || 'edusphere.ng'

    // Define allowed domains (localhost for dev, edusphere.ng for prod)
    // Adjust this logic to handle port numbers in dev
    const currentHost = process.env.NODE_ENV === 'production'
        ? hostname.replace(`.edusphere.ng`, '')
        : hostname.replace(`.localhost:3000`, '')

    // Check if it's a subdomain (e.g. "vine" or "demo")
    // If hostname is "edusphere.ng" or "www.edusphere.ng", subdomain is null/www
    const isSubdomain = currentHost !== 'edusphere.ng' && currentHost !== 'www' && currentHost !== 'localhost:3000';

    // For now, in local dev, let's treat "localhost:3000" as the main system
    // and anything else as tenant if we were using hosts file, but for simplicity
    // we will start by just detecting it.

    const accessToken = request.cookies.get('access_token')
    const { pathname } = request.nextUrl

    // 1. Marketing / System Site Handling (future)
    // if (!isSubdomain) {
    //    return NextResponse.next() // Serve marketing pages
    // }

    // 2. Tenant Dashboard Handling
    // If trying to access protected routes without token, redirect to login
    if (!accessToken && pathname !== '/login' && !pathname.startsWith('/api/')) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Add header for backend to know the tenant (shim for now)
    const response = NextResponse.next()
    if (isSubdomain) {
        response.headers.set('X-Tenant-ID', currentHost)
    }

    return response
}

export const config = {
    matcher: [
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
