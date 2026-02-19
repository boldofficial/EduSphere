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
        queryFn: () => fetchAll<Types.Announcement>('announcements/'),
    });
}

export function useCreateAnnouncement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Announcement) => {
            const response = await apiClient.post('announcements/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.announcements }); },
    });
}

export function useUpdateAnnouncement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Announcement> }) => {
            const response = await apiClient.patch(`announcements/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.announcements }); },
    });
}

export function useDeleteAnnouncement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`announcements/${id}/`);
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
            const url = class_id ? `timetables/?student_class=${class_id}` : 'timetables/';
            return fetchAll<Types.Timetable>(url);
        },
    });
}

export function useCreateTimetable() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Partial<Types.Timetable>) => {
            const response = await apiClient.post('timetables/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['timetables'] }); },
    });
}

export function useCreateTimetableEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Partial<Types.TimetableEntry>) => {
            const response = await apiClient.post('timetable-entries/', item);
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
        queryFn: () => fetchAll<Types.SchoolEvent>('events/'),
    });
}

export function useCreateEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.SchoolEvent) => {
            const response = await apiClient.post('events/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.events }); },
    });
}

export function useUpdateEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.SchoolEvent> }) => {
            const response = await apiClient.patch(`events/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.events }); },
    });
}

export function useDeleteEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`events/${id}/`);
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
        queryFn: () => fetchAll<Types.Newsletter>('newsletters/'),
    });
}

export function useCreateNewsletter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Newsletter) => {
            const response = await apiClient.post('newsletters/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.newsletters }); },
    });
}

export function useUpdateNewsletter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Types.Newsletter> }) => {
            const response = await apiClient.patch(`newsletters/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.newsletters }); },
    });
}

export function useDeleteNewsletter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`newsletters/${id}/`);
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
        queryFn: () => fetchAll<Types.Conversation>('conversations/'),
    });
}

export function useCreateConversation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Partial<Types.Conversation> & { participant_ids?: number[] }) => {
            const response = await apiClient.post('conversations/', item);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['conversations'] }); },
    });
}

export function useMarkConversationRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post(`conversations/${id}/mark-read/`);
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
            const url = conversationId ? `messages/?conversation=${conversationId}` : 'messages/';
            return fetchAll<Types.Message>(url);
        },
    });
}

export function useCreateMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Types.Message) => {
            const response = await apiClient.post('messages/', item);
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
            const response = await apiClient.patch(`messages/${id}/`, updates);
            return response.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.messages }); },
    });
}

export function useDeleteMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`messages/${id}/`);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.messages }); },
    });
}
