import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('next/headers', () => ({
    cookies: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'mock-token' }),
    }),
}));

vi.mock('@/lib/tenant-host', () => ({
    resolveTenantFromHost: vi.fn().mockReturnValue({ tenantId: 'mock-tenant' }),
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('Proxy Route Handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.DJANGO_API_URL = 'http://backend:8000';
    });

    it('should forward GET requests to Django', async () => {
        const { GET } = await import('@/app/api/proxy/[...path]/route');
        
        const request = new NextRequest('http://localhost:3000/api/proxy/students', {
            method: 'GET',
            headers: { 'host': 'localhost:3000' }
        });

        const mockResponse = {
            ok: true,
            status: 200,
            text: vi.fn().mockResolvedValue(JSON.stringify({ success: true })),
            headers: new Headers({ 'Content-Type': 'application/json' }),
        };
        (global.fetch as any).mockResolvedValueOnce(mockResponse);

        const response = await GET(request, { params: Promise.resolve({ path: ['students'] }) });
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('http://backend:8000/api/students/'),
            expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({
                    'Authorization': 'Bearer mock-token',
                    'X-Tenant-ID': 'mock-tenant',
                }),
            })
        );
    });

    it('should handle rate limiting', async () => {
        // Mock rate limit failure
        vi.mock('@/lib/rate-limit', async (importOriginal) => {
            const actual = await importOriginal() as any;
            return {
                ...actual,
                checkRateLimit: vi.fn().mockResolvedValue({ success: false, resetTime: Date.now() + 60000 }),
            };
        });

        const { GET } = await import('@/app/api/proxy/[...path]/route');
        const request = new NextRequest('http://localhost:3000/api/proxy/students');

        const response = await GET(request, { params: Promise.resolve({ path: ['students'] }) });
        
        expect(response.status).toBe(429);
        const data = await response.json();
        expect(data.error).toBe('Rate limit exceeded');
    });
});
