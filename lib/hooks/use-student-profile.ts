import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { Student } from '@/lib/types';

export interface StudentProfile {
  session: string;
  term: string;
  sessions: string[];
  terms: string[];
  academics: {
    average: number;
    total_score: number;
    position: number;
    class_size: number;
    published: boolean;
    trend: string;
    teacher_remark: string;
    head_teacher_remark: string;
    subjects: {
      subject: string;
      ca1: number;
      ca2: number;
      exam: number;
      total: number;
      grade: string;
    }[];
  } | null;
  history: { session: string; term: string; average: number }[];
  attendance: {
    total: number;
    present: number;
    late: number;
    absent: number;
    last: string | null;
    rate: number | null;
  };
  finance: {
    total_bill: number;
    total_paid: number;
    balance: number;
    payments: {
      id: number;
      date: string;
      amount: number;
      method: string;
      status: string;
      reference: string;
    }[];
  };
  conduct: { id: number; trait: string; score: number; remark: string; date: string }[];
  warnings: string[];
}

export function useStudent(id?: string) {
  return useQuery({
    queryKey: ['student', id],
    queryFn: async () => (await apiClient.get<Student>(`academic/students/${id}/`)).data,
    enabled: !!id,
  });
}

/** One student's academics, attendance, fees and conduct for a period (server-computed). */
export function useStudentProfile(id?: string, session?: string, term?: string) {
  return useQuery({
    queryKey: ['student-profile', id, session || '', term || ''],
    queryFn: async () =>
      (
        await apiClient.get<StudentProfile>(`academic/students/${id}/profile/`, {
          params: { session: session || undefined, term: term || undefined },
        })
      ).data,
    enabled: !!id,
    placeholderData: (previous) => previous,
  });
}
