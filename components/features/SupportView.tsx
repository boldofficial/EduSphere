'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle,
  Clock,
  Plus,
  Ghost,
  X,
  HelpCircle,
  ChevronRight,
  Hash,
} from 'lucide-react';
import {
  useSupportTickets,
  useCreateSupportTicket,
  useRespondToTicket,
  useResolveTicket,
} from '@/lib/hooks/use-data';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/providers/toast-provider';

export const SupportView: React.FC = () => {
  const confirm = useConfirm();
  const { addToast } = useToast();
  const { data: tickets = [], isLoading, refetch } = useSupportTickets();
  const createMutation = useCreateSupportTicket();
  const respondMutation = useRespondToTicket();
  const resolveMutation = useResolveTicket();

  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'technical',
    priority: 'medium',
    description: '',
  });
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTicket = tickets.find((t: any) => t.id === selectedTicketId);

  const formatDateTime = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(newTicket as any);
      setIsCreateModalOpen(false);
      setNewTicket({ subject: '', category: 'technical', priority: 'medium', description: '' });
      refetch();
    } catch {
      addToast('Failed to create ticket', 'error');
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
    } catch {
      addToast('Failed to send reply', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (id: number) => {
    if (!(await confirm('Are you sure you want to mark this issue as resolved?'))) return;
    try {
      await resolveMutation.mutateAsync(id);
      refetch();
    } catch {
      addToast('Failed to resolve ticket', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'open':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading)
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );

  return (
    <div className="flex flex-col gap-6 h-full max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Support & Help Desk
          </h1>
          <p className="text-gray-500 font-medium">
            Get assistance and request platform features directly.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-xl px-7 py-6 font-bold shadow-md hover:shadow-lg transition-all active:scale-95 bg-brand-600 hover:bg-brand-700"
        >
          <Plus className="mr-2" size={20} /> New Support Ticket
        </Button>
      </div>

      {/* Main Interface Layout */}
      <div className="flex bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex-1 min-h-[600px] h-[calc(100vh-280px)]">
        {/* Tickets Sidebar */}
        <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/30">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <span className="font-bold text-gray-400 uppercase tracking-widest text-xs">
              Your Tickets
            </span>
            <span className="text-xs font-bold text-gray-500">{tickets.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {tickets.length === 0 ? (
              <div className="p-10 text-center opacity-40">
                <Ghost size={32} className="mx-auto mb-3" />
                <p className="text-xs font-bold">No tickets yet.</p>
              </div>
            ) : (
              tickets.map((ticket: any) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`w-full text-left p-5 border-b border-gray-50 transition-all hover:bg-white relative group ${selectedTicketId === ticket.id ? 'bg-white' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded border uppercase tracking-widest ${ticket.priority === 'urgent' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                    >
                      {ticket.priority}
                    </span>
                    <span className="text-xs text-gray-300 font-bold uppercase tracking-widest">
                      #{ticket.id.toString().slice(-4)}
                    </span>
                  </div>
                  <h4
                    className={`text-sm font-bold mb-3 line-clamp-1 transition-colors ${selectedTicketId === ticket.id ? 'text-brand-600' : 'text-gray-900 group-hover:text-brand-600'}`}
                  >
                    {ticket.subject}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${getStatusBadge(ticket.status)}`}
                    >
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <div className="flex items-center text-gray-400 text-xs font-bold">
                      {formatDateTime(ticket.updated_at).split(',')[0]}
                      <ChevronRight
                        size={14}
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
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

        {/* Ticket Details & Discussion */}
        <div className="flex-1 flex flex-col relative bg-white overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Detailed Header */}
              <div className="p-8 border-b border-gray-100 shrink-0">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash size={16} className="text-brand-400" />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Case ID: {selectedTicket.id}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">{selectedTicket.subject}</h2>
                    <div className="flex items-center gap-4 pt-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                        <HelpCircle size={14} className="text-brand-600" />
                        <span className="capitalize">{selectedTicket.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 border-l border-gray-200 pl-4">
                        <Clock size={14} /> {formatDateTime(selectedTicket.created_at)}
                      </div>
                    </div>
                  </div>
                  {selectedTicket.status !== 'resolved' && (
                    <Button
                      variant="outline"
                      onClick={() => handleResolve(selectedTicket.id)}
                      className="rounded-xl border-green-200 text-green-700 bg-green-50 hover:bg-green-100 hover:border-green-300 font-bold transition-all text-xs"
                    >
                      <CheckCircle size={16} className="mr-2" /> Mark Resolved
                    </Button>
                  )}
                </div>
                <div className="p-6 bg-gray-50/80 rounded-2xl border border-gray-100 relative group">
                  <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-gray-100 rounded-lg text-xs font-black text-gray-400 uppercase tracking-widest shadow-sm">
                    Initial Report
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>
              </div>

              {/* Thread - Flex 1 handles the scrolling correctly */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar pb-32">
                {selectedTicket.responses.length === 0 ? (
                  <div className="py-20 text-center opacity-30">
                    <MessageSquare size={48} className="mx-auto mb-4" />
                    <p className="text-sm font-bold uppercase tracking-wider">
                      Awaiting response from Support Agent
                    </p>
                  </div>
                ) : (
                  selectedTicket.responses.map((resp: any) => (
                    <div
                      key={resp.id}
                      className={`flex ${resp.is_admin_response ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className="space-y-2 max-w-[85%]">
                        <div
                          className={`flex items-center gap-2 mb-1 px-1 ${resp.is_admin_response ? 'justify-start' : 'justify-end flex-row-reverse'}`}
                        >
                          <span className="text-xs font-black text-gray-400 capitalize">
                            {resp.is_admin_response ? 'Support Agent' : 'You'}
                          </span>
                          <span className="text-xs text-gray-300 font-bold">
                            {formatDateTime(resp.created_at).split(',')[1]}
                          </span>
                        </div>
                        <div
                          className={`rounded-2xl p-5 shadow-sm border text-sm leading-relaxed font-medium ${
                            resp.is_admin_response
                              ? 'bg-brand-900 text-white border-brand-800'
                              : 'bg-white text-gray-900 border-gray-100'
                          }`}
                        >
                          {resp.message}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Sticky Interaction Area */}
              {selectedTicket.status !== 'resolved' && (
                <div className="absolute bottom-0 left-0 right-0 p-8 pt-10 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
                  <form onSubmit={handleRespond} className="relative group pointer-events-auto">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="w-full bg-white border-2 border-gray-200 focus:border-brand-600 rounded-3xl p-5 pr-36 min-h-[90px] outline-none transition-all text-gray-900 text-sm font-medium shadow-xl shadow-gray-200/50 resize-none"
                    />
                    <Button
                      type="submit"
                      disabled={isSubmitting || !replyMessage.trim()}
                      className="absolute bottom-4 right-4 rounded-xl px-6 py-4 bg-brand-600 hover:bg-brand-700 text-white font-black shadow-lg shadow-brand-900/10 active:scale-95 disabled:opacity-50"
                    >
                      <Send size={18} className="mr-2" /> {isSubmitting ? 'Sending...' : 'Send'}
                    </Button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center bg-gray-50/10">
              <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center mb-8 border border-gray-100 shadow-xl shadow-gray-100/50">
                <MessageSquare className="text-gray-100" size={56} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
                Support Interaction
              </h3>
              <p className="text-gray-400 max-w-sm font-medium leading-relaxed">
                Select a ticket from the sidebar to view the conversation thread or send a
                follow-up.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Creation Flow Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-xl p-0 rounded-[40px] shadow-2xl border-none overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 border-b border-gray-50">
              <div className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                    Open New Ticket
                  </h3>
                  <p className="text-gray-500 font-medium text-sm">
                    Tell us more about your issue or request.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-300 hover:text-gray-900"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                    Overall Subject
                  </label>
                  <Input
                    placeholder="Briefly describe the theme"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket((prev) => ({ ...prev, subject: e.target.value }))}
                    required
                    className="p-6 h-14 rounded-2xl border-2 border-gray-100 focus:border-brand-600 transition-all text-sm font-bold shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                      Category
                    </label>
                    <select
                      className="w-full p-4 h-14 rounded-2xl border-2 border-gray-100 focus:border-brand-600 bg-gray-50 outline-none text-sm font-bold appearance-none transition-all shadow-sm"
                      value={newTicket.category}
                      onChange={(e) =>
                        setNewTicket((prev) => ({ ...prev, category: e.target.value as any }))
                      }
                    >
                      <option value="technical">Technical Issue</option>
                      <option value="billing">Billing & Finance</option>
                      <option value="customization">Customization</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                      Priority
                    </label>
                    <select
                      className="w-full p-4 h-14 rounded-2xl border-2 border-gray-100 focus:border-brand-600 bg-gray-50 outline-none text-sm font-bold appearance-none transition-all shadow-sm"
                      value={newTicket.priority}
                      onChange={(e) =>
                        setNewTicket((prev) => ({ ...prev, priority: e.target.value as any }))
                      }
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                    Describe in detail
                  </label>
                  <textarea
                    className="w-full p-6 h-40 rounded-3xl border-2 border-gray-100 focus:border-brand-600 bg-gray-50 outline-none text-sm font-bold resize-none transition-all shadow-sm"
                    placeholder="Provide context, steps to reproduce, or requirements..."
                    value={newTicket.description}
                    onChange={(e) =>
                      setNewTicket((prev) => ({ ...prev, description: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-2xl h-14 font-black border-gray-200"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-2xl h-14 font-black shadow-lg shadow-brand-900/10 active:scale-95 transition-all bg-brand-600"
                  >
                    {isSubmitting ? 'Creating...' : 'Submit Support Ticket'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
