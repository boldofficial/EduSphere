'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSchoolStore } from '@/lib/store';
import {
    LayoutDashboard, School as SchoolIcon, CreditCard, Settings,
    LogOut, Search, Grid, ScrollText, Mail, Rocket,
    MessageSquare, Megaphone, Wallet, Shield, Radio
} from 'lucide-react';
import {
    useAdminSchools, useGlobalSearch
} from '@/lib/hooks/use-data';
import apiClient from '@/lib/api-client';
import { CommandPalette } from '@/components/features/CommandPalette';
import { useToast } from '@/components/providers/toast-provider';
import { ConfirmActionModal } from './components/ConfirmActionModal';

function SidebarGroup({ label }: { label: string }) {
    return (
        <div className="px-4 pt-6 pb-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-400/50">{label}</span>
        </div>
    );
}

function SidebarItem({ icon: Icon, label, href, active }: any) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-2.5 w-full rounded-xl transition-all text-sm ${
                active
                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/40 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
            }`}
        >
            <Icon size={18} />
            <span>{label}</span>
        </Link>
    );
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const { currentUser, currentRole, logout, hasHydrated } = useSchoolStore();
    const { addToast } = useToast();
    const router = useRouter();
    const pathname = usePathname();

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
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

    const { data: schools = [] } = useAdminSchools();
    const { data: searchResults, isLoading: searchLoading } = useGlobalSearch(searchQuery);

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

    if (!hasHydrated || !currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
            </div>
        );
    }

    if (currentRole?.toLowerCase() !== 'super_admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-primary flex">
            {/* Sidebar */}
            <aside className="w-72 bg-gradient-to-b from-brand-950 via-brand-900 to-brand-950 text-white fixed h-full z-10 flex flex-col border-r border-brand-800/30">
                <div className="p-6 border-b border-white/5 flex items-center gap-3">
                    <Link href="/dashboard/super-admin" className="h-14 w-full flex items-center justify-start">
                        <img src="/footer-logo.png" alt="Registra" className="h-full w-auto object-contain hover:opacity-80 transition-opacity" />
                    </Link>
                </div>
                <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto custom-scrollbar">
                    <SidebarGroup label="Core" />
                    <SidebarItem icon={LayoutDashboard} label="Overview" href="/dashboard/super-admin" active={pathname === '/dashboard/super-admin'} />
                    <SidebarItem icon={SchoolIcon} label="Tenants (Schools)" href="/dashboard/super-admin/tenants" active={pathname === '/dashboard/super-admin/tenants'} />
                    <SidebarItem icon={Wallet} label="Financials" href="/dashboard/super-admin/financials" active={pathname === '/dashboard/super-admin/financials'} />
                    <SidebarItem icon={CreditCard} label="Plans & Pricing" href="/dashboard/super-admin/plans" active={pathname === '/dashboard/super-admin/plans'} />
                    <SidebarItem icon={Grid} label="Modules Library" href="/dashboard/super-admin/modules" active={pathname === '/dashboard/super-admin/modules'} />

                    <SidebarGroup label="Communication" />
                    <SidebarItem icon={Mail} label="Email Templates" href="/dashboard/super-admin/templates" active={pathname === '/dashboard/super-admin/templates'} />
                    <SidebarItem icon={ScrollText} label="Delivery Logs" href="/dashboard/super-admin/logs" active={pathname === '/dashboard/super-admin/logs'} />
                    <SidebarItem icon={Megaphone} label="Email Marketing" href="/dashboard/super-admin/marketing" active={pathname === '/dashboard/super-admin/marketing'} />
                    <SidebarItem icon={Radio} label="Broadcasts" href="/dashboard/super-admin/broadcasts" active={pathname === '/dashboard/super-admin/broadcasts'} />

                    <SidebarGroup label="Advanced" />
                    <SidebarItem icon={Shield} label="Governance" href="/dashboard/super-admin/governance" active={pathname === '/dashboard/super-admin/governance'} />
                    <SidebarItem icon={Rocket} label="Demo Requests" href="/dashboard/super-admin/demo-requests" active={pathname === '/dashboard/super-admin/demo-requests'} />
                    <SidebarItem icon={MessageSquare} label="Support Tickets" href="/dashboard/super-admin/support" active={pathname === '/dashboard/super-admin/support'} />
                    <SidebarItem icon={Settings} label="Platform Settings" href="/dashboard/super-admin/settings" active={pathname === '/dashboard/super-admin/settings'} />
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
                                                            <button key={s.id} onClick={() => { router.push('/dashboard/super-admin/tenants'); setIsSearchOpen(false); setSearchQuery(''); }}
                                                                className="w-full text-left p-3 hover:bg-gray-50 rounded-xl flex items-center justify-between group transition-colors">
                                                                <span className="font-bold text-gray-900">{s.name}</span>
                                                                <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full uppercase">{s.status}</span>
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
                    {children}
                </div>
            </main>

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
