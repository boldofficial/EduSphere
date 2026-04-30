import { useMemo } from 'react';
import * as Utils from '@/lib/utils';
import { NAVIGATION_ITEMS } from './navigation-config';

export function useNavigationFilter(
    currentRole: string,
    currentUser: any,
    freshUser: any,
    settings: any,
    currentStaffProfile?: any,
    currentTeacherProfile?: any
) {
    return useMemo(() => {
        // Get allowed navigation from role permissions
        const rolePermissions = settings.role_permissions?.[currentRole] || (Utils.INITIAL_SETTINGS.role_permissions as any)[currentRole];

        let allowedNavIds = currentRole === 'admin'
            ? NAVIGATION_ITEMS.map(n => n.id)
            : (rolePermissions?.navigation || ['dashboard']);

        // Special handling for Staff
        if (currentRole === 'staff' && currentStaffProfile) {
            const staffModules = currentStaffProfile.assigned_modules || [];
            if (staffModules.length > 0) {
                allowedNavIds = ['dashboard', 'messages', ...staffModules];
            }
        }

        // Special handling for Teachers
        if (currentRole === 'teacher' && currentTeacherProfile) {
            const teacherModules = currentTeacherProfile.assigned_modules || [];
            if (teacherModules.length > 0) {
                allowedNavIds = [...new Set([...allowedNavIds, ...teacherModules])];
            }
        }

        // ALLOWED MODULES from School Subscription Plan
        const userToUse = freshUser || currentUser;
        const schoolAllowedModules = (userToUse as any)?.subscription?.allowed_modules || [];

        // Always allowed for all (core modules)
        const alwaysAllowed = [
            'dashboard', 'settings', 'data', 'timetables', 'support',
            // New modules - always visible for admins/teachers
            'library', 'inventory', 'transport', 'question_bank', 'exams',
            'hr'
        ];

        const masterAllowedNavIds = allowedNavIds.filter((id: string) => {
            if (alwaysAllowed.includes(id)) return true;
            return (schoolAllowedModules as string[]).includes(id);
        });

        return NAVIGATION_ITEMS.filter(item => masterAllowedNavIds.includes(item.id));
    }, [currentRole, currentUser, freshUser, settings, currentStaffProfile, currentTeacherProfile]);
}
