/**
 * Role-Based Access Control (RBAC) Utilities
 * 
 * Provides server-side and client-side role guards for dashboard pages.
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'student' | 'parent' | 'staff';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
    super_admin: 6,
    admin: 5,
    teacher: 4,
    staff: 3,
    parent: 2,
    student: 1,
};

export const REQUIRED_ROLES_PER_PAGE: Record<string, UserRole[]> = {
    '/dashboard/super-admin': ['super_admin'],
    '/dashboard/admin': ['super_admin', 'admin'],
    '/dashboard/grading': ['super_admin', 'admin', 'teacher'],
    '/dashboard/bursary': ['super_admin', 'admin'],
    '/dashboard/staff': ['super_admin', 'admin', 'staff'],
    '/dashboard/settings': ['super_admin', 'admin'],
    '/dashboard/analytics': ['super_admin', 'admin'],
};

export function hasRole(requiredRoles: UserRole[], userRole: UserRole | null): boolean {
    if (!userRole || !requiredRoles.length) return false;
    return requiredRoles.includes(userRole);
}

export function hasMinimumRole(
    minimumRole: UserRole,
    userRole: UserRole | null
): boolean {
    if (!userRole) return false;
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;
    return userLevel >= requiredLevel;
}

export function getRoleFromToken(token: string): UserRole | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        const role = payload.role || payload.role_type;
        if (!role) return null;
        if (role === 'SUPER_ADMIN') return 'super_admin';
        if (role === 'SCHOOL_ADMIN') return 'admin';
        return role.toLowerCase() as UserRole;
    } catch {
        return null;
    }
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;
        if (!token) return null;
        return getRoleFromToken(token);
    } catch {
        return null;
    }
}

export async function withRoleGuard(
    requiredRoles: UserRole[],
    redirectTo: string = '/login'
) {
    const role = await getCurrentUserRole();
    
    if (!role) {
        return NextResponse.redirect(new URL(redirectTo, 'http://localhost:3000'));
    }
    
    if (!hasRole(requiredRoles, role)) {
        return NextResponse.json(
            { error: 'Access denied - insufficient permissions' },
            { status: 403 }
        );
    }
    
    return null;
}

export function useRoleCheck() {
    return {
        hasRole,
        hasMinimumRole,
    };
}