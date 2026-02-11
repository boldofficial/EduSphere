'use client';

import React, { useState } from 'react';
import {
    ShieldCheck,
    Users,
    Globe,
    Database,
    Settings,
    Lock,
    TrendingUp,
    Megaphone,
} from 'lucide-react';
import { useUpdateSettings } from '@/lib/hooks/use-data';
import { useToast } from '@/components/providers/toast-provider';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';
import apiClient from '@/lib/api-client';

// Dashboard sub-components (overview widgets)
import { DashboardStats } from './dashboard/DashboardStats';
import { FinanceChart } from './dashboard/FinanceChart';
import { QuickActions } from './dashboard/QuickActions';
import { StudentPopulation } from './dashboard/StudentPopulation';
import { RecentTransactions } from './dashboard/RecentTransactions';
import { AdvancedAnalytics } from './dashboard/AdvancedAnalytics';

// Dashboard tab components
import { DashboardCmsTab } from './dashboard/DashboardCmsTab';
import { DashboardRolesTab } from './dashboard/DashboardRolesTab';
import {
    DashboardHealthTab,
    DashboardSchoolsTab,
    DashboardPlatformSettingsTab,
    SchoolManagementModal
} from './dashboard/DashboardAdminTabs';

type TabType = 'overview' | 'cms' | 'roles' | 'health' | 'schools' | 'platform_settings';

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
}

