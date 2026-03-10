'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSchoolStore } from '@/lib/store';
import {
    LayoutDashboard, School as SchoolIcon, CreditCard, Settings,
    LogOut, Search, AlertCircle, Grid, ScrollText, Mail, Rocket,
    MessageSquare, Megaphone, Wallet, Shield, Radio
} from 'lucide-react';
import {
    useSystemHealth, useAdminSchools, useAdminPlans, useAdminRevenue,
    useStrategicAnalytics, usePlatformGovernance, useGlobalSearch,
    useModules, usePlatformSettings, useEmailTemplates, useEmailLogs
} from '@/lib/hooks/use-data';
import apiClient from '@/lib/api-client';
import { CommandPalette } from '@/components/features/CommandPalette';
import { useToast } from '@/components/providers/toast-provider';

// Extracted Tab Components
import { OverviewTab } from './components/OverviewTab';
import { TenantsTab } from './components/TenantsTab';
import { PlansTab } from './components/PlansTab';
import { FinancialsTab } from './components/FinancialsTab';
import { ModulesTab } from './components/ModulesTab';
import { PlatformSettingsTab } from './components/PlatformSettingsTab';
import { EmailTemplatesTab, EmailLogsTab } from './components/EmailManagement';
import { GovernanceTab, BroadcastsTab } from './components/GovernanceTab';
import { SupportTab } from './components/SupportTab';
import { SchoolEditModal } from './components/SchoolEditModal';
import { DashboardDemoRequestsTab } from '@/components/features/dashboard/DashboardDemoRequestsTab';
import { EmailMarketingTab } from '@/components/features/dashboard/EmailMarketingTab';
import { ConfirmActionModal } from './components/ConfirmActionModal';

function SidebarGroup({ label }: { label: string }) {
    return (
        <div className="px-4 pt-6 pb-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-400/50">{label}</span>
        </div>
    );
}

