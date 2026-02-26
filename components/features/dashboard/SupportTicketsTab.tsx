'use client';

import React, { useState } from 'react';
import {
    LifeBuoy, Clock, CheckCircle, AlertCircle,
    MessageSquare, Send, Reply, Check,
    MoreVertical, Search, Filter, School, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/providers/toast-provider';
import apiClient from '@/lib/api-client';

interface SupportTicket {
    id: number;
    school: { name: string; id: number };
    user: { username: string; email: string };
    subject: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    created_at: string;
    responses: any[];
}

interface SupportTicketsTabProps {
    tickets: SupportTicket[];
}

export const SupportTicketsTab: React.FC<SupportTicketsTabProps> = ({ tickets: initialTickets }) => {
    const [tickets, setTickets] = useState(initialTickets);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useToast();

    const filteredTickets = tickets.filter(t =>
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRespond = async () => {
        if (!selectedTicket || !replyMessage.trim()) return;
        try {
            const res = await apiClient.post(`schools/support/tickets/${selectedTicket.id}/respond/`, {
                message: replyMessage
            });
            addToast('Response sent successfully', 'success');
            setReplyMessage('');
            // Refresh logic - ideally we just update local state
            const updatedTicket = { ...selectedTicket, responses: [...selectedTicket.responses, res.data] };
            if (selectedTicket.status === 'open') updatedTicket.status = 'in_progress';
            setSelectedTicket(updatedTicket);
            setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
        } catch {
            addToast('Failed to send response', 'error');
        }
    };

    const handleResolve = async () => {
        if (!selectedTicket) return;
        try {
            await apiClient.post(`schools/support/tickets/${selectedTicket.id}/resolve/`);
            addToast('Ticket marked as resolved', 'success');
            const updatedTicket = { ...selectedTicket, status: 'resolved' as const };
            setSelectedTicket(updatedTicket);
            setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
        } catch {
            addToast('Failed to resolve ticket', 'error');
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'open': return 'bg-rose-100 text-rose-700 ring-rose-200';
            case 'in_progress': return 'bg-amber-100 text-amber-700 ring-amber-200';
            case 'resolved': return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
            default: return 'bg-gray-100 text-gray-700 ring-gray-200';
        }
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-rose-600';
            case 'high': return 'text-amber-600';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="flex h-[800px] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Sidebar: Ticket List */}
            <div className={`flex-col bg-white rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden ${selectedTicket ? 'hidden lg:flex w-1/3' : 'flex w-full'}`}>
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <LifeBuoy className="text-brand-600" />
                            Helpdesk
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {filteredTickets.length} Tickets
                        </span>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                            placeholder="Search tickets, schools, or users..."
                            className="pl-10 h-10 rounded-xl bg-gray-50 border-gray-100 text-xs"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    {filteredTickets.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-4">
                            <div className="p-4 bg-gray-50 rounded-full">
                                <Search size={32} strokeWidth={1} />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest">No tickets found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {filteredTickets.map(ticket => (
                                <button
                                    key={ticket.id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className={`w-full text-left p-6 hover:bg-gray-50 transition-all group relative ${selectedTicket?.id === ticket.id ? 'bg-brand-50/50 after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1 after:bg-brand-500' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ${getStatusStyle(ticket.status)}`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400 font-mono">
                                            #{ticket.id}
                                        </span>
                                    </div>
                                    <h4 className="font-black text-sm text-gray-900 mb-1 line-clamp-1 group-hover:text-brand-600 transition-colors">{ticket.subject}</h4>
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <School size={10} />
                                            {ticket.school.name}
                                        </div>
                                        <span>•</span>
                                        <div>{new Date(ticket.created_at).toLocaleDateString()}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content: Ticket Detail */}
            <div className={`flex-1 bg-white rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col ${selectedTicket ? 'flex' : 'hidden lg:flex items-center justify-center'}`}>
                {selectedTicket ? (
                    <>
                        {/* Header */}
                        <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="lg:hidden"
                                    onClick={() => setSelectedTicket(null)}
                                >
                                    <Reply size={20} className="rotate-180" />
                                </Button>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{selectedTicket.subject}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                        <span className={`flex items-center gap-1 ${getPriorityStyle(selectedTicket.priority)}`}>
                                            <AlertCircle size={12} /> {selectedTicket.priority} Priority
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} /> {new Date(selectedTicket.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {selectedTicket.status !== 'resolved' && (
                                    <Button onClick={handleResolve} variant="outline" className="h-10 gap-2 border-emerald-100 text-emerald-600 hover:bg-emerald-50 bg-white shadow-sm">
                                        <CheckCircle size={16} /> Mark Resolved
                                    </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400">
                                    <MoreVertical size={20} />
                                </Button>
                            </div>
                        </div>

                        {/* Thread */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                            {/* Original Description */}
                            <div className="flex gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0 border border-brand-200">
                                    <User size={20} />
                                </div>
                                <div className="space-y-2 max-w-[80%]">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-sm text-gray-900">{selectedTicket.user.username}</span>
                                        <span className="text-[10px] font-bold text-gray-400">{selectedTicket.user.email}</span>
                                    </div>
                                    <div className="p-5 bg-gray-50 rounded-3xl rounded-tl-none border border-gray-100 text-sm text-gray-700 leading-relaxed shadow-sm">
                                        {selectedTicket.description}
                                    </div>
                                </div>
                            </div>

                            {/* Responses */}
                            {selectedTicket.responses.map((res: any) => (
                                <div key={res.id} className={`flex gap-4 ${res.is_admin_response ? 'flex-row-reverse' : ''}`}>
                                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border ${res.is_admin_response ? 'bg-brand-900 text-white border-brand-950 shadow-lg shadow-brand-900/10' : 'bg-brand-100 text-brand-600 border-brand-200'
                                        }`}>
                                        {res.is_admin_response ? <ShieldCheck size={20} /> : <User size={20} />}
                                    </div>
                                    <div className={`space-y-2 max-w-[80%] ${res.is_admin_response ? 'text-right' : ''}`}>
                                        <div className="flex items-center gap-2 flex-row-reverse">
                                            <span className="font-black text-sm text-gray-900">
                                                {res.is_admin_response ? 'Support Team' : res.user_name}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400">
                                                {new Date(res.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className={`p-5 rounded-3xl text-sm leading-relaxed shadow-sm ${res.is_admin_response
                                                ? 'bg-brand-600 text-white rounded-tr-none'
                                                : 'bg-gray-50 text-gray-700 rounded-tl-none border border-gray-100'
                                            }`}>
                                            {res.message}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick Actions & Input */}
                        <div className="p-8 border-t border-gray-100 bg-gray-50/50">
                            <div className="mb-4 flex flex-wrap gap-2">
                                <button
                                    onClick={() => setReplyMessage('Hello, we have received your request and are looking into it.')}
                                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[10px] font-black uppercase tracking-tight text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-all shadow-sm"
                                >
                                    Quick Receive
                                </button>
                                <button
                                    onClick={() => setReplyMessage('This issue has been resolved. Please check and let us know if you need any further assistance.')}
                                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[10px] font-black uppercase tracking-tight text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-all shadow-sm"
                                >
                                    Quick Resolve
                                </button>
                                <button
                                    onClick={() => setReplyMessage('Could you please provide more details or a screenshot of the error?')}
                                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[10px] font-black uppercase tracking-tight text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-all shadow-sm"
                                >
                                    Request Info
                                </button>
                            </div>
                            <div className="relative group">
                                <textarea
                                    placeholder="Type your response..."
                                    className="w-full h-32 p-6 bg-white border border-gray-200 rounded-[32px] text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all resize-none shadow-inner pr-24"
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                />
                                <div className="absolute right-4 bottom-4">
                                    <Button
                                        className="rounded-2xl h-12 w-12 p-0 bg-brand-600 hover:bg-brand-500 shadow-xl shadow-brand-500/20 group-active:scale-95 transition-transform"
                                        onClick={handleRespond}
                                        disabled={!replyMessage.trim()}
                                    >
                                        <Send size={20} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center p-12 space-y-4">
                        <div className="h-20 w-20 bg-gray-50 rounded-[32px] mx-auto flex items-center justify-center text-gray-200">
                            <MessageSquare size={40} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h4 className="font-black text-gray-900 text-xl tracking-tight">Select a Ticket</h4>
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Review school technical requests</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

import { ShieldCheck } from 'lucide-react';
