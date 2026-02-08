/**
 * Data Hooks
 * 
 * TanStack Query hooks for fetching data from Django via Next.js Proxy.
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
    me: ['me'] as const,
    scholarships: ['scholarships'] as const,
    assignments: ['assignments'] as const,
    quizzes: ['quizzes'] as const,
    questions: ['questions'] as const,
    submissions: ['submissions'] as const,
    bursaryDashboard: (session: string, term: string) => ['bursary', 'dashboard', session, term] as const,
};

// Generic fetcher
const fetchAll = async <T>(endpoint: string, params?: Record<string, any>): Promise<T[]> => {
    const response = await apiClient.get(endpoint, { params });
    // Handle paginated DRF responses
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
        return response.data.results;
    }
    return Array.isArray(response.data) ? response.data : [];
};

// Paginated fetcher
const fetchPaginated = async <T>(endpoint: string, page = 1, pageSize = 50, extraParams?: Record<string, any>): Promise<Types.PaginatedResponse<T>> => {
    const response = await apiClient.get(endpoint, {
        params: { ...extraParams, page, page_size: pageSize }
    });
    return response.data;
};

// =============================================
// SETTINGS
// =============================================
export function useSettings() {
    return useQuery({
        queryKey: queryKeys.settings,
        queryFn: async () => {
            try {
                const response = await apiClient.get('/settings/');
                return response.data;
            } catch (error) {
                console.warn('Failed to fetch settings, using defaults', error);
                return INITIAL_SETTINGS;
            }
        },
    });
}

export function useUpdateSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (settings: Types.Settings) => {
            const response = await apiClient.put('/settings/', settings);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.settings });
        },
    });
}

export function usePublicStats() {
    return useQuery({
        queryKey: queryKeys.publicStats,
        queryFn: async () => {
            const response = await apiClient.get('/public-stats/');
            return response.data;
        },
    });
}

export function useSystemHealth() {
    return useQuery({
        queryKey: queryKeys.systemHealth,
        queryFn: async () => {
            const response = await apiClient.get('/schools/health/');
            return response.data;
        },
        refetchInterval: 30000, // Refresh every 30s
    });
}

export function useAdminSchools() {
    return useQuery({
        queryKey: queryKeys.adminSchools,
        queryFn: async () => {
            const response = await apiClient.get('/schools/list/');
            return response.data;
        },
    });
}

export function useAdminPlans() {
    return useQuery({
        queryKey: queryKeys.adminPlans,
        queryFn: async () => {
            const response = await apiClient.get('/schools/plans/');
            return response.data;
        },
    });
}

export function useAdminRevenue() {
    return useQuery({
        queryKey: queryKeys.adminRevenue,
        queryFn: async () => {
            const response = await apiClient.get('/schools/revenue/');
            return response.data;
        },
    });
}

export function useStrategicAnalytics() {
    return useQuery({
        queryKey: queryKeys.strategicAnalytics,
        queryFn: async () => {
            const response = await apiClient.get('/schools/analytics/strategic/');
            return response.data;
        },
    });
}

export function usePlatformGovernance() {
    return useQuery({
        queryKey: queryKeys.platformGovernance,
        queryFn: async () => {
            const response = await apiClient.get('/schools/governance/');
            return response.data;
        },
        refetchInterval: 60000, // Refresh activity logs every minute
    });
}

export function usePlatformAnnouncements() {
    return useQuery({
        queryKey: queryKeys.userAnnouncements,
        queryFn: async () => {
            const response = await apiClient.get('/schools/announcements/');
            if (response.data && typeof response.data === 'object' && 'results' in response.data) {
                return response.data.results;
            }
            return Array.isArray(response.data) ? response.data : [];
        },
    });
}

export function useGlobalSearch(query: string) {
    return useQuery({
        queryKey: queryKeys.globalSearch(query),
        queryFn: async () => {
            if (!query) return { schools: [], logs: [] };
            const response = await apiClient.get(`/schools/search/global/?q=${query}`);
            return response.data;
        },
        enabled: query.length >= 2,
    });
}

export function useModules() {
    return useQuery({
        queryKey: queryKeys.modules,
        queryFn: async () => {
            const response = await apiClient.get('/schools/modules/');
            return response.data;
        },
    });
}

export function usePlatformSettings() {
    return useQuery({
        queryKey: queryKeys.platformSettings,
        queryFn: async () => {
            const response = await apiClient.get('/schools/platform-settings/');
            return response.data;
        },
    });
}

export function useUpdatePlatformSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (settings: any) => {
            const response = await apiClient.put('/schools/platform-settings/', settings);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.platformSettings });
        },
    });
}

export function useEmailTemplates() {
    return useQuery({
        queryKey: queryKeys.emailTemplates,
        queryFn: async () => {
            const response = await apiClient.get('/emails/templates/');
            // Handle paginated results
            if (response.data && typeof response.data === 'object' && 'results' in response.data) {
                return response.data.results;
            }
            return Array.isArray(response.data) ? response.data : [];
        },
    });
}

export function useUpdateEmailTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
            const response = await apiClient.patch(`/emails/templates/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates });
        },
    });
}

export function useEmailLogs() {
    return useQuery({
        queryKey: queryKeys.emailLogs,
        queryFn: async () => {
            const response = await apiClient.get('/emails/logs/');
            // Handle paginated results
            if (response.data && typeof response.data === 'object' && 'results' in response.data) {
                return response.data.results;
            }
            return Array.isArray(response.data) ? response.data : [];
        },
        refetchInterval: 10000, // Refresh logs every 10s
    });
}

export function useMe() {
    return useQuery({
        queryKey: queryKeys.me,
        queryFn: async () => {
            const response = await apiClient.get('/users/me/');
            return response.data;
        },
    });
}

// =============================================
export function useClasses(enabled = true) {
    return useQuery({
        queryKey: queryKeys.classes,
        queryFn: () => fetchAll<Types.Class>('/classes/'),
        enabled,
    });
}

export function useCreateClass() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newClass: Types.Class) => {
            const response = await apiClient.post('/classes/', newClass);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.classes });
        },
    });
}

export function useUpdateClass() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Class> }) => {
            const response = await apiClient.patch(`/classes/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.classes });
        },
    });
}

export function useDeleteClass() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/classes/${id}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.classes });
        },
    });
}

// =============================================
export function useStudents(enabled = true) {
    return useQuery({
        queryKey: queryKeys.students,
        queryFn: () => fetchAll<Types.Student>('/students/'),
        enabled,
    });
}

export function usePaginatedStudents(page = 1, pageSize = 50, search = '', classId = '', enabled = true) {
    return useQuery({
        queryKey: [...queryKeys.students, { page, pageSize, search, classId }],
        queryFn: () => fetchPaginated<Types.Student>('/students/', page, pageSize, { search, class: classId }),
        enabled,
    });
}

export function useCreateStudent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (student: Types.Student) => {
            const response = await apiClient.post('/students/', student);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.students });
        },
    });
}

export function useUpdateStudent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Student> }) => {
            const response = await apiClient.patch(`/students/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.students });
        },
    });
}

export function useDeleteStudent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/students/${id}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.students });
        },
    });
}

export function useBulkPromoteStudents() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (promotions: Record<string, string>) => {
            const response = await apiClient.post('/students/bulk-promote/', { promotions });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.students });
        },
    });
}

// =============================================
// LESSONS
// =============================================
export function useLessons() {
    return useQuery({
        queryKey: ['lessons'],
        queryFn: () => fetchAll<any>('/lessons/'),
    });
}

export function useCreateLesson() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (lesson: any) => {
            const response = await apiClient.post('/lessons/', lesson);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lessons'] });
        },
    });
}

// =============================================
// CONDUCT LOG
// =============================================
export function useConductEntries() {
    return useQuery({
        queryKey: ['conduct_entries'],
        queryFn: () => fetchAll<any>('/conduct-entries/'),
    });
}

export function useCreateConductEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (entry: any) => {
            const response = await apiClient.post('/conduct-entries/', entry);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conduct_entries'] });
        },
    });
}

// =============================================
export function useTeachers(enabled = true) {
    return useQuery({
        queryKey: queryKeys.teachers,
        queryFn: () => fetchAll<Types.Teacher>('/teachers/'),
        enabled,
    });
}

export function useCreateTeacher() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (teacher: Types.Teacher) => {
            const response = await apiClient.post('/teachers/', teacher);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.teachers });
        },
    });
}

export function useUpdateTeacher() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Teacher> }) => {
            const response = await apiClient.patch(`/teachers/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.teachers });
        },
    });
}

export function useDeleteTeacher() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/teachers/${id}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.teachers });
        },
    });
}

// =============================================
// STAFF
// =============================================
export function useStaff() {
    return useQuery({
        queryKey: queryKeys.staff,
        queryFn: () => fetchAll<Types.Staff>('/staff/'),
    });
}

export function useCreateStaff() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Staff) => {
            const response = await apiClient.post('/staff/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.staff }); },
    });
}

export function useUpdateStaff() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Staff> }) => {
            const response = await apiClient.patch(`/staff/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.staff }); },
    });
}

export function useDeleteStaff() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/staff/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.staff }); },
    });
}

// =============================================
// SUBJECTS
// =============================================
export function useSubjects() {
    return useQuery({
        queryKey: queryKeys.subjects,
        queryFn: () => fetchAll<Types.Subject>('/subjects/'),
    });
}

export function useCreateSubject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Subject) => {
            const response = await apiClient.post('/subjects/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.subjects }); },
    });
}

// =============================================
// FEES
// =============================================
export function useFees() {
    return useQuery({
        queryKey: queryKeys.fees,
        queryFn: () => fetchAll<Types.FeeStructure>('/fees/'),
    });
}

export function useCreateFee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.FeeStructure) => {
            const response = await apiClient.post('/fees/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.fees }); },
    });
}

export function useUpdateFee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.FeeStructure> }) => {
            const response = await apiClient.patch(`/fees/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.fees }); },
    });
}

export function useDeleteFee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/fees/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.fees }); },
    });
}

// =============================================
// PAYMENTS
// =============================================
export function usePayments() {
    return useQuery({
        queryKey: queryKeys.payments,
        queryFn: () => fetchAll<Types.Payment>('/payments/'),
    });
}

export function usePaginatedPayments(page = 1, pageSize = 50, studentId = '') {
    return useQuery({
        queryKey: [...queryKeys.payments, { page, pageSize, studentId }],
        queryFn: () => fetchPaginated<Types.Payment>('/payments/', page, pageSize, { student: studentId }),
    });
}

export function useCreatePayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Payment) => {
            const response = await apiClient.post('/payments/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.payments }); },
    });
}

export function useUpdatePayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Payment> }) => {
            const response = await apiClient.patch(`/payments/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.payments }); },
    });
}

export function useDeletePayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/payments/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.payments }); },
    });
}

// =============================================
// BURSARY DASHBOARD
// =============================================
export function useFinancialStats(session: string, term: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.bursaryDashboard(session, term),
        queryFn: async () => {
            const response = await apiClient.get('/dashboard/financial-stats/', {
                params: { session, term }
            });
            return response.data as Types.FinancialStats;
        },
        enabled: enabled && !!session && !!term,
    });
}

// =============================================
// EXPENSES
// =============================================
export function useExpenses() {
    return useQuery({
        queryKey: queryKeys.expenses,
        queryFn: () => fetchAll<Types.Expense>('/expenses/'),
    });
}

export function useCreateExpense() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Expense) => {
            const response = await apiClient.post('/expenses/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.expenses }); },
    });
}

export function useUpdateExpense() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Expense> }) => {
            const response = await apiClient.patch(`/expenses/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.expenses }); },
    });
}

export function useDeleteExpense() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/expenses/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.expenses }); },
    });
}

// =============================================
// SCORES
// =============================================
export function useScores() {
    return useQuery({
        queryKey: queryKeys.scores,
        queryFn: () => fetchAll<Types.Score>('/reports/'),
    });
}

export function useCreateScore() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Score) => {
            const response = await apiClient.post('/reports/', item);
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
                        // Merge updates
                        const updatedScore = { ...score, ...updates };

                        // If rows are updated, re-sum the totals locally to show "computed" values instantly
                        if (updates.rows) {
                            // Rows are already computed in the frontend before sending, so we can just use them
                            // But we can double check totals if needed.
                            // The frontend sends the full object usually.
                        }

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
            await apiClient.delete(`/scores/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.scores }); },
    });
}

// =============================================
// ATTENDANCE
// =============================================
export function useAttendance(filters?: { class_id?: string; date?: string }) {
    return useQuery({
        queryKey: [...queryKeys.attendance, filters],
        queryFn: () => fetchAll<Types.Attendance>('/attendance-sessions/', filters),
    });
}

export function usePaginatedAttendance(page = 1, pageSize = 50, filters?: { class_id?: string; date?: string }) {
    return useQuery({
        queryKey: [...queryKeys.attendance, { page, pageSize, ...filters }],
        queryFn: () => fetchPaginated<any>('/attendance-sessions/', page, pageSize, filters),
    });
}

export function useCreateAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Attendance) => {
            const response = await apiClient.post('/attendance-sessions/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.attendance }); },
    });
}

export function useUpdateAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Attendance> }) => {
            const response = await apiClient.patch(`/attendance-sessions/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.attendance }); },
    });
}

export function useDeleteAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/attendance-sessions/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.attendance }); },
    });
}

// =============================================
// ANNOUNCEMENTS
// =============================================
export function useAnnouncements() {
    return useQuery({
        queryKey: queryKeys.announcements,
        queryFn: () => fetchAll<Types.Announcement>('/announcements/'),
    });
}

export function useCreateAnnouncement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Announcement) => {
            const response = await apiClient.post('/announcements/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.announcements }); },
    });
}

export function useUpdateAnnouncement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Announcement> }) => {
            const response = await apiClient.patch(`/announcements/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.announcements }); },
    });
}

export function useDeleteAnnouncement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/announcements/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.announcements }); },
    });
}

// =============================================
// TIMETABLE
// =============================================
export function useTimetables(class_id?: string) {
    return useQuery({
        queryKey: ['timetables', class_id],
        queryFn: () => {
            const url = class_id ? `/timetables/?student_class=${class_id}` : '/timetables/';
            return fetchAll<Types.Timetable>(url);
        },
    });
}

export function useCreateTimetable() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Partial<Types.Timetable>) => {
            const response = await apiClient.post('/timetables/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['timetables'] }); },
    });
}

export function useCreateTimetableEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Partial<Types.TimetableEntry>) => {
            const response = await apiClient.post('/timetable-entries/', item);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['timetables'] });
            queryClient.invalidateQueries({ queryKey: ['timetable_entries'] });
        },
    });
}

// =============================================
// EVENTS
// =============================================
export function useEvents() {
    return useQuery({
        queryKey: queryKeys.events,
        queryFn: () => fetchAll<Types.SchoolEvent>('/events/'),
    });
}

export function useCreateEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.SchoolEvent) => {
            const response = await apiClient.post('/events/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.events }); },
    });
}

export function useUpdateEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.SchoolEvent> }) => {
            const response = await apiClient.patch(`/events/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.events }); },
    });
}

export function useDeleteEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/events/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.events }); },
    });
}

// =============================================
// SUBJECT TEACHERS
// =============================================
export function useSubjectTeachers() {
    return useQuery({
        queryKey: queryKeys.subjectTeachers,
        queryFn: () => fetchAll<Types.SubjectTeacher>('/subject_teachers/'),
    });
}

export function useCreateSubjectTeacher() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.SubjectTeacher) => {
            const response = await apiClient.post('/subject_teachers/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.subjectTeachers }); },
    });
}

export function useDeleteSubjectTeacher() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/subject_teachers/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.subjectTeachers }); },
    });
}

// =============================================
// NEWSLETTERS
// =============================================
export function useNewsletters() {
    return useQuery({
        queryKey: queryKeys.newsletters,
        queryFn: () => fetchAll<Types.Newsletter>('/newsletters/'),
    });
}

export function useCreateNewsletter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Newsletter) => {
            const response = await apiClient.post('/newsletters/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.newsletters }); },
    });
}

export function useUpdateNewsletter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Newsletter> }) => {
            const response = await apiClient.patch(`/newsletters/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.newsletters }); },
    });
}

export function useDeleteNewsletter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/newsletters/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.newsletters }); },
    });
}

// =============================================
// MESSAGES
// =============================================
export function useMessages() {
    return useQuery({
        queryKey: queryKeys.messages,
        queryFn: () => fetchAll<Types.Message>('/messages/'),
    });
}

export function useCreateMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Message) => {
            const response = await apiClient.post('/messages/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.messages }); },
    });
}

export function useUpdateMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Message> }) => {
            const response = await apiClient.patch(`/messages/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.messages }); },
    });
}

export function useDeleteMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/messages/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.messages }); },
    });
}

// =============================================
// SCHOLARSHIPS
// =============================================
export function useScholarships() {
    return useQuery({
        queryKey: queryKeys.scholarships,
        queryFn: () => fetchAll<Types.Scholarship>('/scholarships/'),
    });
}

export function useCreateScholarship() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Scholarship) => {
            const response = await apiClient.post('/scholarships/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.scholarships }); },
    });
}

export function useUpdateScholarship() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Scholarship> }) => {
            const response = await apiClient.patch(`/scholarships/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.scholarships }); },
    });
}

export function useDeleteScholarship() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/scholarships/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.scholarships }); },
    });
}

// =============================================
// LEARNING
// =============================================
export function useAssignments() {
    return useQuery({
        queryKey: queryKeys.assignments,
        queryFn: () => fetchAll<any>('/learning/assignments/'),
    });
}

export function useQuizzes() {
    return useQuery({
        queryKey: queryKeys.quizzes,
        queryFn: () => fetchAll<any>('/learning/quizzes/'),
    });
}

export function useQuestions(quizId?: string) {
    return useQuery({
        queryKey: quizId ? ['questions', quizId] : ['questions'],
        queryFn: () => fetchAll<any>(quizId ? `/learning/questions/?quiz_id=${quizId}` : '/learning/questions/'),
    });
}

export function useSubmissions() {
    return useQuery({
        queryKey: queryKeys.submissions,
        queryFn: () => fetchAll<any>('/learning/submissions/'),
    });
}
