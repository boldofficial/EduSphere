/**
 * Scores & Attendance Hooks
 *
 * Score management with optimistic updates, and attendance tracking.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import * as Types from '@/lib/types';
import { queryKeys, fetchAll, fetchPaginated } from './use-data';
import { OFFLINE_SCOPE, localId, offlineKeys, offlineRequests } from '@/lib/offline';

export interface ScoreFilters extends Record<string, unknown> {
  session?: string;
  term?: string;
  student?: string;
  /** Report cards of one class (server-side filter). */
  class?: string;
  include_all_periods?: boolean;
}

// =============================================
// SCORES
// =============================================
export function useScores(filters?: ScoreFilters, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.scores, filters || {}],
    queryFn: () => fetchAll<Types.Score>('academic/reports/', filters),
    enabled,
  });
}

type ListSnapshot<T> = [readonly unknown[], T[] | undefined][];

/** Apply a change to every cached list under `key` (each class / period has its own list). */
function patchLists<T>(
  queryClient: ReturnType<typeof useQueryClient>,
  key: readonly unknown[],
  change: (rows: T[], filters: Record<string, unknown>) => T[]
): ListSnapshot<T> {
  const snapshot = queryClient.getQueriesData<T[]>({ queryKey: key });
  for (const [queryKey, rows] of snapshot) {
    if (!Array.isArray(rows)) continue; // paginated lists keep their own shape; refreshed after sync
    const filters = (queryKey[1] as Record<string, unknown>) || {};
    queryClient.setQueryData<T[]>(queryKey, change(rows, filters));
  }
  return snapshot;
}

function restoreLists<T>(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshot: ListSnapshot<T> | undefined
) {
  for (const [queryKey, rows] of snapshot ?? []) queryClient.setQueryData(queryKey, rows);
}

const sameTermScore = (a: Types.Score, b: Types.Score) =>
  String(a.student_id) === String(b.student_id) && a.session === b.session && a.term === b.term;

/**
 * Save a student's report card for a term (the server creates it or updates the existing one).
 * Works offline: the change shows at once and is sent when the connection returns.
 */
export function useCreateScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: offlineKeys.saveScore,
    mutationFn: offlineRequests.saveScore,
    scope: OFFLINE_SCOPE,
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.scores });
      const snapshot = patchLists<Types.Score>(queryClient, queryKeys.scores, (rows, filters) => {
        if (filters.class && String(filters.class) !== String(item.class_id)) return rows;
        const index = rows.findIndex((row) => sameTermScore(row, item));
        if (index >= 0)
          return rows.map((row, i) => (i === index ? { ...row, ...item, id: row.id } : row));
        return [
          ...rows,
          // Always a local id until the server answers: screens propose their own random ids, and
          // an edit to one of those would otherwise be sent as an update to a record the server
          // has never seen (and lost).
          { ...item, id: localId('score', item.student_id, item.session, item.term) },
        ];
      });
      return { snapshot };
    },
    onError: (_err, _item, context) => restoreLists(queryClient, context?.snapshot),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.scores }),
  });
}

export function useUpdateScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: offlineKeys.updateScore,
    mutationFn: offlineRequests.updateScore,
    scope: OFFLINE_SCOPE,
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.scores });
      const snapshot = patchLists<Types.Score>(queryClient, queryKeys.scores, (rows) =>
        rows.map((row) => (String(row.id) === String(id) ? { ...row, ...updates } : row))
      );
      return { snapshot };
    },
    onError: (_err, _vars, context) => restoreLists(queryClient, context?.snapshot),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.scores }),
  });
}

export function useDeleteScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`academic/scores/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scores });
    },
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
    queryFn: () => fetchAll<Types.Attendance>('academic/attendance-sessions/', filters),
  });
}

export function usePaginatedAttendance(page = 1, pageSize = 50, filters?: AttendanceFilters) {
  return useQuery({
    queryKey: [...queryKeys.attendance, { page, pageSize, ...filters }],
    queryFn: () => fetchPaginated<any>('academic/attendance-sessions/', page, pageSize, filters),
  });
}

const sameRegister = (a: Types.Attendance, b: Types.Attendance) =>
  String(a.class_id) === String(b.class_id) && a.date === b.date;

/** Save a class register for a day (create-or-update on the server). Works offline. */
export function useCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: offlineKeys.saveAttendance,
    mutationFn: offlineRequests.saveAttendance,
    scope: OFFLINE_SCOPE,
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.attendance });
      const snapshot = patchLists<Types.Attendance>(queryClient, queryKeys.attendance, (rows) => {
        const index = rows.findIndex((row) => sameRegister(row, item));
        if (index >= 0)
          return rows.map((row, i) => (i === index ? { ...row, ...item, id: row.id } : row));
        return [...rows, { ...item, id: localId('register', item.class_id, item.date) }]; // see scores
      });
      return { snapshot };
    },
    onError: (_err, _item, context) => restoreLists(queryClient, context?.snapshot),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.attendance }),
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: offlineKeys.updateAttendance,
    mutationFn: offlineRequests.updateAttendance,
    scope: OFFLINE_SCOPE,
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.attendance });
      const snapshot = patchLists<Types.Attendance>(queryClient, queryKeys.attendance, (rows) =>
        rows.map((row) => (String(row.id) === String(id) ? { ...row, ...updates } : row))
      );
      return { snapshot };
    },
    onError: (_err, _vars, context) => restoreLists(queryClient, context?.snapshot),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.attendance }),
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`academic/attendance-sessions/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance });
    },
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
      const response = await apiClient.post('academic/reports/bulk-import/', payload);
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
      const response = await apiClient.post('academic/reports/bulk-preview/', { data });
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
      const response = await apiClient.patch(`academic/reports/${id}/`, updates);
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

export function useScoreStatistics(
  classId: string,
  subject: string,
  session: string,
  term: string
) {
  return useQuery({
    queryKey: [...queryKeys.scores, 'stats', classId, subject, session, term],
    queryFn: () =>
      fetchAll<ScoreStatistics>(`academic/reports/statistics/`, {
        class_id: classId,
        subject,
        session,
        term,
      }),
    enabled: !!classId && !!subject && !!session && !!term,
  });
}
