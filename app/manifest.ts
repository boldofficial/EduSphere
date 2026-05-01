import { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { resolveTenantFromHost } from '@/lib/tenant-host'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';
    const { isRootHost } = resolveTenantFromHost(host, rootDomain);

    const name = isRootHost ? 'Registra School OS' : 'School Portal | Registra';
    const shortName = isRootHost ? 'Registra' : 'Portal';
    const description = isRootHost 
        ? 'The operating system for modern schools. Unified management for students, staff, and academics.'
        : 'Access your school records, fees, and academic performance.';

    return {
        name,
        short_name: shortName,
        description,
        start_url: '/',
        display: 'standalone',
        background_color: '#0b1e3b',
        theme_color: '#0b1e3b',
        icons: [
            {
                src: '/favicon.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/favicon.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    }
}
