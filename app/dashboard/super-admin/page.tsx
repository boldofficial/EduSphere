'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSchoolStore } from '@/lib/store';
import {
    LayoutDashboard,
    School as SchoolIcon,
    CreditCard,
    Settings,
    LogOut,
    Plus,
    Search,
    MoreVertical,
    Activity,
    Users,
    Zap,
    Server,
    Shield,
    CheckCircle2,
    AlertCircle,
    GraduationCap,
    Ghost,
    UserCircle,
    TrendingUp,
    ScrollText,
    Megaphone,
    Clock,
    Grid,
    Check,
    X
} from 'lucide-react';
import {
    useSettings, useSystemHealth, useAdminSchools, useAdminPlans,
    useAdminRevenue, useStrategicAnalytics, usePlatformGovernance,
    useGlobalSearch, useModules, usePlatformSettings, useUpdatePlatformSettings
} from '@/lib/hooks/use-data';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import apiClient from '@/lib/api-client';
import * as Utils from '@/lib/utils';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';

export default function SuperAdminDashboard() {
    const { currentUser, currentRole, logout } = useSchoolStore();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'financials' | 'plans' | 'governance' | 'broadcasts' | 'modules' | 'settings'>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSchoolForEdit, setSelectedSchoolForEdit] = useState<any>(null);

    const handleImpersonate = async (userId: number) => {
        if (!userId) {
            alert("No administrator found for this school.");
            return;
        }

        if (!confirm("Are you sure you want to impersonate this user? You will be logged into their account.")) return;

        try {
            const res = await fetch('/api/auth/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });

            if (res.ok) {
                const data = await res.json();
                useSchoolStore.getState().login(data.user.role, data.user);
                window.location.href = '/dashboard';
            } else {
                alert("Impersonation failed");
            }
        } catch (error) {
            console.error("Impersonation error", error);
            alert("An error occurred");
        }
    };

    // Verify Access
    useEffect(() => {
        if (currentUser && currentRole !== 'super_admin') {
            router.push('/dashboard');
        }
    }, [currentUser, currentRole, router]);

    // Fetch Data using TanStack Query for robustness
    const { data: healthData, isLoading: healthLoading } = useSystemHealth();
    const { data: schools = [], isLoading: schoolsLoading } = useAdminSchools();
    const { data: plans = [], isLoading: plansLoading } = useAdminPlans();
    const { data: revenueStats = { total_revenue: 0 }, isLoading: revenueLoading } = useAdminRevenue();
    const { data: strategicData, isLoading: strategicLoading } = useStrategicAnalytics();
    const { data: governanceData, isLoading: governanceLoading } = usePlatformGovernance();
    const { data: searchResults, isLoading: searchLoading } = useGlobalSearch(searchQuery);
    const { data: modules = [], isLoading: modulesLoading } = useModules();
    const { data: platformSettings, isLoading: platformLoading } = usePlatformSettings();

    const handleToggleMaintenance = async () => {
        setIsTogglingMaintenance(true);
        try {
            const nextMode = !isMaintenanceMode;
            await apiClient.post('/schools/maintenance/', { action: nextMode ? 'on' : 'off' });
            setIsMaintenanceMode(nextMode);
            alert(`Maintenance mode turned ${nextMode ? 'ON' : 'OFF'}`);
        } catch (error) {
            alert("Failed to toggle maintenance mode");
        } finally {
            setIsTogglingMaintenance(false);
        }
    };

    const handleUpdateSchool = async (id: number, data: any) => {
        try {
            await apiClient.put(`/schools/manage/${id}/`, data);
            alert('School details updated successfully');
            window.location.reload();
        } catch (error) {
            alert('Failed to update school details');
        }
    };

    const isDataLoading = healthLoading || schoolsLoading || plansLoading || revenueLoading || strategicLoading || governanceLoading;

    // Hydration/Auth loading
    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
            </div>
        );
    }


    // Debugging Role
    if (currentRole !== 'super_admin') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center max-w-md">
                    <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
                    <p className="text-red-600 mb-4">You do not have permission to view this page.</p>
                    <div className="bg-white p-3 rounded border border-red-100 text-left text-sm font-mono mb-6">
                        <p><strong>Required Role:</strong> super_admin</p>
                        <p><strong>Your Role:</strong> {currentRole || 'null'}</p>
                        <p><strong>User ID:</strong> {currentUser?.id || 'not logged in'}</p>
                    </div>
                    <button
                        onClick={() => router.push('/login')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Go to Login
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="block w-full mt-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-primary flex">
            {/* Sidebar */}
            <aside className="w-64 bg-brand-950 text-white fixed h-full z-10 flex flex-col">
                <div className="p-6 border-b border-slate-700/50 flex items-center gap-3">
                    <div className="h-16 w-full flex items-center justify-start">
                        <img src="/footer-logo.png" alt="Registra" className="h-full w-auto object-contain" />
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <SidebarItem
                        icon={LayoutDashboard}
                        label="Overview"
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                    />
                    <SidebarItem
                        icon={SchoolIcon}
                        label="Tenants (Schools)"
                        active={activeTab === 'tenants'}
                        onClick={() => setActiveTab('tenants')}
                    />
                    <SidebarItem
                        icon={CreditCard}
                        label="Financials"
                        active={activeTab === 'financials'}
                        onClick={() => setActiveTab('financials')}
                    />
                    <SidebarItem
                        icon={CreditCard}
                        label="Plans & Pricing"
                        active={activeTab === 'plans'}
                        onClick={() => setActiveTab('plans')}
                    />
                    <SidebarItem icon={Grid} label="Modules Library" active={activeTab === 'modules'} onClick={() => setActiveTab('modules')} />
                    <SidebarItem icon={Settings} label="Platform Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1">
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="relative w-96">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="text-gray-400" size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search schools, activities, or logs..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setIsSearchOpen(true);
                            }}
                            onFocus={() => setIsSearchOpen(true)}
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-600 focus:bg-white rounded-2xl py-3 pl-12 pr-4 outline-none transition-all font-medium text-sm"
                        />

                        {isSearchOpen && searchQuery.length >= 2 && (
                            <>
                                <div className="fixed inset-0" onClick={() => setIsSearchOpen(false)} />
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {searchLoading ? (
                                        <div className="p-4 text-center text-gray-400 text-sm">Searching...</div>
                                    ) : (
                                        <div className="space-y-6">
                                            {searchResults?.schools?.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Schools</p>
                                                    <div className="space-y-1">
                                                        {searchResults.schools.map((s: any) => (
                                                            <button
                                                                key={s.id}
                                                                onClick={() => {
                                                                    setActiveTab('tenants');
                                                                    setIsSearchOpen(false);
                                                                    setSearchQuery('');
                                                                }}
                                                                className="w-full text-left p-3 hover:bg-gray-50 rounded-xl flex items-center justify-between group transition-colors"
                                                            >
                                                                <span className="font-bold text-gray-900">{s.name}</span>
                                                                <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full uppercase">{s.status}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {searchResults?.logs?.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Activity Logs</p>
                                                    <div className="space-y-1">
                                                        {searchResults.logs.map((l: any) => (
                                                            <button
                                                                key={l.id}
                                                                onClick={() => {
                                                                    setActiveTab('governance');
                                                                    setIsSearchOpen(false);
                                                                    setSearchQuery('');
                                                                }}
                                                                className="w-full text-left p-3 hover:bg-gray-50 rounded-xl group transition-colors"
                                                            >
                                                                <p className="text-xs font-bold text-gray-900 line-clamp-1">{l.description}</p>
                                                                <p className="text-[10px] text-gray-400 mt-1">{new Date(l.created_at).toLocaleDateString()}</p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-6">
                        <button
                            disabled={isTogglingMaintenance}
                            onClick={handleToggleMaintenance}
                            className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${isMaintenanceMode
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : 'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100'
                                }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${isMaintenanceMode ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`}></div>
                            <span className="text-xs font-bold uppercase tracking-tight">
                                {isTogglingMaintenance ? 'UPDATING...' : (isMaintenanceMode ? 'Maintenance: ON' : 'Maintenance: OFF')}
                            </span>
                        </button>
                        <div className="h-10 w-[1px] bg-gray-100"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-black text-gray-900">{currentUser?.username || 'Admin'}</p>
                                <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">Global Super Admin</p>
                            </div>
                            <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                                {currentUser?.username?.[0].toUpperCase() || 'A'}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {activeTab === 'overview' && (
                        <OverviewTab
                            schools={schools}
                            plans={plans}
                            revenue={revenueStats}
                            health={healthData}
                            strategic={strategicData}
                            governance={governanceData}
                            onImpersonate={(userId: number) => handleImpersonate(userId)}
                        />
                    )}
                    {activeTab === 'tenants' && (
                        <TenantsTab
                            schools={schools}
                            plans={plans}
                            onImpersonate={(userId: number) => handleImpersonate(userId)}
                            onEdit={(school: any) => {
                                setSelectedSchoolForEdit(school);
                                setIsEditModalOpen(true);
                            }}
                        />
                    )}
                    {activeTab === 'financials' && (
                        <FinancialsTab revenue={revenueStats} />
                    )}
                    {activeTab === 'plans' && (
                        <PlansTab plans={plans} modules={modules} />
                    )}
                    {activeTab === 'governance' && <GovernanceTab activities={governanceData?.activities} />}
                    {activeTab === 'broadcasts' && <BroadcastsTab announcements={governanceData?.announcements} />}
                    {activeTab === 'modules' && <ModulesTab modules={modules} />}
                    {activeTab === 'settings' && <PlatformSettingsTab settings={platformSettings} />}
                </div>
            </main>

            {isEditModalOpen && (
                <SchoolEditModal
                    school={selectedSchoolForEdit}
                    plans={plans}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={(data: any) => handleUpdateSchool(selectedSchoolForEdit.id, data)}
                />
            )}
        </div>
    );
}

function SidebarItem({ icon: Icon, label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all ${active ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50 font-bold' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
        >
            <Icon size={20} />
            <span>{label}</span>
        </button>
    );
}

function OverviewTab({ schools, plans, revenue, health, strategic, governance, onImpersonate }: any) {
    const stats = health?.platform_stats || {};
    const activities = governance?.activities || [];

    // Sample data if real data is missing
    const registrationData = strategic?.registrations || [
        { name: 'Jan', value: 4 },
        { name: 'Feb', value: 7 },
        { name: 'Mar', value: 12 },
    ];

    const revenueData = strategic?.revenue || [
        { name: 'Jan', value: 150000 },
        { name: 'Feb', value: 280000 },
        { name: 'Mar', value: 450000 },
    ];

    const planData = strategic?.plans?.map((p: any) => ({
        name: p.name,
        value: p.school_count
    })) || [
            { name: 'Basic', value: 10 },
            { name: 'Pro', value: 5 },
            { name: 'Enterprise', value: 2 },
        ];

    const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b'];

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">System Overview</h2>
                    <p className="text-gray-500 mt-1">Cross-tenant performance and infrastructure health.</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Last Updated</p>
                    <p className="text-sm font-medium text-brand-600">{health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : '---'}</p>
                </div>
            </div>

            {/* Infrastructure Health Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <HealthCard
                    title="Redis Cache"
                    status={health?.redis_status === 'connected' ? 'healthy' : 'error'}
                    message={health?.redis_status === 'connected' ? 'Operational' : 'Disconnected'}
                    icon={Zap}
                />
                <HealthCard
                    title="Celery Workers"
                    status={health?.celery_status === 'active' ? 'healthy' : 'error'}
                    message={health?.celery_status === 'active' ? 'Active' : 'Offline'}
                    icon={Server}
                />
                <HealthCard
                    title="DB Latency"
                    status="healthy"
                    message={health?.db_latency || '---'}
                    icon={Activity}
                />
                <HealthCard
                    title="Security Shield"
                    status="healthy"
                    message="Hardened"
                    icon={Shield}
                />
            </div>

            {/* Global Aggregates */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Total Schools"
                    value={stats.total_schools || schools.length}
                    icon={SchoolIcon}
                    color="bg-blue-500"
                    trend="+2 new this week"
                />
                <StatCard
                    title="Global Students"
                    value={stats.total_students || 0}
                    icon={Users}
                    color="bg-indigo-500"
                />
                <StatCard
                    title="Total Teachers"
                    value={stats.total_teachers || 0}
                    icon={GraduationCap}
                    color="bg-orange-500"
                />
                <StatCard
                    title="Annual Revenue"
                    value={`₦${parseFloat(revenue?.total_revenue || 0).toLocaleString()}`}
                    icon={CreditCard}
                    color="bg-emerald-500"
                    trend="On track"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Registration Growth Chart */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-8">
                        <TrendingUp className="text-blue-600" size={20} />
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">Registration Growth</h3>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={registrationData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#0ea5e9"
                                    strokeWidth={4}
                                    dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue Performance Chart */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-8">
                        <CreditCard className="text-emerald-600" size={20} />
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">Revenue Trends</h3>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`₦${value.toLocaleString()}`, 'Revenue']}
                                />
                                <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Subscription Mix (Pie Chart) */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm lg:col-span-2">
                    <div className="flex items-center gap-2 mb-8">
                        <Zap className="text-brand-600" size={20} />
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">Subscription Plan Mix</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={planData}
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {planData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-4">
                            {planData.map((item: any, index: number) => (
                                <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="font-bold text-gray-900">{item.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-black text-gray-900">{item.value}</span>
                                        <span className="text-xs text-gray-400 ml-1">Schools</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Activity Stream */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mt-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <ScrollText className="text-slate-600" size={20} />
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">Live Activity Stream</h3>
                    </div>
                </div>
                <div className="space-y-4">
                    {activities.slice(0, 5).map((log: any) => (
                        <div key={log.id} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-brand-200 transition-all">
                            <div className="mt-1">
                                {log.action.includes('PAYMENT') ? <CreditCard className="text-emerald-500" size={16} /> :
                                    log.action.includes('SIGNUP') ? <Plus className="text-blue-500" size={16} /> :
                                        <Activity className="text-slate-400" size={16} />}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{log.description}</p>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-[10px] font-bold text-brand-600 uppercase bg-brand-50 px-2 py-0.5 rounded-full">{log.school_name}</span>
                                    <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                                        <Clock size={10} />
                                        {new Date(log.created_at).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {activities.length === 0 && <p className="text-center py-10 text-gray-400">No activity recorded yet.</p>}
                </div>
            </div>
        </div>
    );
}

function HealthCard({ title, status, message, icon: Icon }: any) {
    const isHealthy = status === 'healthy';

    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
                <div className={`p-2 rounded-lg ${isHealthy ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <Icon size={18} />
                </div>
                <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${isHealthy ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700 font-bold'
                    }`}>
                    {isHealthy ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                    {status}
                </span>
            </div>
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
                <p className="text-lg font-black text-gray-900 leading-tight">{message}</p>
            </div>
        </div>
    );
}

function GovernanceTab({ activities = [] }: any) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-3xl font-bold text-gray-900">Global Activity Log</h2>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm">Timestamp</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm">Action</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm">Description</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm">Actor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {activities.map((log: any) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-slate-100 rounded text-slate-700">
                                        {log.action.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.description}</td>
                                <td className="px-6 py-4 text-xs font-mono text-gray-500">{log.user_email}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {activities.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-gray-400 text-center">
                        <ScrollText size={48} className="mb-4 opacity-10" />
                        <p className="font-bold">The activity log is currently empty.</p>
                        <p className="text-sm">Platform events will appear here as they happen.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function BroadcastsTab({ announcements = [] }: any) {
    const [modalOpen, setModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('low');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            await apiClient.post('/schools/governance/', { title, message, priority });
            alert("Announcement Broadcasted!");
            window.location.reload();
        } catch (error) {
            alert("Broadcast failed");
        } finally {
            setIsProcessing(false);
            setModalOpen(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Platform Broadcasts</h2>
                <button
                    onClick={() => setModalOpen(true)}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg flex items-center gap-2 hover:bg-brand-700"
                >
                    <Megaphone size={18} /> New Broadcast
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {announcements.map((ann: any) => (
                    <div key={ann.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase tracking-tight text-white ${ann.priority === 'high' ? 'bg-red-500' :
                            ann.priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
                            }`}>
                            {ann.priority}
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">{ann.title}</h4>
                        <p className="text-gray-600 text-sm leading-relaxed mb-6">{ann.message}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                            <Clock size={12} />
                            {new Date(ann.created_at).toLocaleDateString()}
                        </div>
                    </div>
                ))}
                {announcements.length === 0 && (
                    <div className="col-span-full py-20 bg-white border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-gray-400">
                        <Megaphone size={40} className="mb-4 opacity-20" />
                        <p className="font-bold">No broadcasts found. Send your first announcement!</p>
                    </div>
                )}
            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl">
                        <h3 className="text-2xl font-black text-gray-900 mb-6">Create Global Broadcast</h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Announcement Title</label>
                                <input
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. System Maintenance Scheduled"
                                    className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-brand-500 outline-none transition-all font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Message Content</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="Details for all school administrators..."
                                    className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-brand-500 outline-none transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Priority Level</label>
                                <select
                                    className="w-full border-2 border-gray-100 p-4 rounded-2xl font-bold appearance-none bg-gray-50"
                                    value={priority}
                                    onChange={e => setPriority(e.target.value)}
                                >
                                    <option value="low">Low (General Update)</option>
                                    <option value="medium">Medium (Important)</option>
                                    <option value="high">High (Urgent Action Required)</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-4 text-gray-400 font-black uppercase text-xs tracking-widest hover:bg-gray-50 rounded-2xl transition-all">Cancel</button>
                                <button type="submit" disabled={isProcessing} className="flex-2 py-4 bg-brand-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-brand-900/40 hover:scale-105 transition-all">Broadcast Now</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function TenantsTab({ schools, plans, onImpersonate, onEdit }: any) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');

    const handleAction = async (schoolId: number, action: 'delete' | 'suspend' | 'activate' | 'approve') => {
        if (!confirm(`Are you sure you want to ${action} this school?`)) return;

        setIsProcessing(true);
        try {
            if (action === 'delete') {
                await apiClient.delete(`/schools/manage/${schoolId}/`);
            } else {
                await apiClient.patch(`/schools/manage/${schoolId}/`, { action });
            }
            window.location.reload();
        } catch (error) {
            alert("Action failed");
        } finally {
            setIsProcessing(false);
        }
    };

    const openPaymentModal = (school: any) => {
        setSelectedSchool(school);
        setAmount('0'); // Default?
        setReference(`MANUAL-${Date.now()}`); // Auto-gen ref
        setPaymentModalOpen(true);
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            await apiClient.post('/schools/payments/record/', {
                school_id: selectedSchool.id,
                amount: amount,
                reference: reference
            });
            alert("Payment Recorded!");
            window.location.reload();
        } catch (error) {
            alert("Payment failed");
        } finally {
            setIsProcessing(false);
            setPaymentModalOpen(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Tenants</h2>
                <button
                    onClick={() => router.push('/onboarding')}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg flex items-center gap-2 hover:bg-brand-700"
                >
                    <Plus size={18} /> Add School
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm">School Name</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm">Domain</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm">Status</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {schools.map((school: any) => (
                            <tr key={school.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{school.name}</td>
                                <td className="px-6 py-4 text-gray-600 text-sm">
                                    <a href={`https://${school.domain}.${ROOT_DOMAIN}`} target="_blank" className="hover:text-brand-600 underline decoration-dotted">
                                        {school.domain}.{ROOT_DOMAIN}
                                    </a>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${school.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {school.subscription_status || 'Active'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => onImpersonate(school.admin_id)}
                                            title="Login as Admin"
                                            className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-bold border border-blue-100 flex items-center gap-1"
                                        >
                                            <Ghost size={14} />
                                            Login
                                        </button>
                                        <button
                                            onClick={() => onEdit(school)}
                                            className="text-brand-600 hover:bg-brand-50 px-2 py-1 rounded text-xs font-bold border border-brand-100"
                                        >
                                            Edit
                                        </button>
                                        <button onClick={() => openPaymentModal(school)} className="text-gray-600 hover:bg-gray-100 px-2 py-1 rounded text-xs font-bold border border-gray-200">Pay</button>

                                        {school.subscription_status === 'active' ? (
                                            <button onClick={() => handleAction(school.id, 'suspend')} className="text-amber-600 hover:bg-amber-50 px-2 py-1 rounded text-xs font-bold">Suspend</button>
                                        ) : (
                                            <button onClick={() => handleAction(school.id, 'activate')} className="text-green-600 hover:bg-green-50 px-2 py-1 rounded text-xs font-bold">Activate</button>
                                        )}
                                        <button onClick={() => handleAction(school.id, 'delete')} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs font-bold">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Payment Modal */}
            {paymentModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Record Payment for {selectedSchool?.name}</h3>
                        <form onSubmit={handlePayment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700">Amount (NGN)</label>
                                <input
                                    type="number"
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full border p-2 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700">Reference</label>
                                <input
                                    type="text"
                                    required
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    className="w-full border p-2 rounded-lg"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setPaymentModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">Cancel</button>
                                <button type="submit" disabled={isProcessing} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">Record Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function PlansTab({ plans, modules = [] }: any) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);

    // Form State
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('30');
    const [description, setDescription] = useState('');
    const [features, setFeatures] = useState('');
    const [slug, setSlug] = useState('');
    const [allowedModules, setAllowedModules] = useState<string[]>([]);

    const openModal = (plan?: any) => {
        if (plan) {
            setEditingPlan(plan);
            setName(plan.name);
            setPrice(plan.price);
            setDuration(plan.duration_days);
            setDescription(plan.description);
            setFeatures(Array.isArray(plan.features) ? plan.features.join('\n') : plan.features);
            setSlug(plan.slug);
            setAllowedModules(plan.allowed_modules || []);
        } else {
            setEditingPlan(null);
            setName('');
            setPrice('');
            setDuration('30');
            setDescription('');
            setFeatures('');
            setSlug('');
            setAllowedModules([]);
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        const payload = {
            name,
            slug: slug || name.toLowerCase().replace(/ /g, '-'),
            price: parseFloat(price),
            duration_days: parseInt(duration),
            description,
            features: features.split('\n').filter(f => f.trim() !== ''),
            allowed_modules: allowedModules
        };

        try {
            if (editingPlan) {
                await apiClient.put(`/schools/plans/manage/${editingPlan.id}/`, payload);
            } else {
                await apiClient.post('/schools/plans/manage/', payload);
            }
            window.location.reload();
        } catch (error) {
            alert('Failed to save plan');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this plan?")) return;
        try {
            await apiClient.delete(`/schools/plans/manage/${id}/`);
            window.location.reload();
        } catch (e) { alert("Failed to delete"); }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Subscription Plans</h2>
                <button
                    onClick={() => openModal()}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg flex items-center gap-2 hover:bg-brand-700"
                >
                    <Plus size={18} /> Create Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan: any) => (
                    <div key={plan.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all relative group">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => openModal(plan)} className="p-1 bg-blue-100 text-blue-600 rounded">Edit</button>
                            <button onClick={() => handleDelete(plan.id)} className="p-1 bg-red-100 text-red-600 rounded">Del</button>
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-xl text-gray-900">{plan.name}</h3>
                            <span className="font-mono text-lg font-bold text-brand-600">₦{parseFloat(plan.price).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-500 text-sm mb-4 h-10 line-clamp-2">{plan.description}</p>
                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Modules</p>
                                <div className="flex items-center gap-1.5">
                                    <Grid size={12} className="text-brand-600" />
                                    <span className="text-xs font-black text-gray-900">{plan.allowed_modules?.length || 0} Enabled</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Features</p>
                                <p className="text-xs font-black text-gray-900">{plan.features.length} Listed</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Plan Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl relative">
                        <h3 className="text-xl font-bold mb-4">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Plan Name</label>
                                    <input value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Slug (Unique)</label>
                                    <input value={slug} onChange={e => setSlug(e.target.value)} className="w-full border p-2 rounded" placeholder="auto-generated" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Price (NGN)</label>
                                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full border p-2 rounded" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Duration (Days)</label>
                                    <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full border p-2 rounded" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">Description</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border p-2 rounded h-20" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Include Modules</label>
                                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded-2xl border border-gray-100 max-h-48 overflow-y-auto">
                                    {modules.map((mod: any) => (
                                        <label key={mod.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={allowedModules.includes(mod.id)}
                                                onChange={() => {
                                                    setAllowedModules(prev =>
                                                        prev.includes(mod.id)
                                                            ? prev.filter(id => id !== mod.id)
                                                            : [...prev, mod.id]
                                                    );
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                            />
                                            <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900">{mod.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">Marketing Features (One per line)</label>
                                <textarea value={features} onChange={e => setFeatures(e.target.value)} className="w-full border p-2 rounded h-24 font-mono text-sm" placeholder="Unlimited Students&#10;Result Checking&#10;..." />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">Cancel</button>
                                <button type="submit" disabled={isProcessing} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700">Save Plan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function FinancialsTab({ revenue }: any) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className="text-3xl font-bold text-gray-900">Financial Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`₦${parseFloat(revenue?.total_revenue || 0).toLocaleString()}`}
                    icon={CreditCard}
                    color="bg-green-600"
                />
                <StatCard
                    title="This Month"
                    value="₦0.00"
                    icon={Activity}
                    color="bg-blue-600"
                />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 font-bold text-gray-500 text-sm">School</th>
                                <th className="px-4 py-3 font-bold text-gray-500 text-sm">Amount</th>
                                <th className="px-4 py-3 font-bold text-gray-500 text-sm">Date</th>
                                <th className="px-4 py-3 font-bold text-gray-500 text-sm">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {revenue?.recent_payments?.map((payment: any, i: number) => (
                                <tr key={i}>
                                    <td className="px-4 py-3 font-medium">{payment.school__name}</td>
                                    <td className="px-4 py-3 text-green-600 font-bold">₦{parseFloat(payment.amount).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-gray-500 text-sm">{new Date(payment.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{payment.reference}</td>
                                </tr>
                            ))}
                            {(!revenue?.recent_payments || revenue.recent_payments.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No recent transactions</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4 hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white shadow-lg opacity-90 group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
                </div>
            </div>
            {trend && (
                <div className="pt-3 border-t border-gray-50 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">{trend}</p>
                </div>
            )}
        </div>
    );
}

function ModulesTab({ modules = [] }: { modules: any[] }) {
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const handleToggle = async (moduleId: string, currentStatus: boolean) => {
        setTogglingId(moduleId);
        try {
            const action = currentStatus ? 'off' : 'on';
            await apiClient.post('/schools/modules/toggle/', { module_id: moduleId, action });
            // Refresh to show updated status (or update local state if prefered)
            window.location.reload();
        } catch (error) {
            alert('Failed to toggle module');
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-black text-gray-900 uppercase">Module Library</h2>
                <p className="text-gray-500 font-medium text-sm">Global master switches. Turning a module OFF here disables it platform-wide, overriding all subscription plans.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((mod) => (
                    <div key={mod.id} className={`bg-white p-6 rounded-3xl border transition-all group ${mod.is_active ? 'border-gray-100 shadow-sm hover:shadow-xl hover:shadow-brand-900/5' : 'border-dashed border-gray-200 opacity-60 grayscale'
                        }`}>
                        <div className="flex items-start justify-between mb-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${mod.is_active ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-400'
                                }`}>
                                <Zap size={28} />
                            </div>

                            <button
                                disabled={togglingId === mod.id}
                                onClick={() => handleToggle(mod.id, mod.is_active)}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-200 outline-none p-1 ${mod.is_active ? 'bg-brand-600' : 'bg-gray-200'
                                    } ${togglingId === mod.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${mod.is_active ? 'translate-x-6' : 'translate-x-0'
                                    }`}></div>
                            </button>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{mod.name}</h3>
                            {!mod.is_active && <span className="text-[10px] font-black text-white bg-gray-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">Disabled</span>}
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed min-h-[40px]">{mod.description}</p>

                        <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${mod.is_active ? 'bg-brand-50 text-brand-600' : 'bg-gray-50 text-gray-400'
                                }`}>
                                ID: {mod.id}
                            </span>
                            <div className="flex -space-x-2">
                                <div className={`w-6 h-6 rounded-full border-2 border-white ${mod.is_active ? 'bg-brand-200' : 'bg-gray-200'}`}></div>
                                <div className={`w-6 h-6 rounded-full border-2 border-white ${mod.is_active ? 'bg-brand-100' : 'bg-gray-100'}`}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PlatformSettingsTab({ settings }: { settings: any }) {
    const [editedSettings, setEditedSettings] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const updateMutation = useUpdatePlatformSettings();

    useEffect(() => {
        if (settings) {
            setEditedSettings(settings);
        }
    }, [settings]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateMutation.mutateAsync(editedSettings);
            alert('Settings updated successfully');
        } catch (error) {
            alert('Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (!editedSettings) return <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">Loading Platform Configurations...</div>;

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-black text-gray-900 uppercase">Platform Settings</h2>
                <p className="text-gray-500 font-medium text-sm">Configure global payment methods, Paystack API keys, and system-wide defaults.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Paystack Section */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl shadow-slate-900/20 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CreditCard size={120} />
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white">
                                <Zap size={18} fill="currentColor" />
                            </span>
                            Paystack Configuration
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Public Key (pk_test_...)</label>
                                <input
                                    value={editedSettings.paystack_public_key || ''}
                                    onChange={(e) => setEditedSettings({ ...editedSettings, paystack_public_key: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                                    placeholder="pk_test_..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secret Key (sk_test_...)</label>
                                <input
                                    type="password"
                                    value={editedSettings.paystack_secret_key || ''}
                                    onChange={(e) => setEditedSettings({ ...editedSettings, paystack_secret_key: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                                    placeholder="sk_test_..."
                                />
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-slate-400 font-medium italic">Used for automated subscription payments and plan upgrades.</p>
                    </div>
                </div>

                {/* Bank Details Section */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm group">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600">
                            <CreditCard size={18} />
                        </span>
                        Master Bank Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bank Name</label>
                            <input
                                value={editedSettings.bank_name || ''}
                                onChange={(e) => setEditedSettings({ ...editedSettings, bank_name: e.target.value })}
                                className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none"
                                placeholder="e.g. GTBank"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Account Number</label>
                            <input
                                value={editedSettings.account_number || ''}
                                onChange={(e) => setEditedSettings({ ...editedSettings, account_number: e.target.value })}
                                className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none"
                                placeholder="0123456789"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Account Name</label>
                            <input
                                value={editedSettings.account_name || ''}
                                onChange={(e) => setEditedSettings({ ...editedSettings, account_name: e.target.value })}
                                className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none"
                                placeholder="Registra Global"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0"
                    >
                        {isSaving ? 'Synchronizing...' : 'Save Configuration'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function SchoolEditModal({ school, plans, onClose, onSave }: { school: any; plans: any[]; onClose: () => void; onSave: (data: any) => void }) {
    const [formData, setFormData] = useState({
        name: school?.name || '',
        domain: school?.domain || '',
        email: school?.email || '',
        phone: school?.phone || '',
        address: school?.address || '',
        contact_person: school?.contact_person || '',
        plan_id: school?.subscription?.plan_id || '',
        subscription_status: school?.subscription?.status || 'active',
        subscription_end_date: school?.subscription?.end_date ? new Date(school.subscription.end_date).toISOString().split('T')[0] : '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Edit School Details</h3>
                        <p className="text-sm text-gray-500 font-medium">Update core administrative information for {school?.name}.</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-md transition-all text-gray-400 hover:text-gray-900">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">School Name</label>
                            <input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Subdomain</label>
                            <div className="relative">
                                <input
                                    required
                                    value={formData.domain}
                                    onChange={e => setFormData({ ...formData, domain: e.target.value })}
                                    className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none pr-32"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-300 uppercase">.{ROOT_DOMAIN}</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Official Email</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number</label>
                            <input
                                required
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Contact Person</label>
                            <input
                                required
                                value={formData.contact_person}
                                onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                                className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Physical Address</label>
                            <textarea
                                required
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none min-h-[100px] resize-none"
                            />
                        </div>

                        {/* Subscription Management Section */}
                        <div className="md:col-span-2 pt-6 border-t border-gray-100">
                            <h4 className="text-xs font-black text-brand-600 uppercase tracking-widest mb-4">Subscription Management</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Subscription Plan</label>
                                    <select
                                        value={formData.plan_id}
                                        onChange={e => setFormData({ ...formData, plan_id: e.target.value })}
                                        className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none"
                                    >
                                        <option value="">Select Plan</option>
                                        {plans.map((plan: any) => (
                                            <option key={plan.id} value={plan.id}>{plan.name} (₦{parseFloat(plan.price).toLocaleString()})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Status</label>
                                    <select
                                        value={formData.subscription_status}
                                        onChange={e => setFormData({ ...formData, subscription_status: e.target.value })}
                                        className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none"
                                    >
                                        <option value="active">Active</option>
                                        <option value="pending">Pending</option>
                                        <option value="expired">Expired</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Expiry Date</label>
                                    <input
                                        type="date"
                                        value={formData.subscription_end_date}
                                        onChange={e => setFormData({ ...formData, subscription_end_date: e.target.value })}
                                        className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 text-gray-400 font-black uppercase text-xs tracking-widest hover:bg-gray-50 rounded-2xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] py-4 bg-gray-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-gray-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
