'use client';

import React, { useState } from 'react';
import {
    ShieldCheck,
    Users,
    Globe,
    Database,
    AlertCircle,
    CheckCircle,
    Save,
    Eye,
    Trash2,
    Plus,
    Upload,
    Palette,
    Type,
    Image,
    FileText,
    Settings,
    Activity,
    ExternalLink,
    Lock,
    TrendingUp,
    Megaphone,
    Bell
} from 'lucide-react';
import { useSchoolStore } from '@/lib/store';
import { useUpdateSettings } from '@/lib/hooks/use-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/providers/toast-provider';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';

// Dashboard sub-components
import { DashboardStats } from './dashboard/DashboardStats';
import { FinanceChart } from './dashboard/FinanceChart';
import { QuickActions } from './dashboard/QuickActions';
import { StudentPopulation } from './dashboard/StudentPopulation';
import { RecentTransactions } from './dashboard/RecentTransactions';
import { AdvancedAnalytics } from './dashboard/AdvancedAnalytics';

type TabType = 'overview' | 'cms' | 'roles' | 'health';

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
    onChangeView?: (view: Types.ViewState) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
    user, students, teachers, staff, payments, expenses, fees, classes, settings, announcements = [], onChangeView
}) => {
    const { mutate: updateSettings } = useUpdateSettings();
    const setSettings = (newSettings: Types.Settings) => updateSettings(newSettings); // Adapter
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [editedSettings, setEditedSettings] = useState(settings);
    const [newFeature, setNewFeature] = useState('');
    const [selectedRole, setSelectedRole] = useState<Types.UserRole>('admin');
    const { addToast } = useToast();

    // Shared Calculations for Overview
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

    // Helper Functions for CMS & Settings
    const handleSaveSettings = () => {
        const updatedSettings = {
            ...editedSettings,
            updated_at: Date.now()
        };
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
            reader.onloadend = () => {
                handleChange(field, reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const features = (editedSettings.landing_features || '').split(',').map(f => f.trim()).filter(f => f);

    const addFeature = () => {
        if (newFeature.trim()) {
            const updatedFeatures = [...features, newFeature.trim()].join(', ');
            handleChange('landing_features', updatedFeatures);
            setNewFeature('');
        }
    };

    const removeFeature = (index: number) => {
        const updatedFeatures = features.filter((_, i) => i !== index).join(', ');
        handleChange('landing_features', updatedFeatures);
    };

    // Role Management Logic
    const roleLabels: Record<Types.UserRole, string> = {
        super_admin: 'Super Admin',
        admin: 'Admin',
        teacher: 'Teacher',
        student: 'Student',
        parent: 'Parent',
        staff: 'Staff'
    };

    const allowedModules = user?.subscription?.allowed_modules || [];

    const allNavItems = [
        { id: 'dashboard', name: 'Dashboard' },
        { id: 'students', name: 'Students' },
        { id: 'teachers', name: 'Teachers' },
        { id: 'staff', name: 'Non-Academic Staff' },
        { id: 'classes', name: 'Classes' },
        { id: 'grading', name: 'Grading' },
        { id: 'attendance', name: 'Attendance' },
        { id: 'bursary', name: 'Bursary' },
        { id: 'announcements', name: 'Announcements' },
        { id: 'calendar', name: 'Calendar' },
        { id: 'analytics', name: 'Analytics' },
        { id: 'id_cards', name: 'ID Cards' },
        { id: 'broadsheet', name: 'Broadsheet' },
        { id: 'data', name: 'System Data' },
        { id: 'settings', name: 'Settings' },
    ].filter(item => {
        // Dashboard and Settings are always available for Admins
        if (item.id === 'dashboard' || item.id === 'settings' || item.id === 'data') return true;
        // Check if module is allowed in plan
        return allowedModules.includes(item.id);
    });

    const allWidgets = [
        { id: 'stats', name: 'Quick Stats', module: 'students' },
        { id: 'finance_chart', name: 'Finance Chart', module: 'bursary' },
        { id: 'student_population', name: 'Student Population', module: 'students' },
        { id: 'quick_actions', name: 'Quick Actions' }, // Core
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
        const updatedNav = currentNav.includes(itemId)
            ? currentNav.filter(id => id !== itemId)
            : [...currentNav, itemId];

        setEditedSettings({
            ...editedSettings,
            role_permissions: {
                ...editedSettings.role_permissions,
                [selectedRole]: {
                    ...currentRolePermissions,
                    navigation: updatedNav
                }
            }
        });
    };

    const toggleWidget = (widgetId: string) => {
        const currentWidgets = currentRolePermissions.dashboardWidgets || [];
        const updatedWidgets = currentWidgets.includes(widgetId)
            ? currentWidgets.filter(id => id !== widgetId)
            : [...currentWidgets, widgetId];

        setEditedSettings({
            ...editedSettings,
            role_permissions: {
                ...editedSettings.role_permissions,
                [selectedRole]: {
                    ...currentRolePermissions,
                    dashboardWidgets: updatedWidgets
                }
            }
        });
    };

    // System Health Data
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
    ].filter(t => !t.module || allowedModules.includes(t.module));

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase">Executive Dashboard</h1>
                    <p className="text-gray-500 font-medium">Overview for {settings.current_session} • {settings.current_term}</p>
                </div>

                {/* Tabs Navigation */}
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

            {/* Overview Tab (Original Admin Dashboard) */}
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
                                <AdvancedAnalytics
                                    students={students}
                                    payments={payments}
                                    fees={fees}
                                    settings={settings}
                                />
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
                <div className="space-y-8">
                    {/* Save Bar */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-20">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center">
                                <Settings size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Landing Page CMS</h3>
                                <p className="text-xs text-gray-500">Edit your public school website</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <a
                                href="/"
                                target="_blank"
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                            >
                                <Eye size={16} /> Preview
                            </a>
                            <Button onClick={handleSaveSettings} className="flex items-center gap-2">
                                <Save size={16} /> Save Changes
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Hero Section */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Type size={18} className="text-brand-500" />
                                Hero Section
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Hero Title</label>
                                    <Input
                                        value={editedSettings.landing_hero_title}
                                        onChange={(e) => handleChange('landing_hero_title', e.target.value)}
                                        placeholder="Excellence in Education"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Hero Subtitle</label>
                                    <textarea
                                        value={editedSettings.landing_hero_subtitle}
                                        onChange={(e) => handleChange('landing_hero_subtitle', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                                        rows={3}
                                        placeholder="Nurturing the leaders of tomorrow..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">CTA Button Text</label>
                                    <Input
                                        value={editedSettings.landing_cta_text}
                                        onChange={(e) => handleChange('landing_cta_text', e.target.value)}
                                        placeholder="Start Your Journey"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Branding */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Palette size={18} className="text-brand-500" />
                                Branding & Media
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Primary Color</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="color"
                                            value={editedSettings.landing_primary_color}
                                            onChange={(e) => handleChange('landing_primary_color', e.target.value)}
                                            className="h-12 w-20 rounded-xl border-2 border-gray-200 cursor-pointer"
                                        />
                                        <Input
                                            value={editedSettings.landing_primary_color}
                                            onChange={(e) => handleChange('landing_primary_color', e.target.value)}
                                            placeholder="#16a34a"
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Hero Background Image</label>
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-brand-300 transition-colors">
                                        {editedSettings.landing_hero_image ? (
                                            <div className="relative">
                                                <img src={editedSettings.landing_hero_image} alt="Hero" className="h-32 w-full object-cover rounded-lg" />
                                                <button
                                                    onClick={() => handleChange('landing_hero_image', null)}
                                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer block py-6">
                                                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                                                <p className="text-sm text-gray-500">Click to upload hero image</p>
                                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'landing_hero_image')} className="hidden" />
                                            </label>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                    <input
                                        type="checkbox"
                                        id="showStats"
                                        checked={editedSettings.landing_show_stats}
                                        onChange={(e) => handleChange('landing_show_stats', e.target.checked)}
                                        className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                    />
                                    <label htmlFor="showStats" className="font-medium text-gray-700">Show Statistics Section</label>
                                </div>
                            </div>
                        </div>

                        {/* About Section */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <FileText size={18} className="text-brand-500" />
                                About Section
                            </h3>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">About Text</label>
                                <textarea
                                    value={editedSettings.landing_about_text}
                                    onChange={(e) => handleChange('landing_about_text', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                                    rows={6}
                                    placeholder="Tell visitors about your school..."
                                />
                            </div>
                        </div>

                        {/* Features Management */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <CheckCircle size={18} className="text-brand-500" />
                                School Features
                            </h3>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        value={newFeature}
                                        onChange={(e) => setNewFeature(e.target.value)}
                                        placeholder="Add a new feature..."
                                        onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                                    />
                                    <Button onClick={addFeature} className="shrink-0">
                                        <Plus size={18} />
                                    </Button>
                                </div>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {features.map((feature, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group">
                                            <span className="font-medium text-gray-700">{feature}</span>
                                            <button
                                                onClick={() => removeFeature(index)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {features.length === 0 && (
                                    <p className="text-center text-gray-400 py-8 italic">No features added yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Roles Tab */}
            {activeTab === 'roles' && (
                <div className="space-y-8">
                    {/* Save Bar */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between sticky top-4 z-20">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Roles & Permissions</h3>
                                <p className="text-xs text-gray-500">Configure access for each user role</p>
                            </div>
                        </div>
                        <Button onClick={handleSaveSettings} className="flex items-center gap-2">
                            <Save size={16} /> Save Changes
                        </Button>
                    </div>

                    {/* Role Selector */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Select Role to Configure</h3>
                        <div className="flex flex-wrap gap-3">
                            {(Object.keys(roleLabels) as Types.UserRole[]).map(role => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRole(role)}
                                    className={`px-5 py-3 rounded-xl font-bold transition-all ${selectedRole === role
                                        ? 'bg-purple-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {roleLabels[role]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Navigation Access */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Settings size={18} className="text-purple-500" />
                                Navigation Access
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Select which menu items this role can see
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {allNavItems.map(item => (
                                    <label
                                        key={item.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${currentRolePermissions.navigation?.includes(item.id)
                                            ? 'bg-purple-50 border-2 border-purple-200'
                                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={currentRolePermissions.navigation?.includes(item.id) || false}
                                            onChange={() => toggleNavItem(item.id)}
                                            className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="font-medium text-gray-700 text-sm">{item.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Dashboard Widgets */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Activity size={18} className="text-purple-500" />
                                Dashboard Widgets
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Select which widgets appear on this role's dashboard
                            </p>
                            <div className="grid grid-cols-1 gap-3">
                                {allWidgets.map(widget => (
                                    <label
                                        key={widget.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${currentRolePermissions.dashboardWidgets?.includes(widget.id)
                                            ? 'bg-purple-50 border-2 border-purple-200'
                                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={currentRolePermissions.dashboardWidgets?.includes(widget.id) || false}
                                            onChange={() => toggleWidget(widget.id)}
                                            className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="font-medium text-gray-700 text-sm">{widget.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Health Tab */}
            {activeTab === 'health' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Database size={18} className="text-brand-500" />
                            System Status
                        </h3>
                        <div className="space-y-4">
                            {systemHealth.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <span className="font-medium text-gray-700">{item.name}</span>
                                    <span className={`text-sm font-bold flex items-center gap-2 ${item.ok ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {item.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Activity size={18} className="text-brand-500" />
                            Data Summary
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                                <span className="font-medium text-gray-700">Students</span>
                                <span className="text-lg font-bold text-blue-600">{students.length}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                                <span className="font-medium text-gray-700">Teachers</span>
                                <span className="text-lg font-bold text-green-600">{teachers.length}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                                <span className="font-medium text-gray-700">Non-Academic Staff</span>
                                <span className="text-lg font-bold text-amber-600">{staff.length}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                                <span className="font-medium text-gray-700">Classes</span>
                                <span className="text-lg font-bold text-purple-600">{classes.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
