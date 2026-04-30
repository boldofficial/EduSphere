import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import * as Types from '@/lib/types';

// Keys
export const payrollKeys = {
    all: ['payroll'] as const,
    dashboard: () => [...payrollKeys.all, 'dashboard'] as const,
    allowances: () => [...payrollKeys.all, 'allowances'] as const,
    deductions: () => [...payrollKeys.all, 'deductions'] as const,
    structures: (staffId?: string | number) => [...payrollKeys.all, 'structures', staffId] as const,
    payrolls: (month?: string) => [...payrollKeys.all, 'runs', month] as const,
};

// --- HR Dashboard ---
export function useHRDashboard() {
    return useQuery({
        queryKey: payrollKeys.dashboard(),
        queryFn: async () => {
            const res = await apiClient.get<Types.HRDashboardData>('hr/dashboard/summary/');
            return res.data;
        }
    });
}

// --- Salary Allowances ---
export function useSalaryAllowances() {
    return useQuery({
        queryKey: payrollKeys.allowances(),
        queryFn: async () => {
            const res = await apiClient.get<Types.PaginatedResponse<Types.SalaryAllowance>>('hr/salary-allowances/');
            return res.data.results;
        }
    });
}

export function useCreateAllowance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Types.SalaryAllowance>) => apiClient.post('hr/salary-allowances/', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: payrollKeys.allowances() })
    });
}

// --- Salary Deductions ---
export function useSalaryDeductions() {
    return useQuery({
        queryKey: payrollKeys.deductions(),
        queryFn: async () => {
            const res = await apiClient.get<Types.PaginatedResponse<Types.SalaryDeduction>>('hr/salary-deductions/');
            return res.data.results;
        }
    });
}

export function useCreateDeduction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Types.SalaryDeduction>) => apiClient.post('hr/salary-deductions/', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: payrollKeys.deductions() })
    });
}

// --- Staff Salary Structure ---
export function useStaffSalaryStructure(staffId: string | number) {
    return useQuery({
        queryKey: payrollKeys.structures(staffId),
        queryFn: async () => {
            const res = await apiClient.get<Types.StaffSalaryStructure>(`hr/salary-structures/by_staff/?staff_id=${staffId}`);
            return res.data;
        },
        enabled: !!staffId
    });
}

export function useUpdateSalaryStructure() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string | number, data: Partial<Types.StaffSalaryStructure> }) =>
            apiClient.patch(`hr/salary-structures/${id}/`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.all });
        }
    });
}

// --- Payroll Runs ---
export function usePayrolls() {
    return useQuery({
        queryKey: payrollKeys.payrolls(),
        queryFn: async () => {
            const res = await apiClient.get<Types.PaginatedResponse<Types.Payroll>>('hr/payrolls/');
            return res.data.results;
        }
    });
}

export function useGeneratePayroll() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (month: string) => apiClient.post('hr/payrolls/generate/', { month }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.payrolls() });
            queryClient.invalidateQueries({ queryKey: payrollKeys.dashboard() });
        }
    });
}

export function useApprovePayroll() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => apiClient.post(`hr/payrolls/${id}/approve/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.payrolls() });
            queryClient.invalidateQueries({ queryKey: payrollKeys.dashboard() });
        }
    });
}

export function useMarkPayrollPaid() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, createExpense }: { id: string | number, createExpense: boolean }) =>
            apiClient.post(`hr/payrolls/${id}/mark_paid/`, { create_expense: createExpense }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.payrolls() });
            queryClient.invalidateQueries({ queryKey: payrollKeys.dashboard() });
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        }
    });
}

export function useDeletePayroll() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => apiClient.delete(`hr/payrolls/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.payrolls() });
            queryClient.invalidateQueries({ queryKey: payrollKeys.dashboard() });
        }
    });
}
