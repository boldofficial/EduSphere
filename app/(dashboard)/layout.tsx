'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useSchoolStore } from '@/lib/store';
import { useSettings, useStaff, useTeachers, useMe } from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';

import { LoginView } from '@/components/features/LoginView';
import { OfflineStatus, usePendingOfflineSaves } from '@/components/features/OfflineStatus';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { OFFLINE_OWNER_KEY, clearOfflineCopy } from '@/lib/offline';
import { ChangePasswordGate } from '@/components/features/auth/PasswordForms';
import { DemoBanner } from '@/components/features/DemoBanner';
import { UniversalSearch } from '@/components/features/UniversalSearch';

// Decomposed Components
import { Sidebar } from '@/components/features/dashboard/Sidebar';
import { TopBar } from '@/components/features/dashboard/TopBar';
import { useNavigationFilter } from '@/components/features/dashboard/useNavigationFilter';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentRole, currentUser, logout, login: storeLogin } = useSchoolStore();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const pendingSaves = usePendingOfflineSaves();

  // Data Fetching
  const { data: settings = Utils.INITIAL_SETTINGS, isLoading: settingsLoading } = useSettings();
  const { data: freshUser, isLoading: meLoading } = useMe();
  const { data: staffList = [], isLoading: staffLoading } = useStaff(currentRole === 'staff');
  const { data: teacherList = [], isLoading: teacherLoading } = useTeachers(
    currentRole === 'teacher'
  );

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

  // Data kept on this device for offline use belongs to one person: on a shared school computer,
  // a different person signing in never sees (or sends) the previous person's copy.
  const freshUserId = freshUser?.id;
  useEffect(() => {
    if (!freshUserId) return;
    try {
      const owner = window.localStorage.getItem(OFFLINE_OWNER_KEY);
      if (owner && owner !== String(freshUserId)) {
        queryClient.getMutationCache().clear();
        queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
        clearOfflineCopy();
      }
      window.localStorage.setItem(OFFLINE_OWNER_KEY, String(freshUserId));
    } catch {
      // storage unavailable: nothing is kept on the device
    }
  }, [freshUserId, queryClient]);

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
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Roles & Profiles for Navigation
  const currentStaffProfile = useMemo(() => {
    if (currentRole === 'staff') {
      return staffList.find(
        (s) => s.id === currentUser?.profile_id || s.email === currentUser?.email
      );
    }
    return null;
  }, [currentRole, currentUser, staffList]);

  const currentTeacherProfile = useMemo(() => {
    if (currentRole === 'teacher') {
      return teacherList.find(
        (t) => t.id === currentUser?.profile_id || t.email === currentUser?.email
      );
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
    if (pendingSaves > 0) {
      const ok = await confirm({
        title: 'Some changes have not synced yet',
        description: `${pendingSaves} score or attendance change${pendingSaves === 1 ? ' is' : 's are'} saved only on this device. Signing out now deletes ${pendingSaves === 1 ? 'it' : 'them'}. Reconnect to the internet first to keep ${pendingSaves === 1 ? 'it' : 'them'}.`,
        confirmLabel: 'Sign out anyway',
        tone: 'danger',
      });
      if (!ok) return;
    }
    // Nothing from this session stays on the device.
    queryClient.getMutationCache().clear();
    queryClient.clear();
    clearOfflineCopy();
    try {
      window.localStorage.removeItem(OFFLINE_OWNER_KEY);
    } catch {
      // storage unavailable
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      const isSuperAdmin = currentRole === 'super_admin';
      logout();
      window.location.href = isSuperAdmin ? '/' : '/login';
    } catch {
      logout();
      window.location.href = '/login';
    }
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => ({ ...prev, [categoryName]: !prev[categoryName] }));
  };

  // Loading State
  const isStaffLoadingModules =
    (currentRole === 'staff' && staffLoading) || (currentRole === 'teacher' && teacherLoading);
  if (settingsLoading || isStaffLoadingModules || meLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!currentUser) return <LoginView />;
  if (freshUser?.must_change_password)
    return (
      <ChangePasswordGate
        onDone={() => queryClient.invalidateQueries({ queryKey: ['me'] })}
        onLogout={handleLogout}
      />
    );

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
        {(currentUser?.school === 'Bold Ideas Innovations School' ||
          (currentUser as any)?.school?.name === 'Bold Ideas Innovations School') && <DemoBanner />}

        <OfflineStatus />

        <TopBar
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onSearchOpen={() => setIsSearchOpen(true)}
          currentRole={currentRole}
          settings={settings}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
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
