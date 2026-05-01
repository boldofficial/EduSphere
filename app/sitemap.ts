import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';
    const baseUrl = `https://${rootDomain}`;

    // Standard marketing pages
    const routes = [
        '',
        '/blog',
        '/careers',
        '/developers',
        '/help',
        '/resources',
        '/success-stories',
        '/privacy-policy',
        '/terms-of-service',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    return routes;
}
