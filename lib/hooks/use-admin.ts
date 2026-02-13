/**
 * Admin & Platform Hooks
 * 
 * Super-admin, platform settings, email management, and governance hooks.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { INITIAL_SETTINGS } from '@/lib/utils';
import * as Types from '@/lib/types';
import { queryKeys } from './use-data';

// =============================================
// SETTINGS
// =============================================
export function useSettings() {
    return useQuery({
        queryKey: queryKeys.settings,
        queryFn: async () => {
            try {
                const response = await apiClient.get('settings/');
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
            const response = await apiClient.put('settings/', settings);
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
            const response = await apiClient.get('public-stats/');
            return response.data;
        },
    });
}

export function useMe() {
    return useQuery({
        queryKey: queryKeys.me,
        queryFn: async () => {
            const response = await apiClient.get('users/me/');
            return response.data;
        },
    });
}

// =============================================
// SUPER ADMIN
// =============================================
export function useSystemHealth() {
    return useQuery({
        queryKey: queryKeys.systemHealth,
        queryFn: async () => {
            const response = await apiClient.get('schools/health/');
            return response.data;
        },
        refetchInterval: 30000,
    });
}

export function useAdminSchools() {
    return useQuery({
        queryKey: queryKeys.adminSchools,
        queryFn: async () => {
            const response = await apiClient.get('schools/list/');
            return response.data;
        },
    });
}

export function useAdminPlans() {
    return useQuery({
        queryKey: queryKeys.adminPlans,
        queryFn: async () => {
            const response = await apiClient.get('schools/plans/');
            return response.data;
        },
    });
}

export function useAdminRevenue() {
    return useQuery({
        queryKey: queryKeys.adminRevenue,
        queryFn: async () => {
            const response = await apiClient.get('schools/revenue/');
            return response.data;
        },
    });
}

export function useStrategicAnalytics() {
    return useQuery({
        queryKey: queryKeys.strategicAnalytics,
        queryFn: async () => {
            const response = await apiClient.get('schools/analytics/strategic/');
            return response.data;
        },
    });
}

export function usePlatformGovernance() {
    return useQuery({
        queryKey: queryKeys.platformGovernance,
        queryFn: async () => {
            const response = await apiClient.get('schools/governance/');
            return response.data;
        },
        refetchInterval: 60000,
    });
}

export function usePlatformAnnouncements() {
    return useQuery({
        queryKey: queryKeys.userAnnouncements,
        queryFn: async () => {
            const response = await apiClient.get('schools/announcements/');
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
            const response = await apiClient.get(`schools/search/global/?q=${query}`);
            return response.data;
        },
        enabled: query.length >= 2,
    });
}

export function useModules() {
    return useQuery({
        queryKey: queryKeys.modules,
        queryFn: async () => {
            const response = await apiClient.get('schools/modules/');
            return response.data;
        },
    });
}

export function usePlatformSettings() {
    return useQuery({
        queryKey: queryKeys.platformSettings,
        queryFn: async () => {
            const response = await apiClient.get('schools/platform-settings/');
            return response.data;
        },
    });
}

export function useUpdatePlatformSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (settings: any) => {
            const response = await apiClient.put('schools/platform-settings/', settings);
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
            const response = await apiClient.get('emails/templates/');
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
            const response = await apiClient.patch(`emails/templates/${id}/`, updates);
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
            const response = await apiClient.get('emails/logs/');
            if (response.data && typeof response.data === 'object' && 'results' in response.data) {
                return response.data.results;
            }
            return Array.isArray(response.data) ? response.data : [];
        },
        refetchInterval: 10000,
    });
}

// =============================================
// SUPPORT TICKETS
// =============================================
export function useSupportTickets() {
    return useQuery({
        queryKey: queryKeys.supportTickets,
        queryFn: async () => {
            const response = await apiClient.get('schools/support/tickets/');
            if (response.data && typeof response.data === 'object' && 'results' in response.data) {
                return response.data.results;
            }
            return Array.isArray(response.data) ? response.data : [];
        },
    });
}

export function useCreateSupportTicket() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (ticket: Partial<Types.SupportTicket>) => {
            const response = await apiClient.post('schools/support/tickets/', ticket);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets });
        },
    });
}

export function useRespondToTicket() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, message }: { id: number; message: string }) => {
            const response = await apiClient.post(`schools/support/tickets/${id}/respond/`, { message });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets });
        },
    });
}

export function useResolveTicket() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const response = await apiClient.post(`schools/support/tickets/${id}/resolve/`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets });
        },
    });
}
