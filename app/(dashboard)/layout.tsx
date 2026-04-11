'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useSchoolStore } from '@/lib/store';
import { useSettings, useStaff, useTeachers, useMe } from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';

import { LoginView } from '@/components/features/LoginView';
import { DemoBanner } from '@/components/features/DemoBanner';
import { UniversalSearch } from '@/components/features/UniversalSearch';

// Decomposed Components
import { Sidebar } from '@/components/features/dashboard/Sidebar';
import { TopBar } from '@/components/features/dashboard/TopBar';
import { useNavigationFilter } from '@/components/features/dashboard/useNavigationFilter';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { currentRole, currentUser, logout, login: storeLogin } = useSchoolStore();
    const pathname = usePathname();

    // Data Fetching
    const { data: settings = Utils.INITIAL_SETTINGS, isLoading: settingsLoading } = useSettings();
    const { data: freshUser, isLoading: meLoading } = useMe();
    const { data: staffList = [], isLoading: staffLoading } = useStaff();
    const { data: teacherList = [], isLoading: teacherLoading } = useTeachers();

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        General: true,
        Administration: true,
        Academics: true,
        Account: true,
        'Health & Conduct': true,
        Messages: true,
        Tools: true,
    });

    // Auth Sync
    useEffect(() => {
        if (freshUser) {
            let role = freshUser.role.toLowerCase();
            if (role === 'school_admin') role = 'admin';
            storeLogin(role, freshUser);
        }
    }, [freshUser, storeLogin]);

    // Desktop sidebar behavior
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) setIsSidebarOpen(true);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Search Shortcut (Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Roles & Profiles for Navigation
    const currentStaffProfile = useMemo(() => {
        if (currentRole === 'staff') {
            return staffList.find(s => s.id === currentUser?.profile_id || s.email === currentUser?.email);
        }
        return null;
    }, [currentRole, currentUser, staffList]);

    const currentTeacherProfile = useMemo(() => {
        if (currentRole === 'teacher') {
            return teacherList.find(t => t.id === currentUser?.profile_id || t.email === currentUser?.email);
        }
        return null;
    }, [currentRole, currentUser, teacherList]);

    // Filtered Navigation Hook
    const filteredNavigation = useNavigationFilter(
        currentRole,
        currentUser,
        freshUser,
        settings,
        currentStaffProfile,
        currentTeacherProfile
    );

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            const isSuperAdmin = currentRole === 'super_admin';
            logout();
            window.location.href = isSuperAdmin ? '/' : '/login';
        } catch (error) {
            logout();
            window.location.href = '/login';
        }
    };

    const toggleCategory = (categoryName: string) => {
        setExpandedCategories(prev => ({ ...prev, [categoryName]: !prev[categoryName] }));
    };

    // Loading State
    const isStaffLoadingModules = (currentRole === 'staff' && staffLoading) || (currentRole === 'teacher' && teacherLoading);
    if (settingsLoading || isStaffLoadingModules || meLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    if (!currentUser) return <LoginView />;

    return (
        <div className="h-screen bg-gray-50 flex overflow-hidden">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                settings={settings}
                filteredNavigation={filteredNavigation}
                expandedCategories={expandedCategories}
                toggleCategory={toggleCategory}
                pathname={pathname}
                onLogout={handleLogout}
            />

            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300 lg:ml-64">
                {(currentUser?.school === 'Bold Ideas Innovations School' || (currentUser as any)?.school?.name === 'Bold Ideas Innovations School') && (
                    <DemoBanner />
                )}

                <TopBar
                    onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    onSearchOpen={() => setIsSearchOpen(true)}
                    currentRole={currentRole}
                    settings={settings}
                />

                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>

            <UniversalSearch
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                navigation={filteredNavigation}
            />
        </div>
    );
}
