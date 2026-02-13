/**
 * Academic Hooks
 * 
 * Classes, Students, Teachers, Staff, Subjects, SubjectTeachers, Lessons, Conduct.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import * as Types from '@/lib/types';
import { queryKeys, fetchAll, fetchPaginated } from './use-data';

// =============================================
// CLASSES
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
            const response = await apiClient.patch(`classes/${id}/`, updates);
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
            await apiClient.delete(`classes/${id}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.classes });
        },
    });
}

// =============================================
// STUDENTS
// =============================================
export function useStudents(enabled = true) {
    return useQuery({
        queryKey: queryKeys.students,
        queryFn: () => fetchAll<Types.Student>('students/'),
        enabled,
    });
}

export function usePaginatedStudents(page = 1, pageSize = 50, search = '', classId = '', enabled = true) {
    return useQuery({
        queryKey: [...queryKeys.students, { page, pageSize, search, classId }],
        queryFn: () => fetchPaginated<Types.Student>('students/', page, pageSize, { search, class: classId }),
        enabled,
    });
}

export function useCreateStudent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (student: Types.Student) => {
            const response = await apiClient.post('students/', student);
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
            const response = await apiClient.patch(`students/${id}/`, updates);
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
            await apiClient.delete(`students/${id}/`);
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
            const response = await apiClient.post('students/bulk-promote/', { promotions });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.students });
        },
    });
}

export function useAutoPromoteStudents() {
    return useMutation({
        mutationFn: async (data: { session: string; term: string }) => {
            const response = await apiClient.post('students/trigger-auto-promotion/', data);
            return response.data;
        },
    });
}

// =============================================
// STUDENT HISTORY & ACHIEVEMENTS
// =============================================
export function useStudentHistory(studentId?: string) {
    return useQuery({
        queryKey: ['student_history', studentId],
        queryFn: () => fetchAll<any>('students/history/', { student: studentId }),
        enabled: !!studentId,
    });
}

export function useStudentAchievements(studentId?: string) {
    return useQuery({
        queryKey: ['student_achievements', studentId],
        queryFn: () => fetchAll<any>('students/achievements/', { student: studentId }),
        enabled: !!studentId,
    });
}

// =============================================
// LESSONS
// =============================================
export function useLessons() {
    return useQuery({
        queryKey: ['lessons'],
        queryFn: () => fetchAll<any>('lessons/'),
    });
}

export function useCreateLesson() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (lesson: any) => {
            const response = await apiClient.post('lessons/', lesson);
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
        queryFn: () => fetchAll<any>('conduct-entries/'),
    });
}

export function useCreateConductEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (entry: any) => {
            const response = await apiClient.post('conduct-entries/', entry);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conduct_entries'] });
        },
    });
}

// =============================================
// TEACHERS
// =============================================
export function useTeachers(enabled = true) {
    return useQuery({
        queryKey: queryKeys.teachers,
        queryFn: () => fetchAll<Types.Teacher>('teachers/'),
        enabled,
    });
}

export function useCreateTeacher() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (teacher: Types.Teacher) => {
            const response = await apiClient.post('teachers/', teacher);
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
            const response = await apiClient.patch(`teachers/${id}/`, updates);
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
            await apiClient.delete(`teachers/${id}/`);
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
        queryFn: () => fetchAll<Types.Staff>('staff/'),
    });
}

export function useCreateStaff() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Staff) => {
            const response = await apiClient.post('staff/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.staff }); },
    });
}

export function useUpdateStaff() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Staff> }) => {
            const response = await apiClient.patch(`staff/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.staff }); },
    });
}

export function useDeleteStaff() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`staff/${id}/`);
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
        queryFn: () => fetchAll<Types.Subject>('subjects/'),
    });
}

export function useCreateSubject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Subject) => {
            const response = await apiClient.post('subjects/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.subjects }); },
    });
}

// =============================================
// SUBJECT TEACHERS
// =============================================
export function useSubjectTeachers() {
    return useQuery({
        queryKey: queryKeys.subjectTeachers,
        queryFn: () => fetchAll<Types.SubjectTeacher>('subject_teachers/'),
    });
}

export function useCreateSubjectTeacher() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.SubjectTeacher) => {
            const response = await apiClient.post('subject_teachers/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.subjectTeachers }); },
    });
}

export function useDeleteSubjectTeacher() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`subject_teachers/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.subjectTeachers }); },
    });
}

// =============================================
// GLOBAL SEARCH
// =============================================
export function useAcademicGlobalSearch(query: string, enabled = false) {
    return useQuery({
        queryKey: ['academic_global_search', query],
        queryFn: async () => {
            const response = await apiClient.get('/global-search/', { params: { q: query } });
            return response.data;
        },
        enabled: enabled && query.length >= 2,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
