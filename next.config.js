/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable standalone output for minimal Docker image size
    output: 'standalone',

    // Disable heavy checks during build to prevent OOM/crashing on build servers
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },

    // Security headers for production
    async headers() {
        const isProd = process.env.NODE_ENV === 'production';
        
        // Only enforce CSP in production
        const csp = isProd 
            ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://*.r2.dev; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'; upgrade-insecure-requests;"
            : "default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src *;";
        
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: csp
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload'
                    },
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
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
        const envUrl = process.env.DJANGO_API_URL || 'http://127.0.0.1:8001';
        let apiUrl = envUrl;
        let mediaUrl = envUrl;
        
        try {
            const apiParsed = new URL(envUrl.startsWith('http') ? envUrl : `http://${envUrl}`);
            apiUrl = apiParsed.origin;
            mediaUrl = apiParsed.origin;
        } catch {
            apiUrl = 'http://127.0.0.1:8001';
            mediaUrl = 'http://127.0.0.1:8001';
        }
        
        return {
            fallback: [
                {
                    source: '/admin/:path*',
                    destination: `${apiUrl}/admin/:path*`,
                },
                {
                    source: '/django-static/:path*',
                    destination: `${apiUrl}/django-static/:path*`,
                },
                {
                    source: '/media/:path*',
                    destination: `${mediaUrl}/media/:path*`,
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