import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface FeedbackPayload {
  rating: number;
  comment?: string;
  page_url?: string;
  guest_name?: string;
  guest_email?: string;
}

export interface FeedbackItem {
  id: number;
  rating: number;
  comment: string;
  page_url: string;
  user_role: string;
  school_name: string;
  username: string;
  guest_name: string;
  guest_email: string;
  created_at: string;
}

export interface FeedbackStats {
  total: number;
  average_rating: number;
  distribution: Record<string, number>;
}

export interface FeedbackListResponse {
  count: number;
  results: FeedbackItem[];
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
}

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (payload: FeedbackPayload) =>
      apiClient.post('feedback', payload).then((r) => r.data),
  });
}

export function useFeedbackList(params?: { rating?: number; school?: number; page?: number }) {
  return useQuery<FeedbackListResponse>({
    queryKey: ['feedback', 'list', params],
    queryFn: () => apiClient.get('feedback/list', { params }).then((r) => r.data),
  });
}

export function useFeedbackStats() {
  return useQuery<FeedbackStats>({
    queryKey: ['feedback', 'stats'],
    queryFn: () => apiClient.get('feedback/stats').then((r) => r.data),
  });
}
