'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Database,
  Settings,
  Lock,
  TrendingUp,
  Megaphone,
  LifeBuoy,
  Mail,
} from 'lucide-react';
import { useUpdateSettings } from '@/lib/hooks/use-data';
import { useToast } from '@/components/providers/toast-provider';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';
import apiClient from '@/lib/api-client';

// Dashboard sub-components (overview widgets)
import { QuickActions } from './dashboard/QuickActions';
import { AdminOverview } from './dashboard/AdminOverview';

import { DashboardRolesTab } from './dashboard/DashboardRolesTab';
import {
  DashboardHealthTab,
  DashboardSchoolsTab,
  DashboardPlatformSettingsTab,
  SchoolManagementModal,
} from './dashboard/DashboardAdminTabs';

import { StrategicAnalyticsTab } from './dashboard/StrategicAnalyticsTab';
import { PlatformGovernanceTab } from './dashboard/PlatformGovernanceTab';
import { DashboardDemoRequestsTab } from './dashboard/DashboardDemoRequestsTab';
import { DataMigrationTab } from './dashboard/DataMigrationTab';
import { SupportTicketsTab } from './dashboard/SupportTicketsTab';
import { EmailMarketingTab } from './dashboard/EmailMarketingTab';

type TabType =
  | 'overview'
  | 'cms'
  | 'roles'
  | 'health'
  | 'schools'
  | 'platform_settings'
  | 'analytics_strategic'
  | 'governance'
  | 'demo_requests'
  | 'data_migration'
  | 'support_tickets'
  | 'marketing';

interface UserSubscription {
  plan_name: string;
  status: string;
  allowed_modules: string[];
}

interface UserProfile {
  id: number;
  username: string;
  role: string;
  subscription?: UserSubscription;
  analyticsData?: any;
  governanceData?: any;
}

