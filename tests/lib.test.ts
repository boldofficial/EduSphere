import { describe, it, expect } from 'vitest';
import { resolveTenantFromHost } from '@/lib/tenant-host';

describe('tenant-host', () => {
  describe('resolveTenantFromHost', () => {
    it('should return null tenant for localhost', () => {
      const result = resolveTenantFromHost('localhost:3000', 'localhost');
      expect(result.tenantId).toBeNull();
      expect(result.isRootHost).toBe(true);
    });

    it('should extract tenant from subdomain', () => {
      const result = resolveTenantFromHost('meritland.localhost', 'localhost');
      expect(result.tenantId).toBe('meritland');
      expect(result.isRootHost).toBe(false);
    });

    it('should handle production subdomains', () => {
      const result = resolveTenantFromHost('meritland.myregistra.net', 'myregistra.net');
      expect(result.tenantId).toBe('meritland');
    });

    it('accepts a valid custom hostname as the tenant identifier', () => {
      const result = resolveTenantFromHost('evil.example.com', 'myregistra.net');
      expect(result.tenantId).toBe('evil.example.com');
    });

    it('preserves www on custom domains', () => {
      const result = resolveTenantFromHost('www.school.example', 'myregistra.net');
      expect(result.tenantId).toBe('www.school.example');
      expect(result.cleanHost).toBe('www.school.example');
    });
  });
});

describe('calculateGrade', () => {
  it('should return correct grade for score', async () => {
    const { calculateGrade } = await import('@/lib/utils');

    expect(calculateGrade(95)).toEqual({ grade: 'A*', comment: 'Outstanding' });
    expect(calculateGrade(85)).toEqual({ grade: 'A', comment: 'Excellent' });
    expect(calculateGrade(45)).toEqual({ grade: 'E', comment: 'Pass' });
    expect(calculateGrade(30)).toEqual({ grade: 'F', comment: 'Fail' });
  });
});

describe('getRateLimitConfig', () => {
  it('should return correct config for auth endpoints', async () => {
    const { getRateLimitConfig, RATE_LIMITS } = await import('@/lib/rate-limit');

    const config = getRateLimitConfig('/api/auth/login');
    expect(config.limit).toBe(RATE_LIMITS.auth.limit);
  });

  it('keeps the strict limit for expensive work, not for reading report cards', async () => {
    const { getRateLimitConfig, RATE_LIMITS } = await import('@/lib/rate-limit');

    expect(getRateLimitConfig('academic/reports', 'GET').limit).toBe(RATE_LIMITS.read.limit);
    expect(getRateLimitConfig('academic/classes/4/export-broadsheet-pdf', 'GET').limit).toBe(
      RATE_LIMITS.reports.limit
    );
    expect(getRateLimitConfig('academic/reports/9/suggest-remark', 'POST').limit).toBe(
      RATE_LIMITS.reports.limit
    );
  });

  it('counts each category separately and each signed-in user separately', async () => {
    const { checkRateLimit, getClientIdentifier } = await import('@/lib/rate-limit');
    const tight = { name: 'test-tight', limit: 2, window: '60s' };
    const other = { name: 'test-other', limit: 2, window: '60s' };

    expect((await checkRateLimit('user:1', tight)).success).toBe(true);
    expect((await checkRateLimit('user:1', tight)).success).toBe(true);
    expect((await checkRateLimit('user:1', tight)).success).toBe(false);
    expect((await checkRateLimit('user:1', other)).success).toBe(true); // other category unaffected
    expect((await checkRateLimit('user:2', tight)).success).toBe(true); // other user unaffected

    const payload = btoa(JSON.stringify({ user_id: 42 })).replace(/=+$/, '');
    const request = new Request('http://x', { headers: { 'x-forwarded-for': '1.2.3.4' } });
    expect(getClientIdentifier(request, `h.${payload}.s`)).toBe('user:42');
    expect(getClientIdentifier(request)).toBe('ip:1.2.3.4');
  });

  it('should return default config for other endpoints', async () => {
    const { getRateLimitConfig, RATE_LIMITS } = await import('@/lib/rate-limit');

    const config = getRateLimitConfig('/api/academic/students/1');
    expect(config.limit).toBe(RATE_LIMITS.default.limit);
  });
});
