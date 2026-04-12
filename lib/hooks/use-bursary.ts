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

export interface BursaryPeriodFilters extends Record<string, unknown> {
    session?: string;
    term?: string;
    include_all_periods?: boolean;
}

export interface AcademicTermOption {
    id: string | number;
    name: string;
    session: string;
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
}

export interface RevenueSummaryData {
    term?: AcademicTermOption;
    expected: number;
    collected: number;
    outstanding: number;
    forecast: number;
    collection_rate: number;
    days_elapsed: number;
    days_total: number;
}

export interface RevenueChartData {
    labels: string[];
    expected: number[];
    collected: Array<number | null>;
    forecast: number[];
}

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

const normalizeTerm = (term: Partial<AcademicTermOption> | null | undefined): AcademicTermOption => ({
    id: term?.id ?? '',
    name: term?.name ?? '',
    session: term?.session ?? '',
    start_date: term?.start_date,
    end_date: term?.end_date,
    is_current: !!term?.is_current,
});

// =============================================
// FEES
// =============================================
export function useFees(filters?: BursaryPeriodFilters) {
    return useQuery({
        queryKey: [...queryKeys.fees, filters || {}],
        queryFn: () => fetchAll<Types.FeeStructure>('fees/', filters),
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
export interface PaymentFilters extends BursaryPeriodFilters {
    student?: string;
}

export function usePayments(filters?: PaymentFilters) {
    return useQuery({
        queryKey: [...queryKeys.payments, filters || {}],
        queryFn: async () => {
            const rows = await fetchAll<PaymentApiResponse>('payments/', filters);
            return rows.map(normalizePayment);
        },
    });
}

export function usePaginatedPayments(
    page = 1,
    pageSize = 50,
    studentOrFilters: string | (BursaryPeriodFilters & { studentId?: string }) = '',
) {
    const filters =
        typeof studentOrFilters === 'string'
            ? { studentId: studentOrFilters }
            : (studentOrFilters || {});

    return useQuery({
        queryKey: [...queryKeys.payments, { page, pageSize, ...filters }],
        queryFn: async () => {
            const response = await fetchPaginated<PaymentApiResponse>('payments/', page, pageSize, {
                student: filters.studentId,
                session: filters.session,
                term: filters.term,
                include_all_periods: filters.include_all_periods,
            });
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
            const response = await apiClient.post('payments/', payload);
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
            const response = await apiClient.patch(`payments/${id}/`, payload);
            return normalizePayment(response.data);
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

export function useAcademicTerms() {
    return useQuery({
        queryKey: queryKeys.academicTerms,
        queryFn: async (): Promise<AcademicTermOption[]> => {
            try {
                const response = await apiClient.get('academic/terms/');
                const rows =
                    response.data && typeof response.data === 'object' && 'results' in response.data
                        ? response.data.results
                        : Array.isArray(response.data)
                            ? response.data
                            : [];
                if (rows.length > 0) {
                    return rows.map((term: Partial<AcademicTermOption>) => normalizeTerm(term));
                }
            } catch {
                // Fall back to a single current term from the summary endpoint.
            }

            try {
                const summaryResponse = await apiClient.get('dashboard/revenue-summary/');
                const currentTerm = summaryResponse?.data?.term;
                if (currentTerm) {
                    return [normalizeTerm({ ...currentTerm, is_current: true })];
                }
            } catch {
                // Return empty when both endpoints are unavailable.
            }

            return [];
        },
    });
}

export function useRevenueSummary(termId?: string) {
    return useQuery({
        queryKey: queryKeys.revenueSummary(termId),
        queryFn: async (): Promise<RevenueSummaryData> => {
            const response = await apiClient.get('dashboard/revenue-summary/', {
                params: termId ? { term_id: termId } : undefined,
            });
            return response.data;
        },
    });
}

export function useRevenueChart(termId?: string) {
    return useQuery({
        queryKey: queryKeys.revenueForecast(termId),
        queryFn: async (): Promise<RevenueChartData> => {
            const response = await apiClient.get('dashboard/revenue-chart/', {
                params: termId ? { term_id: termId } : undefined,
            });
            return response.data;
        },
    });
}

// =============================================
// EXPENSES
// =============================================
export function useExpenses(filters?: BursaryPeriodFilters) {
    return useQuery({
        queryKey: [...queryKeys.expenses, filters || {}],
        queryFn: () => fetchAll<Types.Expense>('expenses/', filters),
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

export function usePreviewBulkDiscount() {
    return useMutation({
        mutationFn: async (payload: {
            scope: { type: string; ids: string[] };
            fee_item: string;
            discount_type: string;
            value: number;
        }) => {
            const response = await apiClient.post('discounts/preview/', payload);
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
            reason?: string;
            override?: boolean;
        }) => {
            const response = await apiClient.post('discounts/bulk/', payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.fees });
            queryClient.invalidateQueries({ queryKey: queryKeys.payments });
            queryClient.invalidateQueries({ queryKey: ['bursary', 'dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['revenue_summary'] });
            queryClient.invalidateQueries({ queryKey: ['revenue_forecast'] });
            queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
        },
    });
}
