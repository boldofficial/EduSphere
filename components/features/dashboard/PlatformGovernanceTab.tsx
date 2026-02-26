'use client';

import React from 'react';
import {
    ShieldCheck, Bell, Activity, Clock,
    User, School, AlertCircle, CheckCircle2,
    Search, Filter, Plus, Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/providers/toast-provider';
import apiClient from '@/lib/api-client';
import { Trash2 } from 'lucide-react';

interface GovernanceTabProps {
    activities: {
        id: number;
        action: string;
        school_name: string;
        user_email: string;
        description: string;
        created_at: string;
    }[];
    announcements: {
        id: number;
        title: string;
        message: string;
        priority: string;
        is_active: boolean;
        created_at: string;
    }[];
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
    'SCHOOL_SIGNUP': <Plus className="text-green-500" size={16} />,
    'PAYMENT_RECORDED': <CreditCard className="text-blue-500" size={16} />,
    'ADMIN_IMPERSONATION': <User className="text-amber-500" size={16} />,
    'SECURITY_ALERT': <AlertCircle className="text-rose-500" size={16} />,
    'SCHOOL_ACTIVATED': <CheckCircle2 className="text-emerald-500" size={16} />,
};

import { CreditCard } from 'lucide-react';

export const PlatformGovernanceTab: React.FC<GovernanceTabProps> = ({ activities: initialActivities, announcements }) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isSearching, setIsSearching] = React.useState(false);
    const [searchResults, setSearchResults] = React.useState<{ schools: any[], logs: any[] } | null>(null);
    const [maintenanceMode, setMaintenanceMode] = React.useState(false);
    const { addToast } = useToast();

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setSearchResults(null);
            return;
        }
        setIsSearching(true);
        try {
            const res = await apiClient.get(`schools/search/global/?q=${searchTerm}`);
            setSearchResults(res.data);
        } catch {
            addToast('Search failed', 'error');
        } finally {
            setIsSearching(false);
        }
    };

    const toggleMaintenance = async () => {
        const newMode = !maintenanceMode;
        try {
            await apiClient.post('schools/maintenance/', { action: newMode ? 'enable' : 'disable' });
            setMaintenanceMode(newMode);
            addToast(`Maintenance mode ${newMode ? 'enabled' : 'disabled'}`, 'success');
        } catch {
            addToast('Failed to update maintenance mode', 'error');
        }
    };

    const displayActivities = searchResults?.logs || initialActivities;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Left Column: Activity Feed */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-8 rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col h-[800px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                <Activity className="text-indigo-600" size={28} />
                                {searchResults ? 'Search Results' : 'Platform Audit Log'}
                            </h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                                {searchResults ? `Found ${searchResults.logs.length} events and ${searchResults.schools.length} schools` : 'Real-time security and operational events'}
                            </p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="relative">
                                <Input
                                    className="w-64 h-10 pl-10 rounded-xl bg-gray-50 border-gray-100 text-xs"
                                    placeholder="Search logs or schools..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />}
                            </div>
                            <button
                                onClick={handleSearch}
                                className="p-3 hover:bg-brand-50 rounded-xl text-brand-600 transition-colors"
                            >
                                <Search size={18} />
                            </button>
                            {searchResults && (
                                <button
                                    onClick={() => { setSearchResults(null); setSearchTerm(''); }}
                                    className="p-3 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
                                >
                                    <Trash2 size={18} className="rotate-45" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                        {searchResults?.schools && searchResults.schools.length > 0 && (
                            <div className="mb-8 space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-500 flex items-center gap-2">
                                    <School size={14} /> Matching Schools
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {searchResults.schools.map(school => (
                                        <div key={school.id} className="p-4 bg-brand-50/50 border border-brand-100 rounded-2xl">
                                            <div className="font-bold text-sm text-gray-900">{school.name}</div>
                                            <div className="text-[10px] text-brand-600 font-mono">.{school.domain}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="h-px bg-gray-100 my-8" />
                            </div>
                        )}

                        <div className="space-y-4">
                            {displayActivities.map((activity: any) => (
                                <div key={activity.id} className="group p-5 bg-gray-50 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5 border border-transparent hover:border-indigo-100 rounded-3xl transition-all duration-300">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:scale-110 transition-transform`}>
                                            {ACTION_ICONS[activity.action] || <ShieldCheck className="text-gray-400" size={16} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-black text-gray-900 text-sm tracking-tight uppercase">{activity.action.replace(/_/g, ' ')}</h4>
                                                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                    <Clock size={10} /> {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 font-medium mb-3">{activity.description}</p>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-100 rounded-full">
                                                    <School size={10} className="text-brand-500" />
                                                    <span className="text-[10px] font-black text-gray-500 tracking-tight">{activity.school_name || 'System'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-100 rounded-full">
                                                    <User size={10} className="text-purple-500" />
                                                    <span className="text-[10px] font-black text-gray-500 tracking-tight">{activity.user_email || 'automated'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Announcements & Quick Tools */}
            <div className="space-y-8">
                {/* Global Announcements Management */}
                <div className="bg-indigo-900 text-white p-8 rounded-[40px] shadow-2xl shadow-indigo-950/20 relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 opacity-5 scale-150">
                        <Megaphone size={200} />
                    </div>

                    <div className="flex items-center justify-between mb-8 relative">
                        <div>
                            <h3 className="text-xl font-black flex items-center gap-2">
                                <Megaphone size={20} className="text-brand-400" />
                                Global Broadcasts
                            </h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Reach all school admins</p>
                        </div>
                        <Button size="sm" className="bg-brand-500 hover:bg-brand-400 rounded-xl h-10 px-4 font-black uppercase text-[10px] tracking-wider">
                            New Alert
                        </Button>
                    </div>

                    <div className="space-y-4 relative">
                        {announcements.map((ann) => (
                            <div key={ann.id} className="p-5 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-colors group">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${ann.priority === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-brand-500/20 text-brand-400'
                                        }`}>
                                        {ann.priority} Priority
                                    </span>
                                    <span className="text-[10px] font-bold opacity-40">{new Date(ann.created_at).toLocaleDateString()}</span>
                                </div>
                                <h5 className="font-bold text-sm mb-1 group-hover:text-brand-300 transition-colors">{ann.title}</h5>
                                <p className="text-xs opacity-60 line-clamp-2 mb-4 leading-relaxed">{ann.message}</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${ann.is_active ? 'bg-green-400' : 'bg-gray-400'}`} />
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                                            {ann.is_active ? 'Active' : 'Draft'}
                                        </span>
                                    </div>
                                    <button className="text-[10px] font-black uppercase tracking-widest text-brand-400 hover:text-white transition-colors">
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Platform Controls Card */}
                <div className="bg-white p-8 rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100">
                    <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                        <ShieldCheck className="text-brand-600" size={20} />
                        Platform Controls
                    </h3>

                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between group">
                            <div>
                                <h5 className="font-black text-xs uppercase tracking-tight text-gray-900">Maintenance Mode</h5>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">{maintenanceMode ? 'Enabled for all schools' : 'Disable school access'}</p>
                            </div>
                            <div
                                onClick={toggleMaintenance}
                                className={`w-12 h-6 rounded-full relative p-1 cursor-pointer transition-colors ${maintenanceMode ? 'bg-brand-500 flex justify-end' : 'bg-gray-200 group-hover:bg-gray-300'}`}
                            >
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between group">
                            <div>
                                <h5 className="font-black text-xs uppercase tracking-tight text-gray-900">New Registration</h5>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Enable public signup</p>
                            </div>
                            <div className="w-12 h-6 bg-brand-500 rounded-full relative p-1 cursor-pointer flex justify-end">
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-2xl flex items-center justify-between group">
                            <div>
                                <h5 className="font-black text-xs uppercase tracking-tight text-purple-900">Module Registry</h5>
                                <p className="text-[10px] text-purple-400 font-bold uppercase">Sync platform features</p>
                            </div>
                            <Button size="sm" variant="outline" className="h-8 text-[9px] font-black uppercase tracking-widest border-purple-200 text-purple-600 bg-white">
                                Sync
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