function SidebarItem({ icon: Icon, label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-2.5 w-full rounded-xl transition-all text-sm ${
                active
                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/40 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
            }`}
        >
            <Icon size={18} />
            <span>{label}</span>
        </button>
    );
}

export default function SuperAdminDashboard() {
    const { currentUser, currentRole, logout, hasHydrated } = useSchoolStore();
    const { addToast } = useToast();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'financials' | 'plans' | 'governance' | 'broadcasts' | 'modules' | 'settings' | 'templates' | 'logs' | 'demo_requests' | 'support' | 'email_marketing'>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSchoolForEdit, setSelectedSchoolForEdit] = useState<any>(null);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [impersonateTarget, setImpersonateTarget] = useState<number | null>(null);
    const [isImpersonating, setIsImpersonating] = useState(false);

    // Command Palette Keyboard Shortcut
    useEffect(() => {
        const handleCmdK = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleCmdK);
        return () => window.removeEventListener('keydown', handleCmdK);
    }, []);

    const handleImpersonate = (userId: number) => {
        if (!userId) {
            addToast('No administrator found for this school.', 'error');
            return;
        }
        setImpersonateTarget(userId);
    };

    const confirmImpersonate = async () => {
        if (!impersonateTarget) return;

        setIsImpersonating(true);
        try {
            const res = await fetch('/api/auth/impersonate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: impersonateTarget }),
            });
            if (res.ok) {
                const data = await res.json();
                useSchoolStore.getState().login(data.user.role, data.user);
                addToast('Impersonation started successfully.', 'success');
                router.push('/dashboard');
            } else {
                addToast('Impersonation failed', 'error');
            }
        } catch (error) {
            console.error("Impersonation error", error);
            addToast('An error occurred while impersonating this user.', 'error');
        } finally {
            setIsImpersonating(false);
            setImpersonateTarget(null);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            logout();
            router.push('/');
        } catch (error) {
            console.error("Logout failed", error);
            logout();
            router.push('/login');
        }
    };

    // Verify Access
    useEffect(() => {
        if (!hasHydrated) return;
        if (currentUser && currentRole?.toLowerCase() !== 'super_admin') {
            router.push('/dashboard');
        }
    }, [currentUser, currentRole, router, hasHydrated]);

    // Fetch Data
    const { data: healthData, error: healthError } = useSystemHealth();
    const { data: schools = [], refetch: refetchSchools } = useAdminSchools();
    const { data: plans = [], refetch: refetchPlans } = useAdminPlans();
    const { data: revenueStats = { total_revenue: 0 }, refetch: refetchRevenue } = useAdminRevenue();
    const { data: strategicData, refetch: refetchStrategicAnalytics } = useStrategicAnalytics();
    const { data: governanceData, refetch: refetchPlatformGovernance } = usePlatformGovernance();
    const { data: searchResults, isLoading: searchLoading } = useGlobalSearch(searchQuery);
    const { data: modules = [], refetch: refetchModules } = useModules();
    const { data: platformSettings } = usePlatformSettings();
    const { data: templates = [], refetch: refetchEmailTemplates } = useEmailTemplates();
    const { data: emailLogs = [] } = useEmailLogs();

    const handleToggleMaintenance = async () => {
        setIsTogglingMaintenance(true);
        try {
            const nextMode = !isMaintenanceMode;
            await apiClient.post('/schools/maintenance/', { action: nextMode ? 'on' : 'off' });
            setIsMaintenanceMode(nextMode);
            addToast(`Maintenance mode turned ${nextMode ? 'ON' : 'OFF'}`, 'success');
        } catch (error) {
            addToast("Failed to toggle maintenance mode", 'error');
        }
        finally { setIsTogglingMaintenance(false); }
    };

    const handleUpdateSchool = async (id: number, data: any) => {
        try {
            await apiClient.put(`/schools/manage/${id}/`, data);
            await Promise.all([refetchSchools(), refetchRevenue(), refetchStrategicAnalytics()]);
            addToast('School details updated successfully', 'success');
        } catch (error) {
            addToast('Failed to update school details', 'error');
        }
    };

    const handleTenantDataChanged = async () => {
        await Promise.all([
            refetchSchools(),
            refetchRevenue(),
            refetchStrategicAnalytics(),
            refetchPlatformGovernance(),
        ]);
    };

    const handlePlansChanged = async () => {
        await Promise.all([refetchPlans(), refetchSchools()]);
    };

    const handleModulesChanged = async () => {
        await Promise.all([refetchModules(), refetchPlans()]);
    };

    const handleGovernanceChanged = async () => {
        await refetchPlatformGovernance();
    };

    if (!hasHydrated || !currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
            </div>
        );
    }

    if (currentRole?.toLowerCase() !== 'super_admin') {
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
                    <button onClick={() => router.push('/login')} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Go to Login</button>
                    <button onClick={() => router.refresh()} className="block w-full mt-2 text-sm text-gray-500 hover:text-gray-700">Refresh Page</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-primary flex">
            {/* Sidebar */}
            <aside className="w-72 bg-gradient-to-b from-brand-950 via-brand-900 to-brand-950 text-white fixed h-full z-10 flex flex-col border-r border-brand-800/30">
                <div className="p-6 border-b border-white/5 flex items-center gap-3">
                    <div className="h-14 w-full flex items-center justify-start">
                        <img src="/footer-logo.png" alt="Registra" className="h-full w-auto object-contain" />
                    </div>
                </div>
                <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto custom-scrollbar">
                    <SidebarGroup label="Core" />
                    <SidebarItem icon={LayoutDashboard} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <SidebarItem icon={SchoolIcon} label="Tenants (Schools)" active={activeTab === 'tenants'} onClick={() => setActiveTab('tenants')} />
                    <SidebarItem icon={Wallet} label="Financials" active={activeTab === 'financials'} onClick={() => setActiveTab('financials')} />
                    <SidebarItem icon={CreditCard} label="Plans & Pricing" active={activeTab === 'plans'} onClick={() => setActiveTab('plans')} />
                    <SidebarItem icon={Grid} label="Modules Library" active={activeTab === 'modules'} onClick={() => setActiveTab('modules')} />

                    <SidebarGroup label="Communication" />
                    <SidebarItem icon={Mail} label="Email Templates" active={activeTab === 'templates'} onClick={() => setActiveTab('templates')} />
                    <SidebarItem icon={ScrollText} label="Delivery Logs" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
                    <SidebarItem icon={Megaphone} label="Email Marketing" active={activeTab === 'email_marketing'} onClick={() => setActiveTab('email_marketing')} />
                    <SidebarItem icon={Radio} label="Broadcasts" active={activeTab === 'broadcasts'} onClick={() => setActiveTab('broadcasts')} />

                    <SidebarGroup label="Advanced" />
                    <SidebarItem icon={Shield} label="Governance" active={activeTab === 'governance'} onClick={() => setActiveTab('governance')} />
                    <SidebarItem icon={Rocket} label="Demo Requests" active={activeTab === 'demo_requests'} onClick={() => setActiveTab('demo_requests')} />
                    <SidebarItem icon={MessageSquare} label="Support Tickets" active={activeTab === 'support'} onClick={() => setActiveTab('support')} />
                    <SidebarItem icon={Settings} label="Platform Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                </nav>
                <div className="p-3 border-t border-white/5">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 w-full text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm font-medium">
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-72 flex-1">
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="relative w-96">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="text-gray-400" size={18} />
                        </div>
                        <input
                            type="text" placeholder="Search schools, activities, or logs..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
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
                                                            <button key={s.id} onClick={() => { setActiveTab('tenants'); setIsSearchOpen(false); setSearchQuery(''); }}
                                                                className="w-full text-left p-3 hover:bg-gray-50 rounded-xl flex items-center justify-between group transition-colors">
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
                                                            <button key={l.id} onClick={() => { setActiveTab('governance'); setIsSearchOpen(false); setSearchQuery(''); }}
                                                                className="w-full text-left p-3 hover:bg-gray-50 rounded-xl group transition-colors">
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
                        <button onClick={() => setIsCommandPaletteOpen(true)}
                            className="p-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 hover:text-brand-600 hover:bg-white hover:border-brand-200 transition-all flex items-center gap-2 group">
                            <Search size={18} className="group-hover:scale-110 transition-transform" />
                            <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 border border-gray-200 rounded text-[10px] font-black text-gray-400">Ctrl+K</kbd>
                        </button>
                        <button disabled={isTogglingMaintenance} onClick={handleToggleMaintenance}
                            className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${isMaintenanceMode ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100'}`}>
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
                            <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg overflow-hidden border-2 border-white">
                                {currentUser?.username?.[0].toUpperCase() || 'A'}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {healthError && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                            <AlertCircle size={20} />
                            <div>
                                <p className="font-bold">System Health Check Failed</p>
                                <p className="text-sm">{(healthError as any)?.message || 'Unknown error occurred while fetching system data.'}</p>
                                <p className="text-xs font-mono mt-1">{(healthError as any)?.response?.data?.detail || JSON.stringify((healthError as any)?.response?.data)}</p>
                            </div>
                        </div>
                    )}
                    {activeTab === 'overview' && <OverviewTab schools={schools} plans={plans} revenue={revenueStats} health={healthData} strategic={strategicData} governance={governanceData} onImpersonate={(userId: number) => handleImpersonate(userId)} />}
                    {activeTab === 'tenants' && <TenantsTab schools={schools} plans={plans} onImpersonate={(userId: number) => handleImpersonate(userId)} onEdit={(school: any) => { setSelectedSchoolForEdit(school); setIsEditModalOpen(true); }} onDataChanged={handleTenantDataChanged} />}
                    {activeTab === 'financials' && <FinancialsTab revenue={revenueStats} />}
                    {activeTab === 'plans' && <PlansTab plans={plans} modules={modules} onPlansChanged={handlePlansChanged} />}
                    {activeTab === 'governance' && <GovernanceTab activities={governanceData?.activities} />}
                    {activeTab === 'broadcasts' && <BroadcastsTab announcements={governanceData?.announcements} onBroadcastChanged={handleGovernanceChanged} />}
                    {activeTab === 'modules' && <ModulesTab modules={modules} onModulesChanged={handleModulesChanged} />}
                    {activeTab === 'settings' && <PlatformSettingsTab settings={platformSettings} />}
                    {activeTab === 'templates' && <EmailTemplatesTab templates={templates} onTemplatesChanged={refetchEmailTemplates} />}
                    {activeTab === 'logs' && <EmailLogsTab logs={emailLogs} />}
                    {activeTab === 'email_marketing' && <EmailMarketingTab />}
                    {activeTab === 'demo_requests' && <DashboardDemoRequestsTab />}
                    {activeTab === 'support' && <SupportTab />}
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

            <CommandPalette
                schools={schools}
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
            />
            <ConfirmActionModal
                isOpen={Boolean(impersonateTarget)}
                title="Confirm Impersonation"
                message="You will be logged in as this school's administrator."
                confirmLabel="Impersonate Admin"
                confirmVariant="warning"
                isProcessing={isImpersonating}
                onConfirm={confirmImpersonate}
                onCancel={() => setImpersonateTarget(null)}
            />
        </div>
    );
}
