import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';
    
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/dashboard/',
                '/api/',
                '/admin/',
                '/_next/',
                '/static/',
            ],
        },
        sitemap: `https://${rootDomain}/sitemap.xml`,
    }
}
