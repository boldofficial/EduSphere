/**
 * Scores & Attendance Hooks
 * 
 * Score management with optimistic updates, and attendance tracking.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import * as Types from '@/lib/types';
import { queryKeys, fetchAll, fetchPaginated } from './use-data';

// =============================================
// SCORES
// =============================================
export function useScores() {
    return useQuery({
        queryKey: queryKeys.scores,
        queryFn: () => fetchAll<Types.Score>('reports/'),
    });
}

export function useCreateScore() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Score) => {
            const response = await apiClient.post('reports/', item);
            return response.data;
        },
        onMutate: async (newItem) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.scores });
            const previousScores = queryClient.getQueryData<Types.Score[]>(queryKeys.scores);

            // Optimistically add the new score
            queryClient.setQueryData<Types.Score[]>(queryKeys.scores, (old) => {
                return old ? [...old, newItem] : [newItem];
            });

            return { previousScores };
        },
        onError: (err, newItem, context) => {
            if (context?.previousScores) {
                queryClient.setQueryData(queryKeys.scores, context.previousScores);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.scores });
        },
    });
}

export function useUpdateScore() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Score> }) => {
            const response = await apiClient.patch(`/reports/${id}/`, updates);
            return response.data;
        },
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.scores });
            const previousScores = queryClient.getQueryData<Types.Score[]>(queryKeys.scores);

            // Optimistically update
            queryClient.setQueryData<Types.Score[]>(queryKeys.scores, (old) => {
                if (!old) return [];
                return old.map((score) => {
                    if (score.id === id) {
                        const updatedScore = { ...score, ...updates };
                        return updatedScore;
                    }
                    return score;
                });
            });

            return { previousScores };
        },
        onError: (err, variables, context) => {
            if (context?.previousScores) {
                queryClient.setQueryData(queryKeys.scores, context.previousScores);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.scores });
        },
    });
}

export function useDeleteScore() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`scores/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.scores }); },
    });
}

// =============================================
// ATTENDANCE
// =============================================
export function useAttendance(filters?: { class_id?: string; date?: string }) {
    return useQuery({
        queryKey: [...queryKeys.attendance, filters],
        queryFn: () => fetchAll<Types.Attendance>('attendance-sessions/', filters),
    });
}

export function usePaginatedAttendance(page = 1, pageSize = 50, filters?: { class_id?: string; date?: string }) {
    return useQuery({
        queryKey: [...queryKeys.attendance, { page, pageSize, ...filters }],
        queryFn: () => fetchPaginated<any>('attendance-sessions/', page, pageSize, filters),
    });
}

export function useCreateAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Attendance) => {
            const response = await apiClient.post('attendance-sessions/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.attendance }); },
    });
}

export function useUpdateAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Attendance> }) => {
            const response = await apiClient.patch(`attendance-sessions/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.attendance }); },
    });
}

export function useDeleteAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`attendance-sessions/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.attendance }); },
    });
}
