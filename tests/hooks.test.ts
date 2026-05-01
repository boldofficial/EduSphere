import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Create a wrapper for React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

// Mock api client
vi.mock('@/lib/api-client', () => ({
    apiClient: {
        get: vi.fn(),
    },
}));

describe('usePaginatedStudents Hook', () => {
    beforeEach(() => {
        queryClient.clear();
        vi.clearAllMocks();
    });

    it('should fetch paginated students', async () => {
        const { apiClient } = await import('@/lib/api-client');
        const mockData = {
            results: [{ id: 1, names: 'John Doe' }],
            count: 1,
            next: null,
            previous: null,
        };
        (apiClient.get as any).mockResolvedValueOnce({ data: mockData });

        const { usePaginatedStudents } = await import('@/lib/hooks/use-academic');
        const { result } = renderHook(() => usePaginatedStudents(1, 10), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data?.results).toEqual(mockData.results);
        expect(apiClient.get).toHaveBeenCalledWith('/api/proxy/students/?page=1&page_size=10&search=&class_id=');
    });

    it('should handle search filters', async () => {
        const { apiClient } = await import('@/lib/api-client');
        (apiClient.get as any).mockResolvedValueOnce({ data: { results: [], count: 0 } });

        const { usePaginatedStudents } = await import('@/lib/hooks/use-academic');
        renderHook(() => usePaginatedStudents(1, 10, 'search-term'), { wrapper });

        expect(apiClient.get).toHaveBeenCalledWith('/api/proxy/students/?page=1&page_size=10&search=search-term&class_id=');
    });
});
