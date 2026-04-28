import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock next/headers
vi.mock('next/headers', () => ({
    cookies: vi.fn().mockResolvedValue({
        get: vi.fn(),
        set: vi.fn(),
    }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn().mockReturnValue({
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
    }),
    usePathname: vi.fn().mockReturnValue('/dashboard'),
}));

// Mock environment variables
Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: true,
});

Object.defineProperty(process.env, 'NEXT_PUBLIC_ROOT_DOMAIN', {
    value: 'localhost',
    writable: true,
});