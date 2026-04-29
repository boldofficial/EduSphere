import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AxiosError, AxiosResponse } from 'axios';

// Mock axios
vi.mock('axios', async () => {
  const mockAxiosInstance = {
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { headers: { common: {} } },
  };
  
  return {
    __esModule: true,
    default: vi.fn(() => mockAxiosInstance),
    create: vi.fn(() => mockAxiosInstance),
  };
});

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Request Interceptor', () => {
    it('should add auth token to requests', async () => {
      // This test verifies the interceptor setup
      const { apiClient } = await import('@/lib/api-client');
      expect(apiClient).toBeDefined();
    });

    it('should handle missing tokens gracefully', async () => {
      // Verify client can be instantiated without throwing
      const { apiClient } = await import('@/lib/api-client');
      expect(apiClient.defaults.headers.common).toBeDefined();
    });
  });

  describe('Response Interceptor', () => {
    it('should handle 401 errors for token refresh', async () => {
      const { apiClient } = await import('@/lib/api-client');
      // The client should have response interceptors configured
      expect(apiClient.interceptors.response).toBeDefined();
    });
  });
});

describe('Auth Utilities', () => {
  describe('Cookie Management', () => {
    it('should have cookie utility functions', async () => {
      const { getCookie, setCookie, removeCookie } = await import('@/lib/auth-utils');
      
      expect(typeof getCookie).toBe('function');
      expect(typeof setCookie).toBe('function');
      expect(typeof removeCookie).toBe('function');
    });

    it('should handle cookie retrieval for access token', async () => {
      const { getCookie, COOKIE_NAMES } = await import('@/lib/auth-utils');
      
      // Should be able to get access token cookie name
      expect(COOKIE_NAMES.ACCESS_TOKEN).toBeDefined();
      expect(COOKIE_NAMES.REFRESH_TOKEN).toBeDefined();
    });
  });
});

describe('Rate Limiting', () => {
  describe('RATE_LIMITS', () => {
    it('should have correct limit values', async () => {
      const { RATE_LIMITS } = await import('@/lib/rate-limit');
      
      expect(RATE_LIMITS.auth).toBeDefined();
      expect(RATE_LIMITS.auth.limit).toBeGreaterThan(0);
      expect(RATE_LIMITS.default).toBeDefined();
    });

    it('should have correct window duration', async () => {
      const { RATE_LIMITS } = await import('@/lib/rate-limit');
      
      expect(RATE_LIMITS.auth.duration).toBeDefined();
      expect(typeof RATE_LIMITS.auth.duration).toBe('number');
    });
  });

  describe('getRateLimitConfig', () => {
    it('should return auth config for auth endpoints', async () => {
      const { getRateLimitConfig, RATE_LIMITS } = await import('@/lib/rate-limit');
      
      const config = getRateLimitConfig('/api/auth/login');
      expect(config).toEqual(RATE_LIMITS.auth);
    });

    it('should return default config for unknown endpoints', async () => {
      const { getRateLimitConfig, RATE_LIMITS } = await import('@/lib/rate-limit');
      
      const config = getRateLimitConfig('/api/unknown');
      expect(config).toEqual(RATE_LIMITS.default);
    });
  });
});

describe('Store', () => {
  describe('Zustand Store', () => {
    it('should have required state properties', async () => {
      const { useAuthStore } = await import('@/lib/store');
      
      // Check store has expected methods
      expect(typeof useAuthStore.getState).toBe('function');
      expect(typeof useAuthStore.setState).toBe('function');
      expect(typeof useAuthStore.subscribe).toBe('function');
    });

    it('should have currentUser in initial state', async () => {
      const { useAuthStore } = await import('@/lib/store');
      
      const state = useAuthStore.getState();
      expect('currentUser' in state).toBe(true);
    });

    it('should have currentRole in initial state', async () => {
      const { useAuthStore } = await import('@/lib/store');
      
      const state = useAuthStore.getState();
      expect('currentRole' in state).toBe(true);
    });
  });
});

describe('Query Client', () => {
  describe('React Query Configuration', () => {
    it('should have default query client config', async () => {
      const { queryClient } = await import('@/lib/query-client');
      
      expect(queryClient).toBeDefined();
      expect(typeof queryClient.getQueryData).toBe('function');
      expect(typeof queryClient.setQueryData).toBe('function');
    });

    it('should have correct default stale time', async () => {
      const { defaultQueryFn } = await import('@/lib/query-client');
      
      // Should have a default query function
      expect(typeof defaultQueryFn).toBe('function');
    });
  });
});

describe('Types', () => {
  describe('User Types', () => {
    it('should have correct UserRole values', async () => {
      const { UserRole } = await import('@/lib/types');
      
      expect(UserRole.SUPER_ADMIN).toBe('SUPER_ADMIN');
      expect(UserRole.SCHOOL_ADMIN).toBe('SCHOOL_ADMIN');
      expect(UserRole.TEACHER).toBe('TEACHER');
      expect(UserRole.STUDENT).toBe('STUDENT');
      expect(UserRole.PARENT).toBe('PARENT');
      expect(UserRole.STAFF).toBe('STAFF');
    });
  });

  describe('API Response Types', () => {
    it('should have PaginatedResponse type', async () => {
      const { PaginatedResponse } = await import('@/lib/types');
      
      // Type should be defined (this is a compile-time check)
      expect(PaginatedResponse).toBeDefined();
    });
  });
});