'use client';

import React, { useState } from 'react';
import {
    MessageSquare, Send, CheckCircle, Clock,
    AlertCircle, Plus, Ghost, X, User, School,
    HelpCircle
} from 'lucide-react';
import {
    useSupportTickets, useCreateSupportTicket,
    useRespondToTicket, useResolveTicket
} from '@/lib/hooks/use-data';
import * as Types from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export const SupportView: React.FC = () => {
    const { data: tickets = [], isLoading, refetch } = useSupportTickets();
    const createMutation = useCreateSupportTicket();
    const respondMutation = useRespondToTicket();
    const resolveMutation = useResolveTicket();

    interface NewTicket {
        subject: string;
        category: Types.SupportTicket['category'];
        priority: Types.SupportTicket['priority'];
        description: string;
    }

    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTicket, setNewTicket] = useState<NewTicket>({ subject: '', category: 'technical', priority: 'medium', description: '' });
    const [replyMessage, setReplyMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        setIsSubmitting(true);
        try {
            await createMutation.mutateAsync(newTicket);
            setIsCreateModalOpen(false);
            setNewTicket({ subject: '', category: 'technical', priority: 'medium', description: '' });
            refetch();
        } catch (error) {
            alert("Failed to create ticket");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRespond = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicketId || !replyMessage.trim()) return;

        setIsSubmitting(true);
        try {
            await respondMutation.mutateAsync({ id: selectedTicketId, message: replyMessage });
            setReplyMessage('');
            refetch();
        } catch (error) {
            alert("Failed to send reply");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResolve = async (id: number) => {
        if (!confirm("Are you sure you want to mark this issue as resolved?")) return;
        try {
            await resolveMutation.mutateAsync(id);
            refetch();
        } catch (error) {
            alert("Failed to resolve ticket");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'resolved': return 'bg-green-100 text-green-700';
            case 'in_progress': return 'bg-blue-100 text-blue-700';
            case 'open': return 'bg-amber-100 text-amber-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (isLoading) return (
        <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-600 border-t-transparent"></div>
        </div>
    );

    return (
        <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Support & Help Desk</h1>
                    <p className="text-gray-500 font-medium">Report issues or request customizations directly from the Registra team.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-2xl px-6 py-6 font-black shadow-lg shadow-brand-900/20 active:scale-95 transition-all">
                    <Plus className="mr-2" size={20} /> New Support Ticket
                </Button>
            </div>

            <div className="flex gap-6 h-[calc(100vh-250px)]">
                {/* Tickets List */}
                <Card className="w-1/3 p-0 flex flex-col overflow-hidden border-gray-200 shadow-sm rounded-[32px]">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                        <span className="font-bold text-gray-900 uppercase tracking-widest text-[10px]">Your Tickets</span>
                        <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-lg border border-gray-100 text-gray-500">
                            {tickets.length} Total
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {tickets.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <Ghost size={48} className="mx-auto mb-4 opacity-10" />
                                <p className="text-sm font-medium">No tickets yet.</p>
                            </div>
                        ) : (
                            tickets.map((ticket: any) => (
                                <button
                                    key={ticket.id}
                                    onClick={() => setSelectedTicketId(ticket.id)}
                                    className={`w-full text-left p-6 border-b border-gray-50 transition-all hover:bg-gray-50 relative group ${selectedTicketId === ticket.id ? 'bg-brand-50/50' : ''
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-tighter ${ticket.priority === 'urgent' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}>
                                            {ticket.priority}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">#{ticket.id.toString().slice(-4)}</span>
                                    </div>
                                    <h4 className={`text-sm font-bold mb-3 line-clamp-1 transition-colors ${selectedTicketId === ticket.id ? 'text-brand-900' : 'text-gray-900 group-hover:text-brand-600'
                                        }`}>
                                        {ticket.subject}
                                    </h4>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase ${getStatusBadge(ticket.status)}`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold">
                                            {formatDateTime(ticket.updated_at).split(',')[0]}
                                        </span>
                                    </div>
                                    {selectedTicketId === ticket.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-600" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </Card>

                {/* Ticket Discussion */}
                <Card className="flex-1 p-0 flex flex-col overflow-hidden border-gray-200 shadow-sm rounded-[32px] bg-gray-50/30">
                    {selectedTicket ? (
                        <>
                            <div className="p-8 bg-white border-b border-gray-100">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900 mb-2">{selectedTicket.subject}</h2>
                                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5"><HelpCircle size={14} /> {selectedTicket.category.replace('_', ' ')}</span>
                                            <span className="flex items-center gap-1.5"><Clock size={14} /> {formatDateTime(selectedTicket.created_at)}</span>
                                        </div>
                                    </div>
                                    {selectedTicket.status !== 'resolved' && (
                                        <button
                                            onClick={() => handleResolve(selectedTicket.id)}
                                            className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-black hover:bg-green-100 transition-all uppercase tracking-tight"
                                        >
                                            Mark as Resolved
                                        </button>
                                    )}
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{selectedTicket.description}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                                {selectedTicket.responses.map((resp: any) => (
                                    <div key={resp.id} className={`flex ${resp.is_admin_response ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[80%] rounded-3xl p-5 shadow-sm border ${resp.is_admin_response
                                            ? 'bg-brand-950 text-white border-brand-900 rounded-tl-none'
                                            : 'bg-white text-gray-900 border-gray-100 rounded-tr-none'
                                            }`}>
                                            <div className="flex items-center justify-between mb-2 gap-8">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${resp.is_admin_response ? 'text-brand-400' : 'text-gray-400'
                                                    }`}>
                                                    {resp.is_admin_response ? 'Support Agent' : 'You'}
                                                </span>
                                                <span className={`text-[10px] ${resp.is_admin_response ? 'text-brand-500' : 'text-gray-400'}`}>
                                                    {formatDateTime(resp.created_at).split(',')[1]}
                                                </span>
                                            </div>
                                            <p className="text-sm leading-relaxed font-medium">{resp.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {selectedTicket.status !== 'resolved' && (
                                <div className="p-8 bg-white border-t border-gray-100">
                                    <form onSubmit={handleRespond} className="relative">
                                        <textarea
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            placeholder="Write your follow-up here..."
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-600 focus:bg-white rounded-[24px] p-5 pr-32 min-h-[80px] outline-none transition-all text-gray-900 text-sm font-medium resize-none shadow-inner"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !replyMessage.trim()}
                                            className="absolute bottom-4 right-4 flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-black hover:bg-brand-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                        >
                                            <Send size={16} /> Send
                                        </button>
                                    </form>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center mb-6 border border-gray-100 shadow-xl shadow-gray-200/50">
                                <MessageSquare className="text-gray-100" size={48} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">Select a ticket to view conversation</h3>
                            <p className="text-gray-400 max-w-xs font-medium text-sm">Select a ticket from the left to read responses or send follow-up messages.</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-brand-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <Card className="w-full max-w-xl p-8 rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Open New Ticket</h3>
                                <p className="text-gray-500 font-medium text-sm">Tell us what you need help with.</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTicket} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject</label>
                                <Input
                                    placeholder="Briefly describe the issue"
                                    value={newTicket.subject}
                                    onChange={e => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                                    required
                                    className="p-4 rounded-2xl border-2 border-gray-100 focus:border-brand-600 focus:ring-0 transition-all text-sm font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                                    <select
                                        className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-brand-600 bg-gray-50 outline-none text-sm font-bold appearance-none transition-all"
                                        value={newTicket.category}
                                        onChange={e => setNewTicket(prev => ({ ...prev, category: e.target.value as Types.SupportTicket['category'] }))}
                                    >
                                        <option value="technical">Technical Issue</option>
                                        <option value="billing">Billing & Fees</option>
                                        <option value="customization">Customization</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Priority</label>
                                    <select
                                        className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-brand-600 bg-gray-50 outline-none text-sm font-bold appearance-none transition-all"
                                        value={newTicket.priority}
                                        onChange={e => setNewTicket(prev => ({ ...prev, priority: e.target.value as Types.SupportTicket['priority'] }))}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                                <textarea
                                    className="w-full p-4 rounded-3xl border-2 border-gray-100 focus:border-brand-600 bg-gray-50 outline-none text-sm font-bold min-h-[150px] resize-none transition-all"
                                    placeholder="Provide more details about the issue or request..."
                                    value={newTicket.description}
                                    onChange={e => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="outline" className="flex-1 rounded-2xl py-6 font-black" onClick={() => setIsCreateModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-2xl py-6 font-black shadow-lg shadow-brand-900/20 active:scale-95 transition-all">
                                    {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};
