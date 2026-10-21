import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '@/lib/api-client';
import { useStaff, useTeachers } from '@/lib/hooks/use-academic';

vi.mock('@/lib/api-client', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedGet = vi.mocked(apiClient.get);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('academic profile-list hooks', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('does not request staff or teachers when their queries are disabled', () => {
    renderHook(() => ({ staff: useStaff(false), teachers: useTeachers(false) }), {
      wrapper: createWrapper(),
    });

    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('loads a role list when its query is enabled', async () => {
    mockedGet.mockResolvedValue({ data: { results: [], next: null } });

    const { result } = renderHook(() => useStaff(true), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedGet).toHaveBeenCalledWith('academic/staff/', {
      params: { page: 1, page_size: 200 },
    });
  });
});