interface DashboardViewProps {
    user?: UserProfile;
    students: Types.Student[];
    teachers: Types.Teacher[];
    staff: Types.Staff[];
    payments: Types.Payment[];
    expenses: Types.Expense[];
    fees: Types.FeeStructure[];
    classes: Types.Class[];
    settings: Types.Settings;
    announcements?: any[];
    schools?: any[];
    platformSettings?: any;
    onChangeView?: (view: Types.ViewState) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
    user, students, teachers, staff, payments, expenses, fees, classes, settings, announcements = [], schools = [], platformSettings: initialPlatformSettings, onChangeView
}) => {
    const { mutate: updateSettings } = useUpdateSettings();
    const setSettings = (newSettings: Types.Settings) => updateSettings(newSettings);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [editedSettings, setEditedSettings] = useState(settings);
    const [newFeature, setNewFeature] = useState('');
    const [selectedRole, setSelectedRole] = useState<Types.UserRole>('admin');
    const [editedPlatformSettings, setEditedPlatformSettings] = useState(initialPlatformSettings);
    const [selectedSchool, setSelectedSchool] = useState<any>(null);
    const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
    const { addToast } = useToast();

    // ─── Shared Calculations ────────────────────────────────────────────
    const currentSessionPayments = payments.filter(p => p.session === settings.current_session && p.term === settings.current_term);
    const totalRevenue = currentSessionPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const currentSessionExpenses = expenses.filter(e => e.session === settings.current_session && e.term === settings.current_term);
    const totalExpenses = currentSessionExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    let totalExpectedRevenue = 0;
    const safeStudents = Array.isArray(students) ? students : [];
    safeStudents.forEach(s => {
        const { totalBill } = Utils.getStudentBalance(s, fees, [], settings.current_session, settings.current_term);
        totalExpectedRevenue += (Number(totalBill) || 0);
    });

    // ─── Handlers ───────────────────────────────────────────────────────
    const handleSaveSettings = () => {
        const updatedSettings = { ...editedSettings, updated_at: Date.now() };
        setSettings(updatedSettings);
        Utils.saveToStorage(Utils.STORAGE_KEYS.SETTINGS, updatedSettings);
        addToast('System settings saved successfully!', 'success');
    };

    const handleChange = (field: keyof typeof settings, value: any) => {
        setEditedSettings({ ...editedSettings, [field]: value });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof settings) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => handleChange(field, reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const features = (editedSettings.landing_features || '').split(',').map(f => f.trim()).filter(f => f);
    const addFeature = () => {
        if (newFeature.trim()) {
            handleChange('landing_features', [...features, newFeature.trim()].join(', '));
            setNewFeature('');
        }
    };
    const removeFeature = (index: number) => {
        handleChange('landing_features', features.filter((_, i) => i !== index).join(', '));
    };

    // Super Admin Actions
    const handleApproveSchool = async (schoolId: number) => {
        try {
            await apiClient.patch(`/schools/management/${schoolId}/`, { action: 'approve' });
            addToast('School approved and activated!', 'success');
            window.location.reload();
        } catch { addToast('Approval failed', 'error'); }
    };

    const handleSavePlatformSettings = async () => {
        try {
            await apiClient.put('/schools/platform-settings/', editedPlatformSettings);
            addToast('Platform settings updated!', 'success');
        } catch { addToast('Update failed', 'error'); }
    };

    const handleUpdateSchool = async (schoolId: number, data: any) => {
        try {
            await apiClient.put(`/schools/management/${schoolId}/`, data);
            addToast('School details updated!', 'success');
            window.location.reload();
        } catch { addToast('Update failed', 'error'); }
    };

    // ─── Role Management Data ───────────────────────────────────────────
    const roleLabels: Record<Types.UserRole, string> = {
        super_admin: 'Super Admin', admin: 'Admin', teacher: 'Teacher',
        student: 'Student', parent: 'Parent', staff: 'Staff'
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
    ].filter(item => {
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
    ].filter(w => !w.module || allowedModules.includes(w.module));

    const currentRolePermissions = editedSettings.role_permissions?.[selectedRole] || { navigation: [], dashboardWidgets: [] };

    const toggleNavItem = (itemId: string) => {
        const currentNav = currentRolePermissions.navigation || [];
        const updatedNav = currentNav.includes(itemId) ? currentNav.filter(id => id !== itemId) : [...currentNav, itemId];
        setEditedSettings({
            ...editedSettings,
            role_permissions: { ...editedSettings.role_permissions, [selectedRole]: { ...currentRolePermissions, navigation: updatedNav } }
        });
    };

    const toggleWidget = (widgetId: string) => {
        const currentWidgets = currentRolePermissions.dashboardWidgets || [];
        const updatedWidgets = currentWidgets.includes(widgetId) ? currentWidgets.filter(id => id !== widgetId) : [...currentWidgets, widgetId];
        setEditedSettings({
            ...editedSettings,
            role_permissions: { ...editedSettings.role_permissions, [selectedRole]: { ...currentRolePermissions, dashboardWidgets: updatedWidgets } }
        });
    };

    // ─── System Health Data ─────────────────────────────────────────────
    const systemHealth = [
        { name: 'Database Status', status: 'Healthy', ok: true },
        { name: 'Storage Usage', status: typeof window !== 'undefined' ? `${Math.round((JSON.stringify(localStorage).length / 5242880) * 100)}% Used` : 'N/A', ok: true },
        { name: 'Last Activity', status: new Date().toLocaleDateString(), ok: true },
    ];

    const tabs = [
        { id: 'overview' as TabType, name: 'Executive Overview', icon: TrendingUp },
        { id: 'cms' as TabType, name: 'Website CMS', icon: Globe, module: 'cms' },
        { id: 'roles' as TabType, name: 'Roles & Access', icon: Lock },
        { id: 'health' as TabType, name: 'System Health', icon: Database },
        { id: 'schools' as TabType, name: 'Schools Management', icon: ShieldCheck, superAdminOnly: true },
        { id: 'platform_settings' as TabType, name: 'Platform Settings', icon: Settings, superAdminOnly: true },
    ].filter(t => {
        if (t.superAdminOnly && user?.role !== 'SUPER_ADMIN') return false;
        return !t.module || allowedModules.includes(t.module);
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase">Executive Dashboard</h1>
                    <p className="text-gray-500 font-medium">Overview for {settings.current_session} • {settings.current_term}</p>
                </div>
                <div className="w-full md:w-auto overflow-x-auto scrollbar-hide -mx-1 px-1">
                    <div className="flex bg-gray-100 p-1 rounded-xl w-max min-w-full md:min-w-0">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-white shadow text-gray-900'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Platform Announcements Banner */}
            {announcements.length > 0 && (
                <div className="space-y-4">
                    {announcements.map((ann: any) => (
                        <div
                            key={ann.id}
                            className={`p-4 rounded-2xl border flex items-start gap-4 shadow-sm animate-in slide-in-from-top-4 duration-500 overflow-hidden relative ${ann.priority === 'high' ? 'bg-rose-50 border-rose-100 text-rose-900' :
                                ann.priority === 'medium' ? 'bg-amber-50 border-amber-100 text-amber-900' :
                                    'bg-brand-50 border-brand-100 text-brand-900'
                                }`}
                        >
                            <div className={`p-2 rounded-xl scale-110 ${ann.priority === 'high' ? 'bg-rose-100 text-rose-600' :
                                ann.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                                    'bg-brand-100 text-brand-600'
                                }`}>
                                <Megaphone size={18} />
                            </div>
                            <div className="flex-1 pr-10">
                                <h4 className="font-black uppercase tracking-tight text-sm mb-1 flex items-center gap-2">
                                    {ann.title}
                                    <span className="text-[10px] bg-white/50 px-2 py-0.5 rounded-full">Global Update</span>
                                </h4>
                                <p className="text-sm font-medium opacity-80">{ann.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-8">
                    <DashboardStats
                        studentsCount={students.length}
                        staffCount={teachers.length + staff.length}
                        revenue={totalRevenue}
                        expenses={totalExpenses}
                        targetRevenue={totalExpectedRevenue}
                        transactionsCount={currentSessionExpenses.length}
                        allowedModules={allowedModules}
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {allowedModules.includes('bursary') && <FinanceChart revenue={totalRevenue} expenses={totalExpenses} />}
                            {allowedModules.includes('bursary') && (
                                <AdvancedAnalytics students={students} payments={payments} fees={fees} settings={settings} />
                            )}
                            <QuickActions onChangeView={onChangeView || (() => { })} allowedModules={allowedModules} />
                        </div>
                        <div className="space-y-6">
                            {allowedModules.includes('students') && <StudentPopulation students={students} />}
                            {allowedModules.includes('bursary') && <RecentTransactions payments={payments} students={students} />}
                        </div>
                    </div>
                </div>
            )}

            {/* CMS Tab */}
            {activeTab === 'cms' && (
                <DashboardCmsTab
                    editedSettings={editedSettings}
                    handleChange={handleChange}
                    handleSaveSettings={handleSaveSettings}
                    handleImageUpload={handleImageUpload}
                    features={features}
                    newFeature={newFeature}
                    setNewFeature={setNewFeature}
                    addFeature={addFeature}
                    removeFeature={removeFeature}
                />
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
            {activeTab === 'health' && (
                <DashboardHealthTab
                    systemHealth={systemHealth}
                    students={students}
                    teachers={teachers}
                    staff={staff}
                    classes={classes}
                />
            )}

            {/* Schools Management Tab */}
            {activeTab === 'schools' && (
                <DashboardSchoolsTab
                    schools={schools}
                    onSelectSchool={(school) => { setSelectedSchool(school); setIsSchoolModalOpen(true); }}
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
