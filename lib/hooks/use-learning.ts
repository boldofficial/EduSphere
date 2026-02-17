/**
 * Learning Hooks
 * 
 * Assignments, Quizzes, Questions, Submissions.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, fetchAll } from './use-data';
import * as Types from '@/lib/types';
import apiClient from '@/lib/api-client';

// =============================================
// LEARNING
// =============================================
export function useAssignments() {
    return useQuery({
        queryKey: queryKeys.assignments,
        queryFn: () => fetchAll<Types.Assignment>('learning/assignments/'),
    });
}

export function useQuizzes() {
    return useQuery({
        queryKey: queryKeys.quizzes,
        queryFn: () => fetchAll<Types.Quiz>('learning/quizzes/'),
    });
}

export function useQuestions(quizId?: string) {
    return useQuery({
        queryKey: quizId ? ['questions', quizId] : ['questions'],
        queryFn: () => fetchAll<Types.Question>(quizId ? `learning/questions/?quiz_id=${quizId}` : 'learning/questions/'),
    });
}

export function useSubmissions(assignmentId?: string) {
    return useQuery({
        queryKey: assignmentId ? ['submissions', assignmentId] : ['submissions'],
        queryFn: () => fetchAll<Types.Submission>(assignmentId ? `learning/submissions/?assignment_id=${assignmentId}` : 'learning/submissions/'),
    });
}

export function useAttempts(quizId?: string) {
    return useQuery({
        queryKey: quizId ? ['attempts', quizId] : ['attempts'],
        queryFn: () => fetchAll<Types.Attempt>(quizId ? `learning/attempts/?quiz_id=${quizId}` : 'learning/attempts/'),
    });
}

export function useUpdateSubmission() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<Types.Submission> }) => {
            const res = await apiClient.patch(`learning/submissions/${id}/`, data);
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['submissions'] });
            queryClient.invalidateQueries({ queryKey: ['submissions', (variables.data as any).assignment] });
        }
    });
}

export function useAIEvaluateSubmission() {
    return useMutation({
        mutationFn: async (submissionId: string) => {
            const res = await apiClient.post(`learning/submissions/${submissionId}/ai-evaluate/`);
            return res.data;
        }
    });
}

export function useAIGradeQuizTheory() {
    return useMutation({
        mutationFn: async (attemptId: string) => {
            const res = await apiClient.post(`learning/attempts/${attemptId}/ai-grade-theory/`);
            return res.data;
        }
    });
}
