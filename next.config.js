/** @type {import('next').NextConfig} */
const nextConfig = {
    // NOTE: GEMINI_API_KEY is available server-side only via process.env.GEMINI_API_KEY
    // Do NOT expose it to the client via the `env` config block.

    // Security headers for production
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()'
                    }
                ]
            },
            {
                // CSP for API routes
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, max-age=0'
                    }
                ]
            }
        ]
    },

    // Optimize images
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.r2.cloudflarestorage.com',
            },
            {
                protocol: 'https',
                hostname: '**.r2.dev',
            }
        ],
    },

    // Production optimizations
    poweredByHeader: false,
    compress: true,

    async rewrites() {
        const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://127.0.0.1:8000';
        return {
            // Fallback rewrites only apply when no matching Next.js page or API route exists.
            // This ensures Route Handlers (e.g. /api/auth/login, /api/proxy/*) take priority,
            // while Django still handles /api/users/, /api/schools/, /admin/, etc.
            fallback: [
                {
                    source: '/api/:path*',
                    destination: `${DJANGO_API_URL}/api/:path*`,
                },
                {
                    source: '/admin/:path*',
                    destination: `${DJANGO_API_URL}/admin/:path*`,
                },
                {
                    source: '/django-static/:path*',
                    destination: `${DJANGO_API_URL}/django-static/:path*`,
                },
                {
                    source: '/media/:path*',
                    destination: `${DJANGO_API_URL}/media/:path*`,
                },
            ],
        };
    },
}

const withPWA = require('next-pwa')({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
});

module.exports = withPWA(nextConfig);