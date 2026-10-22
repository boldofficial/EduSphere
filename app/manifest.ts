import { MetadataRoute } from 'next';
import { getPublicSite, getRequestTenant } from '@/lib/public-site';

/** "Add to home screen" details: the school's own name, icon and colour on school sites. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const tenant = await getRequestTenant();

  if (!tenant) {
    return {
      name: 'Registra School OS',
      short_name: 'Registra',
      description:
        'The operating system for modern schools. Unified management for students, staff, and academics.',
      start_url: '/',
      display: 'standalone',
      background_color: '#0b1e3b',
      theme_color: '#0b1e3b',
      icons: [
        { src: '/favicon.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        { src: '/favicon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    };
  }

  const site = await getPublicSite(tenant);
  const name = site?.school_name || 'School Portal';
  const color = site?.landing_primary_color || '#1A3A5C';
  return {
    name,
    short_name: name.length > 12 ? name.split(/\s+/)[0] : name,
    description:
      site?.school_tagline || 'Access your school records, fees, and academic performance.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: color,
    icons: [
      { src: '/site-icon', sizes: '192x192', purpose: 'any' },
      { src: '/site-icon', sizes: '512x512', purpose: 'any' },
    ],
  };
}
