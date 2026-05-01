import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Mock auth utilities
vi.mock('@/lib/auth-utils', () => ({
    setCookie: vi.fn(),
    COOKIE_NAMES: {
        ACCESS_TOKEN: 'access_token',
        REFRESH_TOKEN: 'refresh_token',
    },
}));

describe('Auth Login Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should handle successful login', async () => {
        // Mock successful response
        const mockResponse = {
            data: {
                access: 'access-token',
                refresh: 'refresh-token',
                user: { id: 1, email: 'admin@school.edu', role: 'SCHOOL_ADMIN' },
            },
            status: 200,
        };
        (axios.post as any).mockResolvedValueOnce(mockResponse);

        const { login } = await import('@/lib/api-client');
        const result = await login('admin@school.edu', 'password123');

        expect(result.access).toBe('access-token');
        expect(axios.post).toHaveBeenCalledWith('/api/auth/login/', {
            email: 'admin@school.edu',
            password: 'password123',
        });
    });

    it('should handle invalid credentials', async () => {
        // Mock 401 error
        const mockError = {
            response: {
                status: 401,
                data: { detail: 'No active account found with the given credentials' },
            },
            isAxiosError: true,
        };
        (axios.post as any).mockRejectedValueOnce(mockError);

        const { login } = await import('@/lib/api-client');
        
        await expect(login('wrong@email.com', 'badpass')).rejects.toMatchObject({
            response: { status: 401 }
        });
    });

    it('should detect 2FA pending status', async () => {
        // Mock 2FA challenge response
        const mockResponse = {
            data: {
                two_factor_pending: true,
                temp_token: 'temp-jwt-token',
            },
            status: 200,
        };
        (axios.post as any).mockResolvedValueOnce(mockResponse);

        const { login } = await import('@/lib/api-client');
        const result = await login('2fa@user.com', 'password');

        expect(result.two_factor_pending).toBe(true);
        expect(result.temp_token).toBe('temp-jwt-token');
    });
});
