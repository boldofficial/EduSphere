import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface CalendarTerm {
  id: number;
  name: string;
  order: number;
  start_date: string | null;
  end_date: string | null;
  mid_term_start: string | null;
  mid_term_end: string | null;
  status: 'upcoming' | 'active' | 'closed';
  closed_at: string | null;
  school_days: number | null;
}

export interface CalendarSession {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: 'upcoming' | 'active' | 'closed';
  terms: CalendarTerm[];
}

export interface CurrentTerm {
  id: number;
  session: string;
  term: string;
  start_date: string | null;
  end_date: string | null;
  week: number | null;
  weeks: number | null;
  school_days: number | null;
  days_left: number | null;
}

export const calendarKey = ['academic-calendar'] as const;

/** Sessions, their terms and dates, and the current term (academic/calendar/). */
export function useAcademicCalendar(enabled = true) {
  return useQuery({
    queryKey: calendarKey,
    queryFn: async () =>
      (await apiClient.get('academic/calendar/')).data as {
        current: CurrentTerm | null;
        sessions: CalendarSession[];
      },
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
