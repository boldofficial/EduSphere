'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    LayoutDashboard, Users, BookOpen, GraduationCap,
    CalendarCheck, CreditCard, Database, Settings as SettingsIcon,
    LogOut, Menu, ClipboardList, BadgeCheck, UserCog,
    Megaphone, Calendar, BarChart3, FileCheck, Newspaper, Mail, ShieldCheck, Globe,
    MessageSquare, Search, ChevronDown, ChevronRight, Activity, Heart, Wallet, ScrollText, Megaphone as AnnouncementIcon
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSchoolStore } from '@/lib/store';
import { useSettings, useStaff, useTeachers, useMe } from '@/lib/hooks/use-data';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { LoginView } from '@/components/features/LoginView';
import { NotificationCenter } from '@/components/features/NotificationCenter';
import { DemoBanner } from '@/components/features/DemoBanner';
import { UniversalSearch } from '@/components/features/UniversalSearch';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    // Auth from store (keep this)
    const { currentRole, currentUser, logout, login: storeLogin } = useSchoolStore();

    // Standard Next.js state for refactor phase
    const [authLoading, setAuthLoading] = useState(false);

    // Settings from TanStack Query - only enabled once auth is ready
    const { data: settings = Utils.INITIAL_SETTINGS, isLoading: settingsLoading } = useSettings();

    // Fetch fresh user data (includes subscription modules)
    const { data: freshUser, isLoading: meLoading } = useMe();

    // Update store when fresh user data arrives to keep it synced
    useEffect(() => {
        if (freshUser) {
            // Normalize role from backend (SCHOOL_ADMIN -> admin)
            let role = freshUser.role.toLowerCase();
            if (role === 'school_admin') role = 'admin';
            if (role === 'super_admin') role = 'super_admin';

            storeLogin(role, freshUser);
        }
    }, [freshUser, storeLogin]);

    // Fetch staff data to get assigned_modules for staff users
    const { data: staffList = [], isLoading: staffLoading } = useStaff();
    const { data: teacherList = [], isLoading: teacherLoading } = useTeachers();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start closed on mobile
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const pathname = usePathname();

    // Get current staff member's profile with assigned_modules
    const currentStaffProfile = useMemo(() => {
        if (currentRole === 'staff' && currentUser?.profile_id) {
            return staffList.find(s => s.id === currentUser.profile_id);
        }
        // Also try matching by email as fallback
        if (currentRole === 'staff' && currentUser?.email) {
            return staffList.find(s => s.email === currentUser.email);
        }
        return null;
    }, [currentRole, currentUser, staffList]);

    // Get current teacher's profile with assigned_modules
    const currentTeacherProfile = useMemo(() => {
        if (currentRole === 'teacher' && currentUser?.profile_id) {
            return teacherList.find(t => t.id === currentUser.profile_id);
        }
        if (currentRole === 'teacher' && currentUser?.email) {
            return teacherList.find(t => t.email === currentUser.email);
        }
        return null;
    }, [currentRole, currentUser, teacherList]);

    // Set sidebar open by default on desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsSidebarOpen(true);
            }
        };
        handleResize(); // Check on mount
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Global Search Shortcut (Cmd+K)
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

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            const isSuperAdmin = currentRole === 'super_admin';
            logout(); // Clear store

            // If super admin, go to platform root, otherwise go to login
            window.location.href = isSuperAdmin ? '/' : '/login';
        } catch (error) {
            console.error('Logout failed:', error);
            logout();
            window.location.href = '/login';
        }
    };

    // Show loading spinner while auth OR settings are initializing
    // Also wait for staff data if user is a staff member (to load assigned_modules)
    // IMPORTANT: This must be checked BEFORE computing navigation to prevent flickering
    const isStaffLoadingModules = (currentRole === 'staff' && staffLoading) || (currentRole === 'teacher' && teacherLoading);
    if (authLoading || settingsLoading || isStaffLoadingModules || meLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    const isAuthenticated = !!currentUser;

    if (!isAuthenticated) {
        return <LoginView />;
    }

    const navigation = [
        { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'General' },

        { id: 'students', name: 'Students', href: '/students', icon: GraduationCap, category: 'Administration' },
        { id: 'teachers', name: 'Teachers', href: '/teachers', icon: Users, category: 'Administration' },
        { id: 'staff', name: 'Non-Academic', icon: UserCog, href: '/staff', category: 'Administration' },
        { id: 'admissions', name: 'Admissions', href: '/admissions', icon: FileCheck, category: 'Administration' },
        { id: 'id_cards', name: 'ID Cards', href: '/id_cards', icon: BadgeCheck, category: 'Administration' },

        { id: 'classes', name: 'Classes', href: '/classes', icon: BookOpen, category: 'Academics' },
        { id: 'timetables', name: 'Timetable', href: '/timetable', icon: Calendar, category: 'Academics' },
        { id: 'learning', name: 'Learning Center', href: '/learning', icon: GraduationCap, category: 'Academics' },
        { id: 'grading', name: 'Grading', href: '/grading', icon: ClipboardList, category: 'Academics' },
        { id: 'attendance', name: 'Attendance', href: '/attendance', icon: CalendarCheck, category: 'Academics' },
        { id: 'broadsheet', name: 'Broadsheet', href: '/broadsheet', icon: ScrollText, category: 'Academics' },
        { id: 'calendar', name: 'Calendar', href: '/calendar', icon: Calendar, category: 'Academics' },

        { id: 'bursary', name: 'Bursary', href: '/bursary', icon: Wallet, category: 'Account' },

        { id: 'conduct', name: 'Conduct & Log', href: '/conduct', icon: Activity, category: 'Health & Conduct' },

        { id: 'messages', name: 'Messages', href: '/messages', icon: Mail, category: 'Messages' },
        { id: 'announcements', name: 'Announcements', href: '/announcements', icon: AnnouncementIcon, category: 'Messages' },
        { id: 'newsletter', name: 'Newsletter', href: '/newsletter', icon: Newspaper, category: 'Messages' },

        { id: 'cms', name: 'Website CMS', href: '/cms', icon: Globe, category: 'Tools' },
        { id: 'analytics', name: 'Analytics', href: '/analytics', icon: BarChart3, category: 'Tools' },
        { id: 'data', name: 'System Data', href: '/data', icon: Database, category: 'Tools' },
        { id: 'support', name: 'Support & Tickets', href: '/support', icon: MessageSquare, category: 'Tools' },
        { id: 'settings', name: 'Settings', href: '/settings', icon: SettingsIcon, category: 'Tools' },
    ];

    const categories = [
        { name: 'General', icon: LayoutDashboard, color: 'text-white' },
        { name: 'Administration', icon: Users, color: 'text-blue-400' },
        { name: 'Academics', icon: BookOpen, color: 'text-emerald-400' },
        { name: 'Account', icon: CreditCard, color: 'text-amber-400' },
        { name: 'Health & Conduct', icon: Heart, color: 'text-rose-400' },
        { name: 'Messages', icon: Mail, color: 'text-purple-400' },
        { name: 'Tools', icon: SettingsIcon, color: 'text-slate-400' },
    ];

    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        General: true,
        Administration: true,
        Academics: true,
        Account: true,
        'Health & Conduct': true,
        Messages: true,
        Tools: true,
    });

    const toggleCategory = (categoryName: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryName]: !prev[categoryName]
        }));
    };

    // Get allowed navigation from role permissions
    // Fallback to INITIAL_SETTINGS if role is missing in fetched settings
    const rolePermissions = settings.role_permissions?.[currentRole] || Utils.INITIAL_SETTINGS.role_permissions[currentRole];

    let allowedNavIds = currentRole === 'admin'
        ? navigation.map(n => n.id)
        : (rolePermissions?.navigation || ['dashboard']);

    // Special handling for Staff: Use assigned_modules from the staff profile in database
    // Only override if the staff has specific modules assigned, otherwise use role permissions
    if (currentRole === 'staff' && currentStaffProfile) {
        const staffModules = currentStaffProfile.assigned_modules || [];
        if (staffModules.length > 0) {
            // Staff with specific modules gets dashboard + their assigned modules
            allowedNavIds = ['dashboard', ...staffModules];
        }
    }

    if (currentRole === 'teacher' && currentTeacherProfile) {
        // Teacher logic: specific assignments, or default teacher role + assigned modules
        const teacherModules = currentTeacherProfile.assigned_modules || [];
        // If teacher has specific extra modules assigned, append them to the default role permissions
        // Or if we want strictly assigned, we can replace. 
        // Usually teachers need standard teacher nav (Classes, Grading) + extras.

        // For now, let's APPEND explicitly assigned modules to the role defaults
        if (teacherModules.length > 0) {
            allowedNavIds = [...new Set([...allowedNavIds, ...teacherModules])];
        }
    }

    // ALLOWED MODULES from School Subscription Plan
    // Use fresh user data if available, fallback to store
    const userToUse = freshUser || currentUser;
    const schoolAllowedModules = (userToUse as any)?.subscription?.allowed_modules || [];

    // Master list of allowed IDs considering both Role Permissions AND Plan Limitations
    const masterAllowedNavIds = allowedNavIds.filter((id: string) => {
        // Special Case: Dashboard and Settings are core platform features
        if (id === 'dashboard' || id === 'settings' || id === 'data' || id === 'timetables' || id === 'support') return true;

        // The module must be in both the user's role-permission list AND the school's plan-allowed list
        return (schoolAllowedModules as string[]).includes(id);
    });

    const filteredNavigation = navigation.filter(item => masterAllowedNavIds.includes(item.id));

    // If user is authenticated but no userData yet, we may still be loading
    // But don't block forever - after auth loads, userData should always be set
    // The auth provider now always returns userData (even default) so this shouldn't trigger

    return (
        <div className="h-screen bg-gray-50 flex overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
                w-64 h-full bg-brand-900 transition-all duration-300 flex flex-col fixed inset-y-0 z-40 no-print
            `}>
                <div className="h-16 lg:h-20 flex items-center px-4 lg:px-6 border-b border-white/10 shrink-0 gap-3">
                    <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-brand-600 font-bold shrink-0 shadow-sm">
                        <img src={settings.logo_media || '/logo.png'} alt="Logo" className="h-8 w-8 object-contain" />
                    </div>
                    <span className="ml-2 text-white font-bold text-lg lg:text-xl truncate tracking-tight">
                        {settings.school_name.split(' ')[0]}
                    </span>
                    {/* Mobile close button */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden ml-auto p-2 text-white/70 hover:text-white"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 px-3 lg:px-4 py-4 lg:py-6 space-y-4 overflow-y-auto custom-scrollbar text-white">
                    {categories.map((category) => {
                        const items = filteredNavigation.filter(n => n.category === category.name);
                        if (items.length === 0) return null;

                        const isExpanded = expandedCategories[category.name];

                        return (
                            <div key={category.name} className="space-y-1">
                                {category.name !== 'General' ? (
                                    <button
                                        onClick={() => toggleCategory(category.name)}
                                        className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-black uppercase tracking-widest text-brand-300/50 hover:text-brand-200 transition-colors group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <category.icon className={`h-3 w-3 ${category.color}`} />
                                            <span>{category.name}</span>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronDown className="h-3 w-3" />
                                        ) : (
                                            <ChevronRight className="h-3 w-3" />
                                        )}
                                    </button>
                                ) : null}

                                {isExpanded && (
                                    <div className="space-y-1">
                                        {items.map((item) => (
                                            <Link
                                                key={item.id}
                                                href={item.href}
                                                onClick={() => {
                                                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                                }}
                                                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group ${pathname === item.href
                                                    ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/20'
                                                    : 'text-brand-100 hover:bg-white/5 hover:text-white'
                                                    }`}
                                            >
                                                <item.icon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${pathname === item.href ? 'text-white' : category.color}`} />
                                                <span className="ml-3">{item.name}</span>
                                                {pathname === item.href && (
                                                    <div className="ml-auto w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse" />
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="p-3 lg:p-4 border-t border-white/10 shrink-0">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-3 lg:px-4 py-2.5 lg:py-3 text-sm font-medium text-brand-100 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
                    >
                        <LogOut className="h-5 w-5 shrink-0" />
                        <span className="ml-3">Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content - Adjust margin for sidebar */}
            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300 lg:ml-64">
                {(currentUser?.school === 'Bold Ideas Innovations School' || (currentUser as any)?.school?.name === 'Bold Ideas Innovations School') && (
                    <DemoBanner />
                )}
                <header className="h-16 lg:h-20 bg-white border-b sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6 no-print shadow-sm shrink-0">
                    {/* Mobile menu button - hidden on desktop */}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md transition-colors hover:bg-gray-100 lg:hidden">
                        <Menu className="h-5 w-5 text-gray-600" />
                    </button>
                    <div className="hidden lg:flex items-center gap-4">
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 hover:text-brand-600 hover:bg-white hover:border-brand-200 transition-all group group"
                        >
                            <Search size={18} className="group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium">Search anything...</span>
                            <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 border border-gray-200 rounded text-[10px] font-black text-gray-400">⌘K</kbd>
                        </button>
                    </div>
                    <div className="flex items-center gap-3 lg:gap-6">
                        <NotificationCenter />
                        <div className="flex items-center gap-2 lg:gap-4 border-l pl-3 lg:pl-6">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs lg:text-sm font-bold text-gray-900 uppercase tracking-tight">{currentRole}</p>
                                <p className="text-xs text-brand-600 font-medium">{settings.current_term}</p>
                            </div>
                            <div className="h-8 w-8 lg:h-10 lg:w-10 bg-brand-50 rounded-full border-2 border-brand-100 flex items-center justify-center font-bold text-brand-700 uppercase text-xs lg:text-sm">
                                {currentRole.substring(0, 2)}
                            </div>
                        </div>
                    </div>
                </header>

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
