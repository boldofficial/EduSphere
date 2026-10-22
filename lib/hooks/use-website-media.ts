import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { WebsiteMediaItem } from '@/lib/types';
import { queryKeys } from './use-data';

const MEDIA_KEY = ['website-media'] as const;
const ENDPOINT = 'schools/website-media/';

export interface WebsiteMediaLibrary {
  results: WebsiteMediaItem[];
  usage: { used_bytes: number; quota_bytes: number };
}

export interface UploadResult {
  results: WebsiteMediaItem[];
  errors: { file: string; error: string }[];
  detail?: string;
}

/** The school's website media library (admins). */
export function useWebsiteMedia(enabled = true) {
  return useQuery({
    queryKey: MEDIA_KEY,
    queryFn: async () => (await apiClient.get<WebsiteMediaLibrary>(ENDPOINT)).data,
    enabled,
  });
}

function useRefreshMedia() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: MEDIA_KEY });
    queryClient.invalidateQueries({ queryKey: queryKeys.publicSettings });
  };
}

/** Upload images. Sent as multipart via fetch so the browser sets the form boundary. */
export function useUploadWebsiteMedia() {
  const refresh = useRefreshMedia();
  return useMutation({
    mutationFn: async ({
      files,
      album,
      showInGallery,
    }: {
      files: File[];
      album: string;
      showInGallery: boolean;
    }): Promise<UploadResult> => {
      const form = new FormData();
      files.forEach((file) => form.append('files', file));
      form.append('album', album);
      form.append('show_in_gallery', String(showInGallery));
      const response = await fetch(`/api/proxy/${ENDPOINT}`, { method: 'POST', body: form });
      const body = (await response.json().catch(() => ({}))) as UploadResult;
      if (!response.ok) {
        throw new Error(
          body.detail || body.errors?.[0]?.error || 'Upload failed. Please try again.'
        );
      }
      return body;
    },
    onSuccess: refresh,
  });
}

export function useUpdateWebsiteMedia() {
  const refresh = useRefreshMedia();
  return useMutation({
    mutationFn: async ({ id, changes }: { id: number; changes: Partial<WebsiteMediaItem> }) =>
      (await apiClient.patch<WebsiteMediaItem>(`${ENDPOINT}${id}/`, changes)).data,
    onSuccess: refresh,
  });
}

export function useDeleteWebsiteMedia() {
  const refresh = useRefreshMedia();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`${ENDPOINT}${id}/`);
    },
    onSuccess: refresh,
  });
}

export function useReorderWebsiteMedia() {
  const queryClient = useQueryClient();
  const refresh = useRefreshMedia();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      await apiClient.post(`${ENDPOINT}reorder/`, { ids });
    },
    // Move cards immediately; the server confirms the order.
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: MEDIA_KEY });
      const previous = queryClient.getQueryData<WebsiteMediaLibrary>(MEDIA_KEY);
      if (previous) {
        const byId = new Map(previous.results.map((m) => [m.id, m]));
        const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as WebsiteMediaItem[];
        queryClient.setQueryData(MEDIA_KEY, { ...previous, results: ordered });
      }
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(MEDIA_KEY, context.previous);
    },
    onSettled: refresh,
  });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
