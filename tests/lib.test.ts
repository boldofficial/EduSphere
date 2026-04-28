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

        it('should reject invalid tenant IDs', () => {
            const result = resolveTenantFromHost('evil.example.com', 'myregistra.net');
            expect(result.tenantId).toBeNull();
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

    it('should return default config for other endpoints', async () => {
        const { getRateLimitConfig, RATE_LIMITS } = await import('@/lib/rate-limit');
        
        const config = getRateLimitConfig('/api/students');
        expect(config.limit).toBe(RATE_LIMITS.default.limit);
    });
});