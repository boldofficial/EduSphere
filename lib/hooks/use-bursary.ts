/**
 * Bursary & Finance Hooks
 * 
 * Fees, Payments, Expenses, Financial Stats, Scholarships.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import * as Types from '@/lib/types';
import { queryKeys, fetchAll, fetchPaginated } from './use-data';

type PaymentApiResponse = Partial<Types.Payment> & {
    id?: string | number;
    student?: string | number;
    student_id?: string | number;
    method?: string;
    line_items?: Types.PaymentLineItem[];
    lineItems?: Types.PaymentLineItem[];
};

type PaymentPayload = Partial<Types.Payment> & {
    student?: string | number;
    method?: string;
    items_input?: Types.PaymentLineItem[];
};

const normalizePayment = (payment: PaymentApiResponse): Types.Payment => {
    const method = payment?.method === 'online' ? 'online' : payment?.method || 'cash';
    const lineItems = payment?.lineItems || payment?.line_items || [];
    return {
        ...payment,
        id: String(payment?.id ?? ''),
        student_id: String(payment?.student_id ?? payment?.student ?? ''),
        amount: Number(payment?.amount ?? 0),
        date: String(payment?.date ?? ''),
        method,
        lineItems,
        session: String(payment?.session ?? ''),
        term: String(payment?.term ?? ''),
        created_at: payment?.created_at ?? '',
        updated_at: payment?.updated_at ?? '',
    };
};

const toBackendPaymentPayload = (item: PaymentPayload) => {
    const methodMap: Record<string, string> = {
        cash: 'cash',
        transfer: 'transfer',
        bank_transfer: 'transfer',
        pos: 'pos',
        online: 'online',
        paystack: 'online',
        flutterwave: 'online',
    };
    const methodKey = typeof item?.method === 'string' ? item.method : 'cash';
    const resolvedMethod = methodMap[methodKey] || 'cash';

    return {
        student: item?.student ?? item?.student_id,
        amount: item?.amount,
        date: item?.date,
        method: resolvedMethod,
        remark: item?.remark,
        session: item?.session,
        term: item?.term,
        status: item?.status,
        items_input: item?.items_input || item?.lineItems || [],
    };
};

// =============================================
// FEES
// =============================================
export function useFees() {
    return useQuery({
        queryKey: queryKeys.fees,
        queryFn: () => fetchAll<Types.FeeStructure>('bursary/fees/'),
    });
}

export function useCreateFee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.FeeStructure) => {
            const response = await apiClient.post('bursary/fees/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.fees }); },
    });
}

export function useUpdateFee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.FeeStructure> }) => {
            const response = await apiClient.patch(`bursary/fees/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.fees }); },
    });
}

export function useDeleteFee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`bursary/fees/${id}/`);
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
        queryFn: async () => {
            const rows = await fetchAll<PaymentApiResponse>('bursary/payments/');
            return rows.map(normalizePayment);
        },
    });
}

export function usePaginatedPayments(page = 1, pageSize = 50, studentId = '') {
    return useQuery({
        queryKey: [...queryKeys.payments, { page, pageSize, studentId }],
        queryFn: async () => {
            const response = await fetchPaginated<PaymentApiResponse>('bursary/payments/', page, pageSize, { student: studentId });
            return {
                ...response,
                results: (response?.results || []).map(normalizePayment),
            };
        },
    });
}

export function useCreatePayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: PaymentPayload) => {
            const payload = toBackendPaymentPayload(item);
            const response = await apiClient.post('bursary/payments/', payload);
            return normalizePayment(response.data);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.payments }); },
    });
}

export function useUpdatePayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: PaymentPayload }) => {
            const payload = toBackendPaymentPayload(updates);
            const response = await apiClient.patch(`bursary/payments/${id}/`, payload);
            return normalizePayment(response.data);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.payments }); },
    });
}

export function useDeletePayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`bursary/payments/${id}/`);
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
            const response = await apiClient.get('bursary/dashboard/financial-stats/', {
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
        queryFn: () => fetchAll<Types.Expense>('bursary/expenses/'),
    });
}

export function useCreateExpense() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Expense) => {
            const response = await apiClient.post('bursary/expenses/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.expenses }); },
    });
}

export function useUpdateExpense() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Expense> }) => {
            const response = await apiClient.patch(`bursary/expenses/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.expenses }); },
    });
}

export function useDeleteExpense() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`bursary/expenses/${id}/`);
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
        queryFn: () => fetchAll<Types.Scholarship>('bursary/scholarships/'),
    });
}

export function useCreateScholarship() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Scholarship) => {
            const response = await apiClient.post('bursary/scholarships/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.scholarships }); },
    });
}

export function useUpdateScholarship() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Scholarship> }) => {
            const response = await apiClient.patch(`bursary/scholarships/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.scholarships }); },
    });
}

export function useDeleteScholarship() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`bursary/scholarships/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.scholarships }); },
    });
}

// =============================================
// REVENUE FORECASTING (Phase 2)
// =============================================

export function useAcademicTerms() {
    return useQuery({
        queryKey: queryKeys.academicTerms,
        queryFn: () => fetchAll<Types.AcademicTerm>('academic/academic-terms/'),
    });
}

export function useRevenueSummary(termId?: string) {
    return useQuery({
        queryKey: queryKeys.revenueSummary(termId),
        queryFn: async () => {
            const response = await apiClient.get('bursary/dashboard/revenue-summary/', {
                params: { term_id: termId }
            });
            return response.data as Types.RevenueSummary;
        },
        enabled: true, // Always load something, backend defaults to current if termId is missing
    });
}

export function useRevenueChart(termId?: string) {
    return useQuery({
        queryKey: queryKeys.revenueForecast(termId),
        queryFn: async () => {
            const response = await apiClient.get('bursary/dashboard/revenue-chart/', {
                params: { term_id: termId }
            });
            return response.data as Types.RevenueChartData;
        },
        enabled: true,
    });
}

// =============================================
// BULK DISCOUNTS (Phase 2)
// =============================================

export function usePreviewBulkDiscount() {
    return useMutation({
        mutationFn: async (payload: {
            scope: { type: string; ids: string[] };
            fee_item: string;
            discount_type: string;
            value: number;
        }) => {
            const response = await apiClient.post('bursary/discounts/preview/', payload);
            return response.data;
        },
    });
}

export function useApplyBulkDiscount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            scope: { type: string; ids: string[] };
            fee_item: string;
            discount_type: string;
            value: number;
            reason: string;
            override: boolean;
        }) => {
            const response = await apiClient.post('bursary/discounts/bulk/', payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.fees });
            queryClient.invalidateQueries({ queryKey: queryKeys.payments });
        },
    });
}
