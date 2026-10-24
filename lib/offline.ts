/**
 * Offline-friendly score and attendance entry.
 *
 * - Saves made without a connection are paused by TanStack Query, kept on this device (with the
 *   cached data, see components/providers/query-provider.tsx) and sent when the connection returns,
 *   even after the page is closed and reopened. Their request functions are registered here as
 *   mutation defaults so a reloaded page can still send them.
 * - All queued saves share one scope, so they go out one at a time and in order.
 * - The server treats "create" of a report card (student + session + term) and of a register
 *   (class + date) as create-or-update, so replaying a save is always safe.
 */

import type { QueryClient, Query } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import * as Types from '@/lib/types';

export const OFFLINE_SCOPE = { id: 'offline-entry' };

export const offlineKeys = {
  saveScore: ['offline', 'score', 'save'] as const,
  updateScore: ['offline', 'score', 'update'] as const,
  saveAttendance: ['offline', 'attendance', 'save'] as const,
  updateAttendance: ['offline', 'attendance', 'update'] as const,
};

export const offlineRequests = {
  saveScore: async (item: Types.Score) =>
    (await apiClient.post('academic/reports/', stripLocalId(item))).data,
  updateScore: async ({ id, updates }: { id: string; updates: Partial<Types.Score> }) =>
    (await apiClient.patch(`academic/reports/${id}/`, updates)).data,
  saveAttendance: async (item: Types.Attendance) =>
    (await apiClient.post('academic/attendance-sessions/', stripLocalId(item))).data,
  updateAttendance: async ({ id, updates }: { id: string; updates: Partial<Types.Attendance> }) =>
    (await apiClient.patch(`academic/attendance-sessions/${id}/`, updates)).data,
};

/** Records created on this device before the server has them carry a local id. */
export const LOCAL_ID_PREFIX = 'local-';

export function isLocalId(id: unknown) {
  return typeof id === 'string' && id.startsWith(LOCAL_ID_PREFIX);
}

export function localId(...parts: unknown[]) {
  return `${LOCAL_ID_PREFIX}${parts.map(String).join('-')}`;
}

/** Creates never send an id: the server assigns it (and matches the record by student/term or class/day). */
function stripLocalId<T extends { id?: unknown }>(item: T): T {
  const copy = { ...item };
  delete copy.id;
  return copy;
}

export function registerOfflineMutations(queryClient: QueryClient) {
  // Saves queued while offline must reach the server, so keep retrying a little before giving up.
  const shared = { scope: OFFLINE_SCOPE, retry: 3 };
  queryClient.setMutationDefaults(offlineKeys.saveScore, {
    ...shared,
    mutationFn: offlineRequests.saveScore,
  });
  queryClient.setMutationDefaults(offlineKeys.updateScore, {
    ...shared,
    mutationFn: offlineRequests.updateScore,
  });
  queryClient.setMutationDefaults(offlineKeys.saveAttendance, {
    ...shared,
    mutationFn: offlineRequests.saveAttendance,
  });
  queryClient.setMutationDefaults(offlineKeys.updateAttendance, {
    ...shared,
    mutationFn: offlineRequests.updateAttendance,
  });
}

/**
 * What is kept on the device for working offline: the registers and score sheets a teacher has
 * opened, and the class lists and settings they need. Nothing else (no finance, no messages).
 */
const KEEP_OFFLINE = new Set(['classes', 'students', 'scores', 'attendance', 'settings', 'me']);

export function shouldKeepOffline(query: Query) {
  return query.state.status === 'success' && KEEP_OFFLINE.has(String(query.queryKey[0]));
}

/** The device copy belongs to one signed-in user and is discarded for anyone else. */
export const OFFLINE_STORAGE_KEY = 'registra-offline-v1';
export const OFFLINE_OWNER_KEY = 'registra-offline-owner';
export const OFFLINE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function clearOfflineCopy() {
  try {
    window.localStorage.removeItem(OFFLINE_STORAGE_KEY);
  } catch {
    // storage unavailable (private mode): nothing kept anyway
  }
}
