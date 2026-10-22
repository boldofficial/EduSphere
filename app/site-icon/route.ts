import { NextRequest } from 'next/server';
import { getPublicSite, getRequestTenant } from '@/lib/public-site';

const DJANGO_API_URL = (process.env.DJANGO_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const CACHE = 'public, max-age=86400, stale-while-revalidate=604800';

/** Where the server can fetch a logo address that the browser would use. */
function serverUrlFor(logo: string): string | null {
  if (logo.startsWith('/site-media/'))
    return `${DJANGO_API_URL}/api/core/site-media/${logo.slice(12)}`;
  if (logo.startsWith('/api/media/')) return `${DJANGO_API_URL}/media/${logo.slice(11)}`;
  if (logo.startsWith('https://')) {
    // Only our own storage: the server must never fetch arbitrary addresses (SSRF).
    try {
      const host = new URL(logo).hostname;
      const mediaBase = process.env.NEXT_PUBLIC_WEBSITE_MEDIA_HOST || '';
      if (
        host.endsWith('.r2.cloudflarestorage.com') ||
        host.endsWith('.r2.dev') ||
        (mediaBase && host === mediaBase)
      ) {
        return logo;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** A tidy initial-letter icon in the school's colour, for schools that haven't uploaded a logo. */
function letterIcon(name: string, color: string) {
  const letter = escapeXml((name.trim()[0] || 'S').toUpperCase());
  const fill = /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : '#1A3A5C';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${fill}"/><text x="32" y="43" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#ffffff">${letter}</text></svg>`;
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': CACHE },
  });
}

/**
 * The browser-tab / home-screen icon for the current school: its uploaded logo, or a letter icon.
 * Served from the school's own domain so it works everywhere and caches well.
 */
export async function GET(request: NextRequest) {
  const tenant = await getRequestTenant();
  if (!tenant) return Response.redirect(new URL('/favicon.png', request.nextUrl.origin), 302);

  const site = await getPublicSite(tenant);
  const name = site?.school_name || 'School';
  const color = site?.landing_primary_color || '#1A3A5C';
  const logo = typeof site?.logo_media === 'string' ? site.logo_media : '';
  const source = logo ? serverUrlFor(logo) : null;

  if (source) {
    try {
      const res = await fetch(source, { signal: AbortSignal.timeout(5000), cache: 'no-store' });
      const type = res.headers.get('content-type') || '';
      if (res.ok && type.startsWith('image/')) {
        return new Response(await res.arrayBuffer(), {
          headers: {
            'Content-Type': type,
            'Cache-Control': CACHE,
            'X-Content-Type-Options': 'nosniff',
          },
        });
      }
    } catch {
      // fall through to the letter icon
    }
  }
  return letterIcon(name, color);
}
