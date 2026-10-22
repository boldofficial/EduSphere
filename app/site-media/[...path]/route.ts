import { NextRequest } from 'next/server';

const DJANGO_API_URL = (process.env.DJANGO_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const SAFE_PATH = /^website\/\d+\/[A-Za-z0-9_-]{1,80}\.(?:webp|png|jpe?g|gif)$/;

/**
 * Permanent public address for school website images (logo, hero, gallery…), served from the school's own
 * domain. Files never change once written (random names), so they are cached for a year by browsers and CDNs.
 * Only the website/ folder is reachable; the backend enforces the same rule.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const path = (await params).path.join('/');
  if (!SAFE_PATH.test(path)) return new Response('Not found', { status: 404 });

  try {
    const upstream = await fetch(`${DJANGO_API_URL}/api/core/site-media/${path}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    if (!upstream.ok || !upstream.body) return new Response('Not found', { status: 404 });
    return new Response(upstream.body, {
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Image unavailable', { status: 502 });
  }
}
