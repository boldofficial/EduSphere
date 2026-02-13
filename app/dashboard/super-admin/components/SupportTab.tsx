'use client';

import React, { useState } from 'react';
import {
    MessageSquare, Send, CheckCircle, Clock,
    ShieldAlert, User, School, AlertCircle
} from 'lucide-react';
import {
    useSupportTickets, useRespondToTicket, useResolveTicket
} from '@/lib/hooks/use-data';

export function SupportTab() {
    const { data: tickets = [], isLoading, refetch } = useSupportTickets();
    const respondMutation = useRespondToTicket();
    const resolveMutation = useResolveTicket();

    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
    const [message, setMessage] = useState('');
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
            case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusColor = (status: string) => {
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
        <div className="flex bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden h-[calc(100vh-250px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tickets List */}
            <div className="w-1/3 border-r border-gray-100 flex flex-col">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-black text-gray-900 flex items-center gap-2">
                        <MessageSquare className="text-brand-600" size={20} />
                        Support Queue
                    </h3>
                    <span className="bg-brand-600 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                        {tickets.filter((t: any) => t.status !== 'resolved').length} Active
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {tickets.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <MessageSquare size={48} className="mx-auto mb-4 opacity-10" />
                            <p className="text-sm font-medium">No tickets found</p>
                        </div>
                    ) : (
                        tickets.map((ticket: any) => (
                            <button
                                key={ticket.id}
                                onClick={() => setSelectedTicketId(ticket.id)}
                                className={`w-full text-left p-6 border-b border-gray-50 transition-all hover:bg-gray-50 group relative ${selectedTicketId === ticket.id ? 'bg-brand-50/50' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[120px]">{ticket.school_name}</span>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${getPriorityColor(ticket.priority)}`}>
                                        {ticket.priority}
                                    </span>
                                </div>
                                <h4 className={`text-sm font-bold mb-1 transition-colors line-clamp-1 ${selectedTicketId === ticket.id ? 'text-brand-900' : 'text-gray-900 group-hover:text-brand-600'
                                    }`}>
                                    {ticket.subject}
                                </h4>
                                <div className="flex items-center gap-3 mt-4">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase ${getStatusColor(ticket.status)}`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
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
            </div>

            {/* Ticket Detail */}
            <div className="flex-1 flex flex-col bg-gray-50/30">
                {selectedTicket ? (
                    <>
                        {/* Header */}
                        <div className="p-8 bg-white border-b border-gray-100">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-2xl font-black text-gray-900">{selectedTicket.subject}</h2>
                                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-tight ${getPriorityColor(selectedTicket.priority)}`}>
                                            {selectedTicket.priority}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
                                        <span className="flex items-center gap-1.5"><School size={14} /> {selectedTicket.school_name}</span>
                                        <span className="flex items-center gap-1.5"><User size={14} /> {selectedTicket.requester_name}</span>
                                        <span className="flex items-center gap-1.5"><Clock size={14} /> {formatDateTime(selectedTicket.created_at)}</span>
                                    </div>
                                </div>
                                {selectedTicket.status !== 'resolved' && (
                                    <button
                                        onClick={() => handleResolve(selectedTicket.id)}
                                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-900/20 active:scale-95 whitespace-nowrap"
                                    >
                                        <CheckCircle size={18} /> Resolve
                                    </button>
                                )}
                            </div>
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative">
                                <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Initial Description
                                </div>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{selectedTicket.description}</p>
                            </div>
                        </div>

                        {/* Thread */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                            {selectedTicket.responses.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm">
                                        <Clock className="text-gray-200" size={32} />
                                    </div>
                                    <p className="text-gray-400 font-medium">No responses yet. Send a reply to start the discussion.</p>
                                </div>
                            ) : (
                                selectedTicket.responses.map((resp: any) => (
                                    <div key={resp.id} className={`flex ${resp.is_admin_response ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-3xl p-6 shadow-sm border ${resp.is_admin_response
                                                ? 'bg-brand-950 text-white border-brand-900 rounded-tr-none shadow-brand-900/20'
                                                : 'bg-white text-gray-900 border-gray-100 rounded-tl-none'
                                            }`}>
                                            <div className="flex items-center justify-between mb-2 gap-8">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${resp.is_admin_response ? 'text-brand-400' : 'text-gray-400'
                                                    }`}>
                                                    {resp.is_admin_response ? 'System Admin' : resp.username}
                                                </span>
                                                <span className={`text-[10px] ${resp.is_admin_response ? 'text-brand-500' : 'text-gray-400'}`}>
                                                    {formatDateTime(resp.created_at).split(',')[1]}
                                                </span>
                                            </div>
                                            <p className="text-sm leading-relaxed">{resp.message}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Reply Box */}
                        {selectedTicket.status !== 'resolved' && (
                            <div className="p-8 bg-white border-t border-gray-100">
                                <form onSubmit={handleRespond} className="relative">
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type your response here..."
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-600 focus:bg-white rounded-3xl p-6 pr-36 min-h-[100px] outline-none transition-all text-gray-900 text-sm font-medium resize-none shadow-inner"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !message.trim()}
                                        className="absolute bottom-4 right-4 flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl font-black hover:bg-brand-700 transition-all shadow-lg shadow-brand-900/30 disabled:opacity-50 disabled:shadow-none active:scale-95"
                                    >
                                        <Send size={18} /> {isSubmitting ? 'Sending...' : 'Reply'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center mb-8 border border-gray-100 shadow-xl shadow-gray-200/50">
                            <ShieldAlert className="text-gray-100" size={64} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-4">Select a Ticket</h2>
                        <p className="text-gray-400 max-w-sm leading-relaxed font-medium">
                            Choose a support request from the queue on the left to view the discussion thread and history.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
