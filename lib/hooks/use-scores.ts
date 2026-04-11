/**
 * Scores & Attendance Hooks
 * 
 * Score management with optimistic updates, and attendance tracking.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import * as Types from '@/lib/types';
import { queryKeys, fetchAll, fetchPaginated } from './use-data';

export interface ScoreFilters extends Record<string, unknown> {
    session?: string;
    term?: string;
    student?: string;
    class_id?: string;
    include_all_periods?: boolean;
}

// =============================================
// SCORES
// =============================================
export function useScores(filters?: ScoreFilters) {
    return useQuery({
        queryKey: [...queryKeys.scores, filters || {}],
        queryFn: () => fetchAll<Types.Score>('reports/', filters),
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
export interface AttendanceFilters extends Record<string, unknown> {
    class_id?: string;
    date?: string;
    session?: string;
    term?: string;
    include_all_periods?: boolean;
}

export function useAttendance(filters?: AttendanceFilters) {
    return useQuery({
        queryKey: [...queryKeys.attendance, filters],
        queryFn: () => fetchAll<Types.Attendance>('attendance-sessions/', filters),
    });
}

export function usePaginatedAttendance(page = 1, pageSize = 50, filters?: AttendanceFilters) {
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

// =============================================
// BULK SCORE IMPORT
// =============================================
export interface BulkScoreImportData {
    student_id: string;
    subject: string;
    ca1: number;
    ca2: number;
    exam: number;
}

export interface BulkScoreImportPayload {
    session: string;
    term: string;
    mode: 'create' | 'update' | 'upsert';
    data: BulkScoreImportData[];
}

export function useBulkImportScores() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: BulkScoreImportPayload) => {
            const response = await apiClient.post('reports/bulk-import/', payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.scores });
        },
    });
}

export function useBulkImportPreview() {
    return useMutation({
        mutationFn: async (data: BulkScoreImportData[]) => {
            const response = await apiClient.post('reports/bulk-preview/', { data });
            return response.data;
        },
    });
}

// =============================================
// AUTO-SAVE SCORE (DEBOUNCED)
// =============================================
export function useAutoSaveScore() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Score> }) => {
            const response = await apiClient.patch(`/reports/${id}/`, updates);
            return response.data;
        },
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.scores });
            const previousScores = queryClient.getQueryData<Types.Score[]>(queryKeys.scores);

            queryClient.setQueryData<Types.Score[]>(queryKeys.scores, (old) => {
                if (!old) return [];
                return old.map((score) => {
                    if (score.id === id) {
                        return { ...score, ...updates };
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

// =============================================
// SCORE STATISTICS
// =============================================
export interface ScoreStatistics {
    mean: number;
    median: number;
    mode: number | null;
    std_dev: number;
    variance: number;
    pass_rate: number;
    top_score: number;
    lowest_score: number;
    total_students: number;
    grades: Record<string, number>;
}

export function useScoreStatistics(classId: string, subject: string, session: string, term: string) {
    return useQuery({
        queryKey: [...queryKeys.scores, 'stats', classId, subject, session, term],
        queryFn: () => fetchAll<ScoreStatistics>(`reports/statistics/`, { class_id: classId, subject, session, term }),
        enabled: !!classId && !!subject && !!session && !!term,
    });
}
