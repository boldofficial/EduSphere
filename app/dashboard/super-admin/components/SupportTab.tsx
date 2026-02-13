import {
    useSupportTickets, useRespondToTicket, useResolveTicket,
    useCreateSupportTicket, useAdminSchools
} from '@/lib/hooks/use-data';
import * as Types from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, Plus, Ghost } from 'lucide-react';

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
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Support Queue</h2>
                    <p className="text-gray-500 font-medium italic">Manage and respond to school support requests.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-2xl px-6 py-6 font-black shadow-lg shadow-brand-900/20 active:scale-95 transition-all">
                    <Plus className="mr-2" size={20} /> Open Ticket for School
                </Button>
            </div>

            <div className="flex bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden h-[calc(100vh-320px)]">
                {/* Tickets List */}
                <div className="w-1/3 border-r border-gray-100 flex flex-col">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                        <h3 className="font-black text-gray-900 flex items-center gap-2">
                            <MessageSquare className="text-brand-600" size={20} />
                            Ticket Feed
                        </h3>
                        <span className="bg-brand-600 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                            {tickets.filter((t: any) => t.status !== 'resolved').length} Active
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {tickets.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <Ghost size={48} className="mx-auto mb-4 opacity-10" />
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
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase ${getStatusColor(ticket.status)}`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">
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
                <div className="flex-1 flex flex-col bg-gray-50/20 relative">
                    {selectedTicket ? (
                        <>
                            {/* Header */}
                            <div className="p-8 bg-white border-b border-gray-100 z-10 shadow-sm shrink-0">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h2 className="text-2xl font-black text-gray-900">{selectedTicket.subject}</h2>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getPriorityColor(selectedTicket.priority)}`}>
                                                {selectedTicket.priority}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"><School size={12} className="text-brand-600" /> {selectedTicket.school_name}</span>
                                            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"><User size={12} className="text-brand-600" /> {selectedTicket.requester_name}</span>
                                            <span className="flex items-center gap-1.5"><Clock size={12} /> {formatDateTime(selectedTicket.created_at)}</span>
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
                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm font-medium">{selectedTicket.description}</p>
                                </div>
                            </div>

                            {/* Thread - Fixed height with flex-1 */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar pb-32">
                                {selectedTicket.responses.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm">
                                            <Clock className="text-gray-200" size={32} />
                                        </div>
                                        <p className="text-gray-400 font-bold text-sm tracking-tight uppercase">No responses yet</p>
                                    </div>
                                ) : (
                                    selectedTicket.responses.map((resp: any) => (
                                        <div key={resp.id} className={`flex ${resp.is_admin_response ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-3xl p-6 shadow-sm border ${resp.is_admin_response
                                                ? 'bg-brand-900 text-white border-brand-800 rounded-tr-none'
                                                : 'bg-white text-gray-900 border-gray-100 rounded-tl-none'
                                                }`}>
                                                <div className="flex items-center justify-between mb-2 gap-8">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${resp.is_admin_response ? 'text-brand-300' : 'text-gray-400'
                                                        }`}>
                                                        {resp.is_admin_response ? 'Global Admin' : resp.username}
                                                    </span>
                                                    <span className={`text-[10px] ${resp.is_admin_response ? 'text-brand-400' : 'text-gray-400'}`}>
                                                        {formatDateTime(resp.created_at).split(',')[1]}
                                                    </span>
                                                </div>
                                                <p className="text-sm leading-relaxed font-medium">{resp.message}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Reply Box - Absolute fixed at bottom within relative detail pane */}
                            {selectedTicket.status !== 'resolved' && (
                                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-gray-50 to-transparent z-20">
                                    <form onSubmit={handleRespond} className="relative group">
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Write your response to the school..."
                                            className="w-full bg-white border-2 border-transparent focus:border-brand-600 rounded-[32px] p-6 pr-44 min-h-[100px] outline-none transition-all text-gray-900 text-sm font-bold shadow-xl shadow-gray-200/50 resize-none hover:border-gray-200"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !message.trim()}
                                            className="absolute bottom-4 right-4 flex items-center gap-2 px-8 py-4 bg-brand-600 text-white rounded-2xl font-black hover:bg-brand-700 transition-all shadow-lg shadow-brand-900/40 disabled:opacity-50 disabled:shadow-none active:scale-95"
                                        >
                                            <Send size={18} /> {isSubmitting ? 'Sending...' : 'Send Reply'}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center mb-8 border border-gray-100 shadow-xl shadow-gray-200/50 group hover:scale-105 transition-all">
                                <MessageSquare className="text-gray-100 group-hover:text-brand-100 transition-colors" size={64} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Select a Support Request</h2>
                            <p className="text-gray-400 max-w-sm leading-relaxed font-bold text-sm uppercase tracking-tight">
                                Choose a ticket from the feed on the left to start collaborating with the school agent.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-brand-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-xl p-10 rounded-[50px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Open Internal Ticket</h3>
                                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Initiate support for a specific school</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-4 hover:bg-gray-100 rounded-[24px] transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTicket} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Target School</label>
                                <select
                                    className="w-full p-5 rounded-[24px] border-2 border-gray-100 focus:border-brand-600 bg-gray-50 outline-none text-sm font-black appearance-none transition-all shadow-inner"
                                    value={newTicket.school_id}
                                    onChange={e => setNewTicket(prev => ({ ...prev, school_id: e.target.value }))}
                                    required
                                >
                                    <option value="">Select School...</option>
                                    {schools.map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.domain})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Topic / Subject</label>
                                <Input
                                    placeholder="What is this regarding?"
                                    value={newTicket.subject}
                                    onChange={e => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                                    required
                                    className="p-5 rounded-[24px] border-2 border-gray-100 focus:border-brand-600 focus:ring-0 transition-all text-sm font-black shadow-inner"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Category</label>
                                    <select
                                        className="w-full p-5 rounded-[24px] border-2 border-gray-100 focus:border-brand-600 bg-gray-50 outline-none text-sm font-black appearance-none transition-all shadow-inner"
                                        value={newTicket.category}
                                        onChange={e => setNewTicket(prev => ({ ...prev, category: e.target.value as any }))}
                                    >
                                        <option value="technical">Technical Issue</option>
                                        <option value="billing">Billing & Subscription</option>
                                        <option value="customization">Customization</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Urgency</label>
                                    <select
                                        className="w-full p-5 rounded-[24px] border-2 border-gray-100 focus:border-brand-600 bg-gray-50 outline-none text-sm font-black appearance-none transition-all shadow-inner"
                                        value={newTicket.priority}
                                        onChange={e => setNewTicket(prev => ({ ...prev, priority: e.target.value as any }))}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Message Content</label>
                                <textarea
                                    className="w-full p-6 rounded-[32px] border-2 border-gray-100 focus:border-brand-600 bg-gray-50 outline-none text-sm font-bold min-h-[140px] resize-none transition-all shadow-inner"
                                    placeholder="Describe the situation in detail..."
                                    value={newTicket.description}
                                    onChange={e => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="outline" className="flex-1 rounded-[24px] py-7 font-black text-gray-400 hover:text-gray-900 border-2" onClick={() => setIsCreateModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-[24px] py-7 font-black shadow-xl shadow-brand-900/20 active:scale-95 transition-all">
                                    {isSubmitting ? 'Creating...' : 'Open Ticket'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
