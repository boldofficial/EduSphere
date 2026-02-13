'use client';

import React, { useState } from 'react';
import {
    useSupportTickets, useRespondToTicket, useResolveTicket,
    useCreateSupportTicket, useAdminSchools
} from '@/lib/hooks/use-data';
import * as Types from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    X, Plus, Ghost, MessageSquare, School,
    User, Clock, CheckCircle, Send, Hash,
    ChevronRight, HelpCircle
} from 'lucide-react';

export function SupportTab() {
    const { data: tickets = [], isLoading, refetch } = useSupportTickets();
    const { data: schools = [] } = useAdminSchools();
    const createMutation = useCreateSupportTicket();
    const respondMutation = useRespondToTicket();
    const resolveMutation = useResolveTicket();

    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // New Ticket State
    const [newTicket, setNewTicket] = useState({
        school_id: '',
        subject: '',
        category: 'technical' as any,
        priority: 'medium' as any,
        description: ''
    });

    const selectedTicket = tickets.find((t: any) => t.id === selectedTicketId);

    const formatDateTime = (dateStr: string) => {
        try {
            return new Intl.DateTimeFormat('en-GB', {
                dateStyle: 'medium',
                timeStyle: 'short'
            }).format(new Date(dateStr));
        } catch (e) {
            return dateStr;
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTicket.school_id) {
            alert("Please select a school");
            return;
        }

        setIsSubmitting(true);
        try {
            await createMutation.mutateAsync({
                ...newTicket,
                school_id: parseInt(newTicket.school_id)
            } as any);
            setIsCreateModalOpen(false);
            setNewTicket({ school_id: '', subject: '', category: 'technical', priority: 'medium', description: '' });
            refetch();
        } catch (error) {
            alert("Failed to create ticket");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRespond = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicketId || !message.trim()) return;

        setIsSubmitting(true);
        try {
            await respondMutation.mutateAsync({ id: selectedTicketId, message });
            setMessage('');
            refetch();
        } catch (error) {
            alert("Failed to send response");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResolve = async (id: number) => {
        if (!confirm("Mark this ticket as resolved?")) return;
        try {
            await resolveMutation.mutateAsync(id);
            refetch();
        } catch (error) {
            alert("Failed to resolve ticket");
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'medium': return 'bg-sky-100 text-sky-700 border-sky-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'in_progress': return 'bg-sky-100 text-sky-700 border-sky-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    if (isLoading) return (
        <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-600 border-t-transparent shadow-sm"></div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 h-full max-w-7xl mx-auto px-4 md:px-0">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Support Queue</h1>
                    <p className="text-slate-500 font-medium">Manage and respond to school support requests.</p>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="rounded-xl px-7 py-6 font-bold shadow-md hover:shadow-lg transition-all active:scale-95 bg-brand-600 hover:bg-brand-700"
                >
                    <Plus className="mr-2" size={20} /> Open Ticket for School
                </Button>
            </div>

            {/* Main Application Container */}
            <div className="flex bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 min-h-[600px] h-[calc(100vh-320px)]">
                {/* Tickets Feed Sidebar */}
                <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/40">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MessageSquare size={14} className="text-slate-400" />
                            <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Active Feed</span>
                        </div>
                        <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded border border-slate-100 text-slate-400">
                            {tickets.length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {tickets.length === 0 ? (
                            <div className="p-12 text-center opacity-40">
                                <Ghost size={32} className="mx-auto mb-4" />
                                <p className="text-xs font-bold tracking-tight">No active requests</p>
                            </div>
                        ) : (
                            tickets.map((ticket: any) => (
                                <button
                                    key={ticket.id}
                                    onClick={() => setSelectedTicketId(ticket.id)}
                                    className={`w-full text-left p-5 border-b border-slate-100 transition-all hover:bg-white group relative ${selectedTicketId === ticket.id ? 'bg-white' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[120px]">{ticket.school_name}</span>
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase ${getPriorityColor(ticket.priority)}`}>
                                            {ticket.priority[0]}
                                        </span>
                                    </div>
                                    <h4 className={`text-sm font-bold mb-3 transition-colors line-clamp-1 ${selectedTicketId === ticket.id ? 'text-brand-600' : 'text-slate-900 group-hover:text-brand-600'}`}>
                                        {ticket.subject}
                                    </h4>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getStatusColor(ticket.status)}`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                        <div className="flex items-center text-slate-400 text-[10px] font-bold">
                                            {formatDateTime(ticket.updated_at).split(',')[0]}
                                            <ChevronRight size={14} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                    {selectedTicketId === ticket.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-600" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Ticket Detail Lane */}
                <div className="flex-1 flex flex-col relative bg-white overflow-hidden">
                    {selectedTicket ? (
                        <>
                            {/* Rich Detail Header */}
                            <div className="p-8 border-b border-slate-100 shrink-0">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Hash size={16} className="text-brand-400" />
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-50 rounded border border-slate-100">CASE-{selectedTicket.id}</span>
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 mb-4">{selectedTicket.subject}</h2>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                                                <School size={14} className="text-brand-600" />
                                                <span className="text-xs font-bold text-slate-600">{selectedTicket.school_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                                                <User size={14} className="text-indigo-600" />
                                                <span className="text-xs font-bold text-slate-600">{selectedTicket.requester_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 border-l border-slate-200 pl-4">
                                                <Clock size={14} /> {formatDateTime(selectedTicket.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        {selectedTicket.status !== 'resolved' && (
                                            <Button
                                                variant="outline"
                                                onClick={() => handleResolve(selectedTicket.id)}
                                                className="rounded-xl border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 font-bold transition-all text-sm h-12 px-6"
                                            >
                                                <CheckCircle size={18} className="mr-2" /> Mark Resolved
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Initial Request Box */}
                                <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-100 relative group">
                                    <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                                        Client Request
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap">{selectedTicket.description}</p>
                                </div>
                            </div>

                            {/* Thread - Flex handles scrolling */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar pb-32">
                                {selectedTicket.responses.length === 0 ? (
                                    <div className="py-20 text-center opacity-30">
                                        <MessageSquare size={48} className="mx-auto mb-4" />
                                        <p className="text-sm font-black uppercase tracking-widest text-slate-400">Collaboration hasn't started yet</p>
                                    </div>
                                ) : (
                                    selectedTicket.responses.map((resp: any) => (
                                        <div key={resp.id} className={`flex ${resp.is_admin_response ? 'justify-end' : 'justify-start'}`}>
                                            <div className="space-y-2 max-w-[85%]">
                                                <div className={`flex items-center gap-2 mb-1 px-1 ${resp.is_admin_response ? 'flex-row-reverse' : 'justify-start'}`}>
                                                    <span className="text-[10px] font-black text-slate-400 capitalize bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                        {resp.is_admin_response ? 'Registra Support' : resp.username}
                                                    </span>
                                                    <span className="text-[9px] text-slate-300 font-bold italic">
                                                        {formatDateTime(resp.created_at).split(',')[1]}
                                                    </span>
                                                </div>
                                                <div className={`rounded-2xl p-5 shadow-sm border text-sm leading-relaxed font-medium ${resp.is_admin_response
                                                    ? 'bg-slate-900 text-white border-slate-800'
                                                    : 'bg-white text-slate-900 border-slate-100 shadow-md shadow-slate-200/20'
                                                    }`}>
                                                    {resp.message}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Sticky Footer Reply Box */}
                            {selectedTicket.status !== 'resolved' && (
                                <div className="absolute bottom-0 left-0 right-0 p-8 pt-10 bg-gradient-to-t from-white via-white/100 to-transparent pointer-events-none">
                                    <form onSubmit={handleRespond} className="relative group pointer-events-auto">
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Compose your reply to the school admin..."
                                            className="w-full bg-white border-2 border-slate-200 focus:border-brand-600 rounded-3xl p-6 pr-44 min-h-[100px] outline-none transition-all text-slate-900 text-sm font-bold shadow-2xl shadow-slate-200/40 resize-none hover:border-brand-200"
                                        />
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || !message.trim()}
                                            className="absolute bottom-4 right-4 rounded-xl px-8 py-5 bg-brand-600 hover:bg-brand-700 text-white font-black shadow-xl shadow-brand-900/20 active:scale-95 disabled:opacity-50 h-14"
                                        >
                                            <Send size={20} className="mr-2" /> {isSubmitting ? 'Sending...' : 'Send Reply'}
                                        </Button>
                                    </form>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center bg-slate-50/10">
                            <div className="w-28 h-28 bg-white rounded-[40px] flex items-center justify-center mb-10 border border-slate-100 shadow-xl shadow-slate-100/50 group hover:scale-105 transition-all">
                                <HelpCircle className="text-slate-100 group-hover:text-brand-200 transition-colors" size={64} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Collaboration Hub</h2>
                            <p className="text-slate-400 max-w-sm leading-relaxed font-bold text-sm uppercase tracking-widest text-center opacity-60">
                                Select a pending ticket to review the details and coordinate with school administrators.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Platform-wide Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-xl p-0 rounded-[50px] shadow-2xl border-none overflow-hidden animate-in zoom-in-95 duration-200 bg-white">
                        <div className="p-10 border-b border-slate-100">
                            <div className="flex justify-between items-center mb-12">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Initiate Support Cycle</h3>
                                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest opacity-70">Internal platform assistance for schools</p>
                                </div>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-300 hover:text-slate-900 border border-slate-50"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateTicket} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Targeted School Location</label>
                                    <select
                                        className="w-full p-5 h-16 rounded-[24px] border-2 border-slate-100 focus:border-brand-600 bg-slate-50 outline-none text-sm font-black appearance-none transition-all shadow-sm"
                                        value={newTicket.school_id}
                                        onChange={e => setNewTicket(prev => ({ ...prev, school_id: e.target.value }))}
                                        required
                                    >
                                        <option value="">Select Platform School...</option>
                                        {schools.map((s: any) => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.domain})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Subject Context</label>
                                    <Input
                                        placeholder="What is the primary theme?"
                                        value={newTicket.subject}
                                        onChange={e => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                                        required
                                        className="h-16 px-6 rounded-[24px] border-2 border-slate-100 focus:border-brand-600 transition-all text-sm font-black shadow-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Category Focus</label>
                                        <select
                                            className="w-full p-5 h-16 rounded-[24px] border-2 border-slate-100 focus:border-brand-600 bg-slate-50 outline-none text-sm font-black appearance-none transition-all shadow-sm"
                                            value={newTicket.category}
                                            onChange={e => setNewTicket(prev => ({ ...prev, category: e.target.value as any }))}
                                        >
                                            <option value="technical">Technical Support</option>
                                            <option value="billing">Financial / Billing</option>
                                            <option value="customization">System Modification</option>
                                            <option value="other">Platform Feedback</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Operational Urgency</label>
                                        <select
                                            className="w-full p-5 h-16 rounded-[24px] border-2 border-slate-100 focus:border-brand-600 bg-slate-50 outline-none text-sm font-black appearance-none transition-all shadow-sm"
                                            value={newTicket.priority}
                                            onChange={e => setNewTicket(prev => ({ ...prev, priority: e.target.value as any }))}
                                        >
                                            <option value="low">Standard</option>
                                            <option value="medium">Elevated</option>
                                            <option value="high">High Priority</option>
                                            <option value="urgent">Immediate Action</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Comprehensive Details</label>
                                    <textarea
                                        className="w-full p-6 h-40 rounded-[32px] border-2 border-slate-100 focus:border-brand-600 bg-slate-50 outline-none text-sm font-bold resize-none transition-all shadow-sm"
                                        placeholder="Describe the situation, steps or deliverables..."
                                        value={newTicket.description}
                                        onChange={e => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button type="button" variant="outline" className="flex-1 rounded-[24px] h-16 font-black border-slate-200 text-slate-400 hover:text-slate-900 border-2" onClick={() => setIsCreateModalOpen(false)}>
                                        Discard
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-[24px] h-16 font-black shadow-xl shadow-brand-900/10 active:scale-95 transition-all bg-brand-600">
                                        {isSubmitting ? 'Processing...' : 'Create Ticket'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
