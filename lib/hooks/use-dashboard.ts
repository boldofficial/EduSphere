import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface AdminDashboardSummary {
  session: string;
  term: string;
  counts: { students: number; teachers: number; staff: number; classes: number };
  finance: {
    expected: number;
    collected: number;
    outstanding: number;
    expenses: number;
    collection_rate: number | null;
  };
  attendance_today: {
    records: number;
    present: number;
    rate: number | null;
    classes_marked: number;
  };
  action_items: {
    pending_admissions: number;
    payments_to_verify: number;
    low_stock_items: number;
  };
  recent_payments: {
    id: number;
    student_name: string;
    amount: number;
    date: string;
    method: string;
    status: string;
  }[];
  upcoming_events: { id: number; title: string; start_date: string; event_type: string }[];
}

/** One request with every admin dashboard number, computed server-side for the current term. */
export function useAdminDashboard(enabled = true) {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await apiClient.get<AdminDashboardSummary>('academic/dashboard/')).data,
    enabled,
    staleTime: 60_000,
  });
}
