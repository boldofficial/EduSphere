import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import * as Types from '@/lib/types';

// Keys
export const payrollKeys = {
    all: ['payroll'] as const,
    allowances: () => [...payrollKeys.all, 'allowances'] as const,
    deductions: () => [...payrollKeys.all, 'deductions'] as const,
    structures: (staffId?: string | number) => [...payrollKeys.all, 'structures', staffId] as const,
    payrolls: (month?: string) => [...payrollKeys.all, 'runs', month] as const,
};

// --- Salary Allowances ---
export function useSalaryAllowances() {
    return useQuery({
        queryKey: payrollKeys.allowances(),
        queryFn: async () => {
            const res = await apiClient.get<Types.PaginatedResponse<Types.SalaryAllowance>>('salary-allowances/');
            return res.data.results;
        }
    });
}

export function useCreateAllowance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Types.SalaryAllowance>) => apiClient.post('salary-allowances/', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: payrollKeys.allowances() })
    });
}

// --- Salary Deductions ---
export function useSalaryDeductions() {
    return useQuery({
        queryKey: payrollKeys.deductions(),
        queryFn: async () => {
            const res = await apiClient.get<Types.PaginatedResponse<Types.SalaryDeduction>>('salary-deductions/');
            return res.data.results;
        }
    });
}

export function useCreateDeduction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Types.SalaryDeduction>) => apiClient.post('salary-deductions/', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: payrollKeys.deductions() })
    });
}

// --- Staff Salary Structure ---
export function useStaffSalaryStructure(staffId: string | number) {
    return useQuery({
        queryKey: payrollKeys.structures(staffId),
        queryFn: async () => {
            // Custom action to get by staff_id
            const res = await apiClient.get<Types.StaffSalaryStructure>(`salary-structures/by_staff/?staff_id=${staffId}`);
            return res.data;
        },
        enabled: !!staffId
    });
}

export function useUpdateSalaryStructure() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string | number, data: Partial<Types.StaffSalaryStructure> }) =>
            apiClient.patch(`salary-structures/${id}/`, data),
        onSuccess: (_, variables) => {
            // We might not know the staffId from the response easily depending on backend,
            // but we can invalidate all structures or try to be specific if we passed staffId in context
            queryClient.invalidateQueries({ queryKey: payrollKeys.all });
        }
    });
}

// --- Payroll Runs ---
export function usePayrolls() {
    return useQuery({
        queryKey: payrollKeys.payrolls(),
        queryFn: async () => {
            const res = await apiClient.get<Types.PaginatedResponse<Types.Payroll>>('payrolls/');
            return res.data.results;
        }
    });
}

export function useGeneratePayroll() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (month: string) => apiClient.post('payrolls/generate/', { month }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: payrollKeys.payrolls() })
    });
}

export function useApprovePayroll() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => apiClient.post(`payrolls/${id}/approve/`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: payrollKeys.payrolls() })
    });
}

export function useMarkPayrollPaid() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, createExpense }: { id: string | number, createExpense: boolean }) =>
            apiClient.post(`payrolls/${id}/mark_paid/`, { create_expense: createExpense }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.payrolls() });
            queryClient.invalidateQueries({ queryKey: ['expenses'] }); // Also update expenses
        }
    });
}
