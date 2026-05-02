/**
 * Communication Hooks
 * 
 * Announcements, Timetables, Events, Newsletters, Messages.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import * as Types from '@/lib/types';
import { queryKeys, fetchAll } from './use-data';

// =============================================
// ANNOUNCEMENTS
// =============================================
export function useAnnouncements() {
    return useQuery({
        queryKey: queryKeys.announcements,
        queryFn: () => fetchAll<Types.Announcement>('core/announcements/'),
    });
}

export function useCreateAnnouncement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Announcement) => {
            const response = await apiClient.post('core/announcements/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.announcements }); },
    });
}

export function useUpdateAnnouncement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Announcement> }) => {
            const response = await apiClient.patch(`core/announcements/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.announcements }); },
    });
}

export function useDeleteAnnouncement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`core/announcements/${id}/`);
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
            const url = class_id ? `academic/timetables/?student_class=${class_id}` : 'academic/timetables/';
            return fetchAll<Types.Timetable>(url);
        },
    });
}

export function useCreateTimetable() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Partial<Types.Timetable>) => {
            const response = await apiClient.post('academic/timetables/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['timetables'] }); },
    });
}

export function useCreateTimetableEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Partial<Types.TimetableEntry>) => {
            const response = await apiClient.post('academic/timetable-entries/', item);
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
        queryFn: () => fetchAll<Types.SchoolEvent>('academic/events/'),
    });
}

export function useCreateEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.SchoolEvent) => {
            const response = await apiClient.post('academic/events/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.events }); },
    });
}

export function useUpdateEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.SchoolEvent> }) => {
            const response = await apiClient.patch(`academic/events/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.events }); },
    });
}

export function useDeleteEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`academic/events/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.events }); },
    });
}

// =============================================
// NEWSLETTERS
// =============================================
export function useNewsletters() {
    return useQuery({
        queryKey: queryKeys.newsletters,
        queryFn: () => fetchAll<Types.Newsletter>('core/newsletters/'),
    });
}

export function useCreateNewsletter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Newsletter) => {
            const response = await apiClient.post('core/newsletters/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.newsletters }); },
    });
}

export function useUpdateNewsletter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Newsletter> }) => {
            const response = await apiClient.patch(`core/newsletters/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.newsletters }); },
    });
}

export function useDeleteNewsletter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`core/newsletters/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.newsletters }); },
    });
}

// =============================================
// CONVERSATIONS
// =============================================
export function useConversations() {
    return useQuery({
        queryKey: ['conversations'],
        queryFn: () => fetchAll<Types.Conversation>('core/conversations/'),
    });
}

// =============================================
// NOTIFICATIONS
// =============================================
export function useNotifications() {
    return useQuery({
        queryKey: queryKeys.notifications,
        queryFn: () => fetchAll<Types.NotificationItem>('core/notifications/'),
        refetchInterval: 30000,
    });
}

export function useMarkNotificationRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.patch(`core/notifications/${id}/`, { is_read: true });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
        },
    });
}

export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post('core/notifications/mark-all-read/');
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
        },
    });
}

export function useMessagingRecipients() {
    return useQuery({
        queryKey: ['messaging_recipients'],
        queryFn: () => fetchAll<Types.MessagingRecipient>('core/conversations/recipients/'),
    });
}

export function useCreateConversation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Partial<Types.Conversation> & { participant_ids?: number[] }) => {
            const response = await apiClient.post('core/conversations/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['conversations'] }); },
    });
}

export function useStartConversation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            participant_id: number;
            subject: string;
            body: string;
            type?: 'DIRECT' | 'GROUP' | 'BROADCAST';
        }) => {
            const response = await apiClient.post('core/conversations/start/', payload);
            return response.data as {
                conversation: Types.Conversation;
                message: Types.Message;
            };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            if (data?.conversation?.id) {
                queryClient.invalidateQueries({ queryKey: ['messages', data.conversation.id] });
            }
            queryClient.invalidateQueries({ queryKey: queryKeys.messages });
        },
    });
}

export function useMarkConversationRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post(`core/conversations/${id}/mark-read/`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
    });
}

export function useArchiveConversation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post(`core/conversations/${id}/archive/`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
    });
}

// =============================================
// MESSAGES
// =============================================
export function useMessages(conversationId?: string) {
    return useQuery({
        queryKey: conversationId ? ['messages', conversationId] : queryKeys.messages,
        queryFn: () => {
            const url = conversationId ? `core/messages/?conversation=${conversationId}` : 'core/messages/';
            return fetchAll<Types.Message>(url);
        },
    });
}

export function useCreateMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Message) => {
            const response = await apiClient.post('core/messages/', item);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.messages });
            if (variables.conversation) {
                queryClient.invalidateQueries({ queryKey: ['messages', variables.conversation] });
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
            }
        },
    });
}

export function useUpdateMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Message> }) => {
            const response = await apiClient.patch(`core/messages/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.messages }); },
    });
}

export function useDeleteMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`core/messages/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.messages }); },
    });
}
