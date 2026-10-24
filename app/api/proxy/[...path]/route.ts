import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { siteCacheTag } from '@/lib/site-cache';
import { cookies } from 'next/headers';
import { resolveTenantFromHost } from '@/lib/tenant-host';
import { validateRequestBody } from '@/lib/request-validation';
import { getRateLimitConfig, checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';

function getDjangoUrl(): string {
  const envUrl = process.env.DJANGO_API_URL;
  const isDev = process.env.NODE_ENV !== 'production';
  const defaultUrl = isDev ? 'http://127.0.0.1:8001' : 'http://backend:8000';

  if (envUrl) {
    // Handle full URLs like http://127.0.0.1:8001
    if (envUrl.startsWith('http')) {
      try {
        const url = new URL(envUrl);
        return url.origin;
      } catch {
        return defaultUrl;
      }
    }
    // Handle host:port format like 127.0.0.1:8001
    return `http://${envUrl}`;
  }
  return defaultUrl;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params);
}

function affectsPublicSite(path: string) {
  return /^(core\/settings|schools\/website-media)(\/|$)/.test(path);
}

async function handleProxy(request: NextRequest, params: Promise<{ path: string[] }>) {
  const resolvedParams = await params;
  const pathSegments = resolvedParams.path;
  const path = pathSegments.join('/');
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  const isMedia = pathSegments[0] === 'media';
  const baseUrl = isMedia ? getDjangoUrl() : `${getDjangoUrl()}/api`;

  // Build URL cleanly - avoid double slashes
  let urlPath = path;
  if (!urlPath.startsWith('/')) urlPath = '/' + urlPath;

  const url = isMedia ? baseUrl + urlPath : baseUrl + urlPath + '/';

  const queryString = request.nextUrl.search;
  const fullUrl = url + queryString;

  // Debug media URLs
  if (isMedia && process.env.NODE_ENV !== 'production') {
    console.log(`[PROXY_MEDIA] ${request.method} ${path} -> ${fullUrl}`);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[PROXY] ${request.method} ${path} -> ${fullUrl}`);
  }

  // Rate limiting
  const identifier = getClientIdentifier(request, accessToken);
  const rateLimitConfig = getRateLimitConfig(path, request.method);
  const rateLimitResult = await checkRateLimit(identifier, rateLimitConfig);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  // File uploads (multipart) are forwarded byte-for-byte with their boundary; everything else is JSON.
  const incomingType = request.headers.get('content-type') || '';
  const isMultipart = incomingType.startsWith('multipart/form-data');
  const headers: Record<string, string> = isMedia
    ? {}
    : {
        'Content-Type': isMultipart ? incomingType : 'application/json',
      };

  if (accessToken && !isMedia) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const headerTenantId = request.headers.get('x-tenant-id');
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost';
  const resolvedTenant = resolveTenantFromHost(
    request.headers.get('host') || '',
    rootDomain
  ).tenantId;

  // Prefer header tenant, fallback to resolved
  let tenantId: string | undefined;
  if (headerTenantId && headerTenantId !== 'null' && headerTenantId !== 'undefined') {
    tenantId = headerTenantId;
  } else if (resolvedTenant && resolvedTenant !== 'null' && resolvedTenant !== 'undefined') {
    tenantId = resolvedTenant;
  }

  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }

  try {
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
    const bodyText = hasBody && !isMultipart ? await request.text() : undefined;
    const body: BodyInit | undefined =
      hasBody && isMultipart ? await request.arrayBuffer() : bodyText;

    // Validate request body for mutations
    if (bodyText && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const body = JSON.parse(bodyText);
        const validation = validateRequestBody(path, body);

        if (!validation.success) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
      } catch {
        // Not JSON - continue
      }
    }

    const response = await fetch(fullUrl, {
      method: request.method,
      headers: headers,
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(60000),
    });

    // A school's public website is cached on the server; refresh it as soon as its content changes.
    if (response.ok && tenantId && request.method !== 'GET' && affectsPublicSite(path)) {
      revalidateTag(siteCacheTag(tenantId), { expire: 0 });
    }

    if (response.status === 204) {
      return new Response(null, { status: 204 });
    }

    if (isMedia) {
      if (response.ok) {
        const blob = await response.blob();
        const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
        console.log(
          `[PROXY_MEDIA] Success: ${response.status}, size=${blob.size}, type=${contentType}`
        );
        return new Response(blob, {
          status: response.status,
          headers: { 'Content-Type': contentType },
        });
      } else {
        console.error(`[PROXY_MEDIA] Failed: ${response.status} for ${fullUrl}`);
        return new Response('Media not found', { status: 404 });
      }
    }

    // Files (CSV exports, PDFs, login slips) pass through unchanged, keeping their download name.
    const backendType = response.headers.get('Content-Type') || '';
    if (response.ok && backendType && !backendType.includes('json')) {
      const passHeaders: Record<string, string> = { 'Content-Type': backendType };
      const disposition = response.headers.get('Content-Disposition');
      if (disposition) passHeaders['Content-Disposition'] = disposition;
      return new Response(await response.blob(), { status: response.status, headers: passHeaders });
    }

    const responseText = await response.text();
    const isProd = process.env.NODE_ENV === 'production';
    let data;

    try {
      data = JSON.parse(responseText || '{}');
    } catch {
      console.warn(`[PROXY_WARN] JSON Parse Failed for ${fullUrl}`);
      const errorData: Record<string, unknown> = {
        error: 'Invalid response format from backend',
        status: response.status,
      };
      if (!isProd) {
        (errorData as any).raw_preview = responseText.slice(0, 500);
      }
      data = errorData;
    }

    if (!response.ok) {
      console.error(`[PROXY_ERROR] Backend returned ${response.status} for ${fullUrl}`);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[PROXY_CRITICAL] ${request.method} ${path}:`, error);
    const isProd = process.env.NODE_ENV === 'production';
    const payload: Record<string, unknown> = { error: 'Internal Proxy Error' };
    if (!isProd) {
      payload.details = (error as Error).message;
    }
    return NextResponse.json(payload, { status: 502 });
  }
}
