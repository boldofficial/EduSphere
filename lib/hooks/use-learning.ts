/**
 * Learning Hooks
 * 
 * Assignments, Quizzes, Questions, Submissions.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys, fetchAll } from './use-data';

// =============================================
// LEARNING
// =============================================
export function useAssignments() {
    return useQuery({
        queryKey: queryKeys.assignments,
        queryFn: () => fetchAll<any>('learning/assignments/'),
    });
}

export function useQuizzes() {
    return useQuery({
        queryKey: queryKeys.quizzes,
        queryFn: () => fetchAll<any>('learning/quizzes/'),
    });
}

export function useQuestions(quizId?: string) {
    return useQuery({
        queryKey: quizId ? ['questions', quizId] : ['questions'],
        queryFn: () => fetchAll<any>(quizId ? `learning/questions/?quiz_id=${quizId}` : 'learning/questions/'),
    });
}

export function useSubmissions() {
    return useQuery({
        queryKey: queryKeys.submissions,
        queryFn: () => fetchAll<any>('learning/submissions/'),
    });
}
