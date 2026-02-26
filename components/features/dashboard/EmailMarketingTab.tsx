'use client';

import React, { useState, useEffect } from 'react';
import {
    Mail, Send, Plus, Search, Filter,
    MoreVertical, ChevronRight, BarChart3,
    Clock, CheckCircle, AlertCircle,
    User, HardDrive, History, Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/providers/toast-provider';
import apiClient from '@/lib/api-client';

// We will create these modals next
import { CreateCampaignModal } from './CreateCampaignModal';
import { SendIndividualEmailModal } from './SendIndividualEmailModal';

interface EmailCampaign {
    id: number;
    title: string;
    template_name: string;
    status: 'draft' | 'sending' | 'completed' | 'failed';
    total_recipients: number;
    sent_count: number;
    failed_count: number;
    created_at: string;
    started_at?: string;
    completed_at?: string;
}

export const EmailMarketingTab: React.FC = () => {
    const [activeSubTab, setActiveSubTab] = useState<'campaigns' | 'logs'>('campaigns');
    const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isIndividualModalOpen, setIsIndividualModalOpen] = useState(false);
    const [stats, setStats] = useState<{ total_sent: number; total_failed: number; total_emails: number; campaign_count: number; success_rate: number }>({ total_sent: 0, total_failed: 0, total_emails: 0, campaign_count: 0, success_rate: 0 });
    const { addToast } = useToast();

    useEffect(() => {
        fetchData();
        fetchStats();
    }, [activeSubTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeSubTab === 'campaigns') {
                const res = await apiClient.get('emails/campaigns/');
                setCampaigns(res.data);
            } else {
                const res = await apiClient.get('emails/logs/');
                setLogs(res.data);
            }
        } catch (error) {
            addToast('Failed to fetch data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await apiClient.get('emails/campaigns/stats/');
            setStats(res.data);
        } catch (error) {
            // Stats are non-critical, silently fail
        }
    };

    const handleSendCampaign = async (id: number) => {
        try {
            await apiClient.post(`emails/campaigns/${id}/send_campaign/`);
            addToast('Campaign queued for sending', 'success');
            fetchData();
        } catch (error) {
            addToast('Failed to trigger campaign', 'error');
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
            case 'sending': return 'bg-blue-100 text-blue-700 ring-blue-200 animate-pulse';
            case 'failed': return 'bg-rose-100 text-rose-700 ring-rose-200';
            default: return 'bg-gray-100 text-gray-700 ring-gray-200';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Sub-tabs */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                <div className="flex bg-gray-100 p-1 rounded-2xl w-max">
                    <button
                        onClick={() => setActiveSubTab('campaigns')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'campaigns' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Campaigns
                    </button>
                    <button
                        onClick={() => setActiveSubTab('logs')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'logs' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        History & Logs
                    </button>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={() => setIsIndividualModalOpen(true)}
                        variant="outline"
                        className="rounded-2xl h-12 px-6 gap-2 border-brand-100 text-brand-600 font-bold uppercase text-[10px] tracking-widest hover:bg-brand-50"
                    >
                        <User size={16} /> Individual Email
                    </Button>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="rounded-2xl h-12 px-6 gap-2 bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/20 font-bold uppercase text-[10px] tracking-widest"
                    >
                        <Plus size={16} /> New Campaign
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Search & Filters */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <Input
                                placeholder="Search..."
                                className="pl-10 h-10 rounded-xl bg-gray-50 border-gray-100 text-xs font-bold"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Marketing Analytics</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="text-2xl font-black text-gray-900 leading-none">{stats.success_rate}%</div>
                                    <div className="text-[9px] font-black uppercase tracking-tight text-gray-400 mt-1">Success Rate</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="text-2xl font-black text-gray-900 leading-none">{stats.total_sent}</div>
                                    <div className="text-[9px] font-black uppercase tracking-tight text-gray-400 mt-1">Total Sent</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="text-2xl font-black text-gray-900 leading-none">{stats.campaign_count}</div>
                                    <div className="text-[9px] font-black uppercase tracking-tight text-gray-400 mt-1">Campaigns</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="text-2xl font-black text-rose-600 leading-none">{stats.total_failed}</div>
                                    <div className="text-[9px] font-black uppercase tracking-tight text-gray-400 mt-1">Failed</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main List Area */}
                <div className="lg:col-span-3">
                    {activeSubTab === 'campaigns' ? (
                        <div className="grid md:grid-cols-2 gap-6">
                            {isLoading ? (
                                <div className="col-span-2 py-20 text-center animate-pulse">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-4" />
                                    <div className="h-4 w-32 bg-gray-100 rounded mx-auto" />
                                </div>
                            ) : campaigns.length === 0 ? (
                                <div className="col-span-2 py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-100 text-center space-y-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center mx-auto text-gray-300">
                                        <Mail size={32} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900 tracking-tight">No campaigns yet</h4>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Start your first email marketing push</p>
                                    </div>
                                    <Button onClick={() => setIsCreateModalOpen(true)} variant="ghost" className="text-brand-600 font-black uppercase tracking-widest text-[10px]">Create Campaign Now <ChevronRight size={14} /></Button>
                                </div>
                            ) : (
                                campaigns.map(campaign => (
                                    <div key={campaign.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${campaign.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-brand-50 text-brand-600 border-brand-100'}`}>
                                                    <Layout size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-gray-900 tracking-tight text-sm">{campaign.title}</h4>
                                                    <p className="text-[10px] font-bold text-gray-400 capitalize">{campaign.template_name || 'Custom Message'}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ${getStatusStyle(campaign.status)}`}>
                                                {campaign.status}
                                            </span>
                                        </div>

                                        <div className="space-y-4 mb-6">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-tight mb-1">
                                                <span className="text-gray-400">Progress</span>
                                                <span className="text-gray-900">{campaign.total_recipients > 0 ? Math.round((campaign.sent_count / campaign.total_recipients) * 100) : 0}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${campaign.status === 'failed' ? 'bg-rose-500' : 'bg-brand-600'}`}
                                                    style={{ width: `${campaign.total_recipients > 0 ? (campaign.sent_count / campaign.total_recipients) * 100 : 0}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                                                <div className="flex gap-4">
                                                    <span className="flex items-center gap-1 text-emerald-600"><CheckCircle size={10} /> {campaign.sent_count} Sent</span>
                                                    <span className="flex items-center gap-1 text-rose-600"><AlertCircle size={10} /> {campaign.failed_count} Failed</span>
                                                </div>
                                                <span className="flex items-center gap-1"><Clock size={10} /> {new Date(campaign.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            {campaign.status === 'draft' ? (
                                                <Button onClick={() => handleSendCampaign(campaign.id)} className="flex-1 rounded-xl h-10 bg-brand-600 hover:bg-brand-500 gap-2 font-black uppercase text-[9px] tracking-widest">
                                                    <Send size={14} /> Send Now
                                                </Button>
                                            ) : (
                                                <Button variant="outline" className="flex-1 rounded-xl h-10 border-gray-100 text-gray-500 hover:bg-gray-50 gap-2 font-black uppercase text-[9px] tracking-widest">
                                                    <BarChart3 size={14} /> View Report
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Recipient</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Subject</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Campaign</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Sent At</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {logs.map(log => (
                                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-xs font-black text-gray-900">{log.recipient}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs font-bold text-gray-600 line-clamp-1">{log.subject}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-[10px] font-black uppercase tracking-tight text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full w-max">
                                                        {log.campaign_title || 'Direct'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${log.status === 'sent' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-[10px] font-bold text-gray-400">{new Date(log.sent_at).toLocaleString()}</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <CreateCampaignModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={fetchData}
            />
            <SendIndividualEmailModal
                isOpen={isIndividualModalOpen}
                onClose={() => setIsIndividualModalOpen(false)}
            />
        </div>
    );
};
