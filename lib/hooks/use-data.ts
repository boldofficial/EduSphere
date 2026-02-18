/**
 * Data Hooks — Barrel Re-export
 * 
 * TanStack Query hooks for fetching data from Django via Next.js Proxy.
 * 
 * This file exports shared utilities (queryKeys, fetchAll, fetchPaginated)
 * and re-exports all domain-specific hooks so existing imports continue to work.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import * as Types from '@/lib/types';
import { INITIAL_SETTINGS } from '@/lib/utils';

// =============================================
// QUERY KEYS
// =============================================
export const queryKeys = {
    settings: ['settings'] as const,
    classes: ['classes'] as const,
    students: ['students'] as const,
    teachers: ['teachers'] as const,
    staff: ['staff'] as const,
    fees: ['fees'] as const,
    payments: ['payments'] as const,
    expenses: ['expenses'] as const,
    scores: ['scores'] as const,
    attendance: ['attendance'] as const,
    announcements: ['announcements'] as const,
    events: ['events'] as const,
    subjects: ['subjects'] as const,
    subjectTeachers: ['subject_teachers'] as const,
    newsletters: ['newsletters'] as const,
    messages: ['messages'] as const,
    publicStats: ['public_stats'] as const,
    systemHealth: ['system_health'] as const,
    adminSchools: ['admin_schools'] as const,
    adminPlans: ['admin_plans'] as const,
    adminRevenue: ['admin_revenue'] as const,
    strategicAnalytics: ['strategic_analytics'] as const,
    platformGovernance: ['platform_governance'] as const,
    userAnnouncements: ['user_announcements'] as const,
    globalSearch: (query: string) => ['global_search', query] as const,
    modules: ['modules'] as const,
    platformSettings: ['platform_settings'] as const,
    emailTemplates: ['email_templates'] as const,
    emailLogs: ['email_logs'] as const,
    supportTickets: ['support_tickets'] as const,
    me: ['me'] as const,
    scholarships: ['scholarships'] as const,
    assignments: ['assignments'] as const,
    quizzes: ['quizzes'] as const,
    questions: ['questions'] as const,
    submissions: ['submissions'] as const,
    bursaryDashboard: (session: string, term: string) => ['bursary', 'dashboard', session, term] as const,
};

// Generic fetcher
export const fetchAll = async <T>(endpoint: string, params?: Record<string, any>): Promise<T[]> => {
    const response = await apiClient.get(endpoint, { params });
    // Handle paginated DRF responses
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
        return response.data.results;
    }
    return Array.isArray(response.data) ? response.data : [];
};

// Paginated fetcher
export const fetchPaginated = async <T>(endpoint: string, page = 1, pageSize = 50, extraParams?: Record<string, any>): Promise<Types.PaginatedResponse<T>> => {
    const response = await apiClient.get(endpoint, {
        params: { ...extraParams, page, page_size: pageSize }
    });
    return response.data;
};

// =============================================
// RE-EXPORTS: All domain hooks
// =============================================
export {
    useSettings, useUpdateSettings, usePublicStats, useMe,
    useSystemHealth, useAdminSchools, useAdminPlans, useAdminRevenue,
    useStrategicAnalytics, usePlatformGovernance, usePlatformAnnouncements,
    useGlobalSearch, useModules, usePlatformSettings, useUpdatePlatformSettings,
    useEmailTemplates, useUpdateEmailTemplate, useEmailLogs,
    useSupportTickets, useCreateSupportTicket, useRespondToTicket, useResolveTicket
} from './use-admin';

export {
    useClasses, useCreateClass, useUpdateClass, useDeleteClass,
    useStudents, usePaginatedStudents, useCreateStudent, useUpdateStudent, useDeleteStudent,
    useBulkPromoteStudents, useAutoPromoteStudents,
    useStudentHistory, useStudentAchievements,
    useLessons, useCreateLesson,
    useConductEntries, useCreateConductEntry,
    useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher,
    useStaff, useCreateStaff, useUpdateStaff, useDeleteStaff,
    useSubjects, useCreateSubject,
    useSubjectTeachers, useCreateSubjectTeacher, useDeleteSubjectTeacher,
} from './use-academic';

export {
    useFees, useCreateFee, useUpdateFee, useDeleteFee,
    usePayments, usePaginatedPayments, useCreatePayment, useUpdatePayment, useDeletePayment,
    useFinancialStats,
    useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense,
    useScholarships, useCreateScholarship, useUpdateScholarship, useDeleteScholarship,
} from './use-bursary';

export {
    useScores, useCreateScore, useUpdateScore, useDeleteScore,
    useAttendance, usePaginatedAttendance, useCreateAttendance, useUpdateAttendance, useDeleteAttendance,
} from './use-scores';

export {
    useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement,
    useTimetables, useCreateTimetable, useCreateTimetableEntry,
    useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent,
    useNewsletters, useCreateNewsletter, useUpdateNewsletter, useDeleteNewsletter,
    useMessages, useCreateMessage, useUpdateMessage, useDeleteMessage,
} from './use-communication';

export {
    useAssignments, useQuizzes, useQuestions, useSubmissions,
} from './use-learning';

export {
    useSalaryAllowances, useCreateAllowance,
    useSalaryDeductions, useCreateDeduction,
    useStaffSalaryStructure, useUpdateSalaryStructure,
    usePayrolls, useGeneratePayroll, useApprovePayroll, useMarkPayrollPaid,
} from './use-payroll';
