/**
 * Query Client Configuration
 * 
 * Optimized caching strategy for scalability.
 */

import { QueryClient } from '@tanstack/react-query';

export const defaultQueryOptions = {
    staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache for 30 minutes
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: true, // Refetch when reconnecting
};

export const createQueryClient = () => {
    return new QueryClient({
        defaultOptions: {
            queries: {
                ...defaultQueryOptions,
            },
            mutations: {
                retry: 0, // Don't retry mutations
            },
        },
    });
};

// =============================================
// Query Key Factories
// =============================================

export const queryKeyFactory = {
    students: (filters?: { page?: number; search?: string; classId?: string }) => 
        ['students', filters] as const,
    
    scores: (classId: string, session: string, term: string) => 
        ['scores', classId, session, term] as const,
    
    payments: (filters?: { session?: string; term?: string; status?: string }) =>
        ['payments', filters] as const,
    
    attendance: (classId: string, date: string) =>
        ['attendance', classId, date] as const,
    
    fees: (classId: string, session: string) =>
        ['fees', classId, session] as const,
};

// =============================================
// Prefetch Utilities
// =============================================

export async function prefetchPaginatedList<T>(
    queryClient: QueryClient,
    key: readonly string[],
    fetcher: () => Promise<T[]>,
    pageSize = 20
): Promise<T[]> {
    const data = await queryClient.fetchQuery({
        queryKey: key,
        queryFn: fetcher,
    });
    
    return data;
}

// =============================================
// Optimistic Update Helpers
// =============================================

type Updater<T> = (old: T[]) => T[];

export function optimisticUpdate<T>(
    queryClient: QueryClient,
    queryKey: readonly string[],
    updateFn: Updater<T>
) {
    queryClient.setQueryData<T[]>(queryKey, (old) => {
        if (!old) return [];
        return updateFn(old);
    });
}

export function optimisticAdd<T extends { id: string }>(
    queryClient: QueryClient,
    queryKey: readonly string[],
    newItem: T
) {
    queryClient.setQueryData<T[]>(queryKey, (old) => {
        if (!old) return [newItem];
        return [...old, newItem];
    });
}

export function optimisticRemove<T extends { id: string }>(
    queryClient: QueryClient,
    queryKey: readonly string[],
    itemId: string
) {
    queryClient.setQueryData<T[]>(queryKey, (old) => {
        if (!old) return [];
        return old.filter(item => item.id !== itemId);
    });
}

// =============================================
// Cache Invalidation Rules
// =============================================

export const cacheInvalidationRules = {
    studentCreated: ['students', 'classes', 'fees'],
    scoreUpdated: ['scores', 'analytics'],
    paymentReceived: ['payments', 'fees', 'bursary'],
    attendanceMarked: ['attendance'],
};

// =============================================
// Performance Tracking
// =============================================

export function trackQueryPerformance<T>(
    queryKey: readonly string[],
    queryFn: () => Promise<T>
): () => Promise<T> {
    return async () => {
        const start = performance.now();
        try {
            const result = await queryFn();
            const duration = performance.now() - start;
            
            // Log slow queries
            if (duration > 2000) {
                console.warn(`[QUERY_SLOW] ${queryKey.join(', ')}: ${duration}ms`);
            }
            
            return result;
        } catch (error) {
            const duration = performance.now() - start;
            console.error(`[QUERY_ERROR] ${queryKey.join(',')}: ${duration}ms`, error);
            throw error;
        }
    };
}

// =============================================
// Batch Query Prefetching
// =============================================

interface BatchPrefetchOptions {
    queries: Array<{
        key: readonly string[];
        fetcher: () => Promise<unknown>;
    }>;
    priority?: 'high' | 'normal';
}

export async function batchPrefetch(
    queryClient: QueryClient,
    options: BatchPrefetchOptions
) {
    const { queries, priority = 'normal' } = options;
    
    // Use Promise.allSettled to not fail entire batch if one query fails
    const results = await Promise.allSettled(
        queries.map(q => 
            queryClient.prefetchQuery({
                queryKey: q.key,
                queryFn: q.fetcher,
            })
        )
    );
    
    const failed = results.filter(r => r.status === 'rejected').length;
    
    if (failed > 0) {
        console.warn(`[BATCH_PREFETCH] ${failed}/${queries.length} queries failed`);
    }
    
    return results;
}