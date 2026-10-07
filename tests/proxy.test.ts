import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { checkRateLimit } = vi.hoisted(() => ({ checkRateLimit: vi.fn() }));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: 'mock-token' }),
  }),
}));

vi.mock('@/lib/tenant-host', () => ({
  resolveTenantFromHost: vi.fn().mockReturnValue({ tenantId: 'mock-tenant' }),
}));

vi.mock('@/lib/rate-limit', async (importOriginal) => ({
  ...((await importOriginal()) as object),
  checkRateLimit,
}));

global.fetch = vi.fn();

describe('Proxy Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DJANGO_API_URL = 'http://backend:8000';
    checkRateLimit.mockResolvedValue({
      success: true,
      remaining: 99,
      resetTime: Date.now() + 60000,
    });
  });

  it('forwards GET requests to Django with auth and tenant headers', async () => {
    const { GET } = await import('@/app/api/proxy/[...path]/route');
    const request = new NextRequest('http://localhost:3000/api/proxy/students', {
      method: 'GET',
      headers: { host: 'localhost:3000' },
    });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(JSON.stringify({ success: true })),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });

    const response = await GET(request, { params: Promise.resolve({ path: ['students'] }) });

    expect((await response.json()).success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('http://backend:8000/api/students/'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token',
          'X-Tenant-ID': 'mock-tenant',
        }),
      })
    );
  });

  it('returns 429 when the rate limit is exceeded', async () => {
    checkRateLimit.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      resetTime: Date.now() + 60000,
    });
    const { GET } = await import('@/app/api/proxy/[...path]/route');
    const request = new NextRequest('http://localhost:3000/api/proxy/students');

    const response = await GET(request, { params: Promise.resolve({ path: ['students'] }) });

    expect(response.status).toBe(429);
    expect((await response.json()).error).toBe('Rate limit exceeded');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
