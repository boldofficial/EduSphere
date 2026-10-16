import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { queryKeys } from './use-data';
import type { PaginatedResponse } from '@/lib/types';

export interface TransferPayment {
  id: number;
  student: number;
  student_name: string;
  student_class?: string;
  amount: string | number;
  date: string;
  reference: string;
  method: string;
  status: string;
  remark: string;
  recorded_by: string;
  proof_url?: string | null;
  reviewed_by?: string;
  reviewed_at?: string | null;
  review_note?: string;
  session: string;
  term: string;
}

export interface SubmitTransferInput {
  student: string | number;
  amount: number;
  date?: string;
  narration?: string;
  /** Base64 data URL of the receipt screenshot or photo. */
  proof?: string;
}

const TRANSFERS_KEY = ['transfers'];

/** Bank transfers reported by parents/students. Bursar: status=pending for the review queue. */
export function useTransfers(
  params: { status?: string; student?: string | number } = {},
  enabled = true
) {
  return useQuery({
    queryKey: [...TRANSFERS_KEY, params],
    queryFn: async () =>
      (
        await apiClient.get<PaginatedResponse<TransferPayment>>('bursary/payments/', {
          params: { method: 'transfer', include_all_periods: true, page_size: 50, ...params },
        })
      ).data,
    enabled,
  });
}

function useInvalidatePayments() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: TRANSFERS_KEY });
    queryClient.invalidateQueries({ queryKey: queryKeys.payments });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['student-profile'] });
  };
}

export function useSubmitTransfer() {
  const invalidate = useInvalidatePayments();
  return useMutation({
    mutationFn: async (input: SubmitTransferInput) =>
      (await apiClient.post<TransferPayment>('bursary/payments/submit-transfer/', input)).data,
    onSuccess: invalidate,
  });
}

export function useReviewTransfer() {
  const invalidate = useInvalidatePayments();
  return useMutation({
    mutationFn: async ({
      id,
      decision,
      note,
    }: {
      id: number;
      decision: 'approve' | 'reject';
      note?: string;
    }) =>
      (await apiClient.post<TransferPayment>(`bursary/payments/${id}/${decision}/`, { note })).data,
    onSuccess: invalidate,
  });
}
