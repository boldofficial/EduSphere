/**
 * Data Service Layer
 * 
 * This module provides a unified interface for data operations.
 * Refactored to be backend-agnostic, preparing for Django API integration.
 */

import * as Types from '@/lib/types'
import { INITIAL_SETTINGS } from '@/lib/utils'

// Development-only logging
const isDev = process.env.NODE_ENV === 'development';
const devLog = (...args: any[]) => isDev && console.log(...args);

// API Configuration
const API_URL = (process.env.DJANGO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '') + '/api';

/**
 * Helper for API requests
 */
async function apiRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API request failed: ${response.statusText}`);
    }

    return response.json();
}

// =============================================
// SETTINGS
// =============================================

export async function fetchSettings(): Promise<Types.Settings> {
    try {
        // Placeholder for Django API: GET /settings/
        // For now, return defaults since backend isn't ready
        devLog('[DataService] Fetching settings (Placeholder)');
        return INITIAL_SETTINGS;
    } catch (err) {
        console.error('[DataService] Unexpected error fetching settings:', err);
        return INITIAL_SETTINGS;
    }
}

export async function updateSettings(settings: Types.Settings): Promise<Types.Settings> {
    try {
        devLog('[DataService] Updating settings (Placeholder)');
        return settings;
    } catch (err) {
        console.error('[DataService] Unexpected error updating settings:', err);
        throw err;
    }
}

// =============================================
// GENERIC CRUD
// =============================================

export async function fetchAll<T>(table: string, params?: any): Promise<T[]> {
    try {
        const response = await apiClient.get(`${table}/`, { params });
        // Handle DRF pagination results
        return response.data.results || response.data;
    } catch (err) {
        console.error(`[DataService] Unexpected error fetching ${table}:`, err);
        return [];
    }
}

export async function createItem<T>(table: string, item: any): Promise<T> {
    try {
        const response = await apiClient.post(`${table}/`, item);
        return response.data;
    } catch (err) {
        console.error(`[DataService] Unexpected error creating item in ${table}:`, err);
        throw err;
    }
}

export async function updateItem<T>(table: string, id: string | number, updates: any): Promise<T> {
    try {
        const response = await apiClient.patch(`${table}/${id}/`, updates);
        return response.data;
    } catch (err) {
        console.error(`[DataService] Unexpected error updating item ${id} in ${table}:`, err);
        throw err;
    }
}

export async function deleteItem(table: string, id: string | number): Promise<void> {
    try {
        await apiClient.delete(`${table}/${id}/`);
    } catch (err) {
        console.error(`[DataService] Unexpected error deleting item ${id} from ${table}:`, err);
        throw err;
    }
}

/**
 * Specialized action to convert an admission to a student
 */
export async function convertAdmissionToStudent(admissionId: string | number, data: any) {
    try {
        const response = await apiClient.post(`admissions/${admissionId}/convert-to-student/`, data);
        return response.data;
    } catch (err) {
        console.error(`[DataService] Failed to convert admission ${admissionId}:`, err);
        throw err;
    }
}

// =============================================
// FILE UPLOADS
// =============================================

import apiClient from '@/lib/api-client';

export async function uploadFile(
    file: File, // Changed to accept File object directly
    folder: string = 'uploads'
): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
        const response = await apiClient.post('upload/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.url;
    } catch (error) {
        console.error('File upload failed:', error);
        throw new Error('Failed to upload file');
    }
}