interface DashboardViewProps {
  user?: UserProfile;
  settings: Types.Settings;
  announcements?: any[];
  schools?: any[];
  platformSettings?: any;
  systemHealthData?: any;
  supportTickets?: any[];
  onChangeView?: (view: Types.ViewState) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  settings,
  announcements = [],
  schools = [],
  platformSettings: initialPlatformSettings,
  systemHealthData,
  supportTickets = [],
  onChangeView,
}) => {
  const { mutate: updateSettings } = useUpdateSettings();
  const setSettings = (newSettings: Types.Settings) => updateSettings(newSettings);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [editedSettings, setEditedSettings] = useState(settings);
  const [selectedRole, setSelectedRole] = useState<Types.UserRole>('admin');
  const [editedPlatformSettings, setEditedPlatformSettings] = useState(initialPlatformSettings);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const { addToast } = useToast();

  // ─── Handlers ───────────────────────────────────────────────────────
  const handleSaveSettings = () => {
    const updatedSettings = { ...editedSettings, updated_at: Date.now() };
    setSettings(updatedSettings);
    addToast('System settings saved successfully!', 'success');
  };

  // Super Admin Actions
  const handleApproveSchool = async (schoolId: number) => {
    try {
      await apiClient.patch(`schools/management/${schoolId}/`, { action: 'approve' });
      addToast('School approved and activated!', 'success');
      window.location.reload();
    } catch {
      addToast('Approval failed', 'error');
    }
  };

  const handleSavePlatformSettings = async () => {
    try {
      await apiClient.put('schools/platform-settings/', editedPlatformSettings);
      addToast('Platform settings updated!', 'success');
    } catch {
      addToast('Update failed', 'error');
    }
  };

  const handleUpdateSchool = async (schoolId: number, data: any) => {
    try {
      await apiClient.put(`schools/management/${schoolId}/`, data);
      addToast('School details updated!', 'success');
      window.location.reload();
    } catch {
      addToast('Update failed', 'error');
    }
  };

  // ─── Role Management Data ───────────────────────────────────────────
  const roleLabels: Record<Types.UserRole, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    teacher: 'Teacher',
    student: 'Student',
    parent: 'Parent',
    staff: 'Staff',
  };

  const allowedModules = user?.subscription?.allowed_modules || [];

  const allNavItems = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'students', name: 'Students' },
    { id: 'teachers', name: 'Teachers' },
    { id: 'staff', name: 'Non-Academic Staff' },
    { id: 'classes', name: 'Classes' },
    { id: 'timetables', name: 'Timetable' },
    { id: 'grading', name: 'Grading' },
    { id: 'attendance', name: 'Attendance' },
    { id: 'bursary', name: 'Bursary' },
    { id: 'announcements', name: 'Announcements' },
    { id: 'calendar', name: 'Calendar' },
    { id: 'analytics', name: 'Analytics' },
    { id: 'id_cards', name: 'ID Cards' },
    { id: 'broadsheet', name: 'Broadsheet' },
    { id: 'admissions', name: 'Admissions' },
    { id: 'newsletter', name: 'Newsletter' },
    { id: 'messages', name: 'Messages' },
    { id: 'cms', name: 'Website CMS' },
    { id: 'data', name: 'System Data' },
    { id: 'settings', name: 'Settings' },
  ].filter((item) => {
    if (['dashboard', 'settings', 'data', 'timetables'].includes(item.id)) return true;
    return allowedModules.includes(item.id);
  });

  const allWidgets = [
    { id: 'stats', name: 'Quick Stats', module: 'students' },
    { id: 'finance_chart', name: 'Finance Chart', module: 'bursary' },
    { id: 'student_population', name: 'Student Population', module: 'students' },
    { id: 'quick_actions', name: 'Quick Actions' },
    { id: 'recent_transactions', name: 'Recent Transactions', module: 'bursary' },
    { id: 'my_scores', name: 'My Scores (Student)', module: 'grading' },
    { id: 'my_attendance', name: 'My Attendance', module: 'attendance' },
    { id: 'my_fees', name: 'My Fees', module: 'bursary' },
    { id: 'my_classes', name: 'My Classes (Teacher)', module: 'teachers' },
    { id: 'my_tasks', name: 'My Tasks (Staff)', module: 'staff' },
    { id: 'class_info', name: 'Class Information', module: 'classes' },
  ].filter((w) => !w.module || allowedModules.includes(w.module));

  const currentRolePermissions = editedSettings.role_permissions?.[selectedRole] || {
    navigation: [],
    dashboardWidgets: [],
  };

  const toggleNavItem = (itemId: string) => {
    const currentNav = currentRolePermissions.navigation || [];
    const updatedNav = currentNav.includes(itemId)
      ? currentNav.filter((id) => id !== itemId)
      : [...currentNav, itemId];
    setEditedSettings({
      ...editedSettings,
      role_permissions: {
        ...editedSettings.role_permissions,
        [selectedRole]: { ...currentRolePermissions, navigation: updatedNav },
      },
    });
  };

  const toggleWidget = (widgetId: string) => {
    const currentWidgets = currentRolePermissions.dashboardWidgets || [];
    const updatedWidgets = currentWidgets.includes(widgetId)
      ? currentWidgets.filter((id) => id !== widgetId)
      : [...currentWidgets, widgetId];
    setEditedSettings({
      ...editedSettings,
      role_permissions: {
        ...editedSettings.role_permissions,
        [selectedRole]: { ...currentRolePermissions, dashboardWidgets: updatedWidgets },
      },
    });
  };

  const tabs = [
    { id: 'overview' as TabType, name: 'Executive Overview', icon: TrendingUp },
    { id: 'roles' as TabType, name: 'Roles & Access', icon: Lock },
    {
      id: 'schools' as TabType,
      name: 'Schools Management',
      icon: ShieldCheck,
      superAdminOnly: true,
    },
    {
      id: 'analytics_strategic' as TabType,
      name: 'Strategic Analytics',
      icon: TrendingUp,
      superAdminOnly: true,
    },
    {
      id: 'governance' as TabType,
      name: 'Governance & Logs',
      icon: ShieldCheck,
      superAdminOnly: true,
    },
    { id: 'health' as TabType, name: 'System Health', icon: Database },
    {
      id: 'support_tickets' as TabType,
      name: 'Support Tickets',
      icon: LifeBuoy,
      superAdminOnly: true,
    },
    { id: 'marketing' as TabType, name: 'Email Marketing', icon: Mail, superAdminOnly: true },
    {
      id: 'platform_settings' as TabType,
      name: 'Platform Settings',
      icon: Settings,
      superAdminOnly: true,
    },
    {
      id: 'data_migration' as TabType,
      name: 'Data Migration',
      icon: Database,
      superAdminOnly: true,
    },
    { id: 'demo_requests' as TabType, name: 'Demo Requests', icon: Users, superAdminOnly: true },
  ].filter((t) => {
    if (t.superAdminOnly && user?.role !== 'SUPER_ADMIN') return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 px-6 pt-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {user?.role === 'SUPER_ADMIN' ? 'Platform overview' : 'Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {settings.current_session} · {settings.current_term}
          </p>
        </div>
        <nav className="-mx-1 overflow-x-auto px-1" aria-label="Dashboard sections">
          <div className="flex w-max gap-1 rounded-control bg-gray-100 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-card'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon size={16} />
                {tab.name}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Platform Announcements Banner */}
      {announcements.length > 0 && (
        <div className="space-y-4">
          {announcements.map((ann: any) => (
            <div
              key={ann.id}
              className={`p-4 rounded-2xl border flex items-start gap-4 shadow-sm animate-in slide-in-from-top-4 duration-500 overflow-hidden relative ${
                ann.priority === 'high'
                  ? 'bg-red-50 border-red-100 text-red-900'
                  : ann.priority === 'medium'
                    ? 'bg-amber-50 border-amber-100 text-amber-900'
                    : 'bg-brand-50 border-brand-100 text-brand-900'
              }`}
            >
              <div
                className={`p-2 rounded-xl scale-110 ${
                  ann.priority === 'high'
                    ? 'bg-red-100 text-red-600'
                    : ann.priority === 'medium'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-brand-100 text-brand-600'
                }`}
              >
                <Megaphone size={18} />
              </div>
              <div className="flex-1 pr-10">
                <h4 className="font-black uppercase tracking-tight text-sm mb-1 flex items-center gap-2">
                  {ann.title}
                  <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full">
                    Global Update
                  </span>
                </h4>
                <p className="text-sm font-medium opacity-80">{ann.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="px-6 pb-6">
          <AdminOverview
            allowedModules={allowedModules}
            quickActions={
              <QuickActions
                onChangeView={onChangeView || (() => {})}
                onTabChange={(tab: string) => setActiveTab(tab as TabType)}
                userRole={user?.role?.toLowerCase()}
                allowedModules={allowedModules}
              />
            }
          />
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <DashboardRolesTab
          editedSettings={editedSettings}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          roleLabels={roleLabels}
          allNavItems={allNavItems}
          allWidgets={allWidgets}
          currentRolePermissions={currentRolePermissions}
          toggleNavItem={toggleNavItem}
          toggleWidget={toggleWidget}
          handleSaveSettings={handleSaveSettings}
        />
      )}

      {/* Health Tab */}
      {activeTab === 'health' && <DashboardHealthTab systemHealthData={systemHealthData} />}

      {/* Schools Management Tab */}
      {activeTab === 'schools' && (
        <DashboardSchoolsTab
          schools={schools}
          onSelectSchool={(school) => {
            setSelectedSchool(school);
            setIsSchoolModalOpen(true);
          }}
        />
      )}

      {/* Strategic Analytics Tab */}
      {activeTab === 'analytics_strategic' && <StrategicAnalyticsTab data={user?.analyticsData} />}

      {/* Platform Governance Tab */}
      {activeTab === 'governance' && (
        <PlatformGovernanceTab
          activities={user?.governanceData?.activities || []}
          announcements={user?.governanceData?.announcements || []}
        />
      )}

      {/* Platform Settings Tab */}
      {activeTab === 'platform_settings' && (
        <DashboardPlatformSettingsTab
          editedPlatformSettings={editedPlatformSettings}
          setEditedPlatformSettings={setEditedPlatformSettings}
          handleSavePlatformSettings={handleSavePlatformSettings}
        />
      )}

      {/* Demo Requests Tab */}
      {activeTab === 'demo_requests' && <DashboardDemoRequestsTab />}

      {/* Email Marketing Tab */}
      {activeTab === 'marketing' && <EmailMarketingTab />}

      {/* Data Migration Tab */}
      {activeTab === 'data_migration' && <DataMigrationTab />}

      {/* Support Tickets Tab */}
      {activeTab === 'support_tickets' && <SupportTicketsTab tickets={supportTickets} />}

      {/* School Management Modal */}
      <SchoolManagementModal
        isOpen={isSchoolModalOpen}
        onClose={() => setIsSchoolModalOpen(false)}
        selectedSchool={selectedSchool}
        handleApproveSchool={handleApproveSchool}
        handleUpdateSchool={handleUpdateSchool}
      />
    </div>
  );
};
