import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as Types from './types';
import * as Utils from './utils';
import * as DataService from './data-service';

interface SchoolState {
    currentUser: any | null;
    currentRole: Types.UserRole;

    // Auth Actions
    login: (role: Types.UserRole, user?: any) => void;
    logout: () => void;
    switchRole: (role: Types.UserRole) => void;

    // Legacy view state (kept for compatibility if needed, but should be phased out)
    view: Types.ViewState;
    setView: (view: Types.ViewState) => void;
    // Hydration tracking
    hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

// Custom debounced storage to prevent main thread blocking
const debouncedStorage = {
    getItem: (name: string) => {
        if (typeof window === 'undefined') return null;
        try {
            return localStorage.getItem(name);
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    },
    setItem: Utils.debounce((name: string, value: string) => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(name, value);
        } catch (error) {
            console.error('Error writing to localStorage:', error);
        }
    }, 500),
    removeItem: (name: string) => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.removeItem(name);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    },
};

export const useSchoolStore = create<SchoolState>()(
    persist(
        (set) => ({
            currentUser: null,
            currentRole: null as unknown as Types.UserRole, // Start as null to detect hydration
            view: 'dashboard',
            hasHydrated: false,

            setHasHydrated: (state: boolean) => set({ hasHydrated: state }),
            login: (role: Types.UserRole, user: any = null) => set({ currentRole: role, currentUser: user, view: 'dashboard' }),
            logout: () => set({ currentUser: null, currentRole: 'admin', view: 'dashboard' }),
            switchRole: (role: Types.UserRole) => set({ currentRole: role, view: 'dashboard' }),
            setView: (view: Types.ViewState) => set({ view }),
        }),
        {
            name: 'ng-school-storage',
            storage: createJSONStorage(() => debouncedStorage as any),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
            partialize: (state) => ({
                currentRole: state.currentRole,
                currentUser: state.currentUser,
                view: state.view,
            }),
        }
    )
);
