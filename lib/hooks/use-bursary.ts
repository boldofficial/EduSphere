/**
 * Bursary & Finance Hooks
 * 
 * Fees, Payments, Expenses, Financial Stats, Scholarships.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import * as Types from '@/lib/types';
import { queryKeys, fetchAll, fetchPaginated } from './use-data';

// =============================================
// FEES
// =============================================
export function useFees() {
    return useQuery({
        queryKey: queryKeys.fees,
        queryFn: () => fetchAll<Types.FeeStructure>('fees/'),
    });
}

export function useCreateFee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.FeeStructure) => {
            const response = await apiClient.post('fees/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.fees }); },
    });
}

export function useUpdateFee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.FeeStructure> }) => {
            const response = await apiClient.patch(`fees/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.fees }); },
    });
}

export function useDeleteFee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`fees/${id}/`);
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
        queryFn: () => fetchAll<Types.Payment>('payments/'),
    });
}

export function usePaginatedPayments(page = 1, pageSize = 50, studentId = '') {
    return useQuery({
        queryKey: [...queryKeys.payments, { page, pageSize, studentId }],
        queryFn: () => fetchPaginated<Types.Payment>('payments/', page, pageSize, { student: studentId }),
    });
}

export function useCreatePayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Payment) => {
            const response = await apiClient.post('payments/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.payments }); },
    });
}

export function useUpdatePayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Payment> }) => {
            const response = await apiClient.patch(`payments/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.payments }); },
    });
}

export function useDeletePayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`payments/${id}/`);
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
            const response = await apiClient.get('dashboard/financial-stats/', {
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
        queryFn: () => fetchAll<Types.Expense>('expenses/'),
    });
}

export function useCreateExpense() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Expense) => {
            const response = await apiClient.post('expenses/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.expenses }); },
    });
}

export function useUpdateExpense() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Expense> }) => {
            const response = await apiClient.patch(`expenses/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.expenses }); },
    });
}

export function useDeleteExpense() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`expenses/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.expenses }); },
    });
}

// =============================================
// SCHOLARSHIPS
// =============================================
export function useScholarships() {
    return useQuery({
        queryKey: queryKeys.scholarships,
        queryFn: () => fetchAll<Types.Scholarship>('scholarships/'),
    });
}

export function useCreateScholarship() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Scholarship) => {
            const response = await apiClient.post('scholarships/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.scholarships }); },
    });
}

export function useUpdateScholarship() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Scholarship> }) => {
            const response = await apiClient.patch(`scholarships/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.scholarships }); },
    });
}

export function useDeleteScholarship() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`scholarships/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.scholarships }); },
    });
}
