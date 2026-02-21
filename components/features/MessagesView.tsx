'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    Mail, Plus, Trash2, Send, Inbox, CheckCircle, Circle,
    User, Users, GraduationCap, UserCog, Search, X, Clock,
    ChevronRight, MailOpen, Reply
} from 'lucide-react';
import { useSchoolStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/providers/toast-provider';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';
import {
    useStudents, useStaff, useMessages,
    useCreateMessage, useUpdateMessage, useDeleteMessage,
    useConversations, useCreateConversation, useMarkConversationRead
} from '@/lib/hooks/use-data';

type RecipientType = 'teacher' | 'student' | 'staff' | 'parent' | 'admin';

interface Recipient {
    id: string;
    userId?: number | null; // The linked User FK for messaging
    name: string;
    email?: string;
    type: RecipientType;
    parentName?: string; // For students - to message their parent
}

export const MessagesView: React.FC = () => {
    const { currentRole, currentUser } = useSchoolStore();
    const { addToast } = useToast();

    // Data Hooks
    const { data: students = [] } = useStudents();
    const { data: staff = [] } = useStaff();
    const { data: conversations = [], isLoading: isLoadingConversations } = useConversations();

    // State
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const { data: messages = [], isLoading: isLoadingMessages } = useMessages(activeConversationId || '');

    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [messageBody, setMessageBody] = useState('');

    // Compose form state
    const [recipientType, setRecipientType] = useState<RecipientType>(
        currentRole === 'admin' ? 'staff' : 'admin'
    );
    const [selectedRecipient, setSelectedRecipient] = useState<number | ''>('');
    const [newConvSubject, setNewConvSubject] = useState('');

    // Mutations
    const { mutate: createConversation, isPending: isCreatingConv } = useCreateConversation();
    const { mutate: sendMessage, isPending: isSending } = useCreateMessage();
    const { mutate: markRead } = useMarkConversationRead();

    // Selected conversation
    const activeConversation = useMemo(() =>
        conversations.find(c => c.id === activeConversationId),
        [conversations, activeConversationId]);

    // Role-based recipient filtering (same as before)
    const allRecipients: Recipient[] = useMemo(() => {
        const recipients: Recipient[] = [];
        // Staff/Teachers
        staff.forEach((s: Types.Staff) => {
            if (s.user) {
                const rec = { id: String(s.id), userId: s.user, name: s.name, type: 'staff' as any };
                recipients.push(rec);
                // Broaden admin detection: principal, admin, head, director, management, bursar, registrar, etc.
                const role = s.role.toLowerCase();
                const isAdmin = ['principal', 'admin', 'head', 'director', 'manage', 'secretary', 'proprietor', 'accountant', 'bursar', 'registrar', 'clerk', 'office'].some(r => role.includes(r));
                if (isAdmin) {
                    recipients.push({ ...rec, type: 'admin' });
                }
            }
        });
        // Students/Parents
        students.forEach((s: Types.Student) => {
            if (s.user) {
                recipients.push({ id: String(s.id), userId: s.user, name: s.names, type: 'student', parentName: s.parent_name });
            }
        });
        return recipients;
    }, [staff, students]);

    const filteredRecipients = useMemo(() => {
        if (currentRole === 'admin') {
            // For admins, merge Teachers (admin/academic) and Non-Academic Staff 
            // but keep Students separate for clarity if needed
            if (recipientType === 'staff' || recipientType === 'admin') {
                return allRecipients.filter(r => r.type === 'staff' || r.type === 'admin').reduce((unique: any[], r) => {
                    if (!unique.find(u => u.userId === r.userId)) unique.push(r);
                    return unique;
                }, []);
            }
        }
        return allRecipients.filter(r => r.type === recipientType);
    }, [allRecipients, recipientType, currentRole]);

    // Selection Side Effects
    useEffect(() => {
        if (activeConversationId) {
            markRead(activeConversationId);
        }
    }, [activeConversationId]);

    // Auto-select recipient for non-admin users
    useEffect(() => {
        if (isComposeOpen && currentRole !== 'admin') {
            // Priority 1: Explicitly flagged Admin roles
            const adminRec = allRecipients.find(r => r.type === 'admin');
            if (adminRec && adminRec.userId) {
                setSelectedRecipient(adminRec.userId);
            } else {
                // Priority 2: Any staff member (as a fallback for "Administration")
                const staffRec = allRecipients.find(r => r.type === 'staff');
                if (staffRec && staffRec.userId) {
                    setSelectedRecipient(staffRec.userId);
                }
            }
        } else if (isComposeOpen && currentRole === 'admin' && filteredRecipients.length > 0) {
            // Pre-select first valid recipient for admin convenience if not already set
            if (!selectedRecipient) setSelectedRecipient(filteredRecipients[0].userId);
        }
    }, [isComposeOpen, currentRole, allRecipients, filteredRecipients, selectedRecipient]);

    const handleStartConversation = () => {
        if (!selectedRecipient) {
            addToast('Please select a recipient', 'warning');
            return;
        }
        if (!newConvSubject.trim()) {
            addToast('Please enter a subject', 'warning');
            return;
        }
        if (!messageBody.trim()) {
            addToast('Please enter your message', 'warning');
            return;
        }

        createConversation({
            type: 'DIRECT',
            participant_ids: [Number(selectedRecipient)],
            metadata: { subject: newConvSubject }
        }, {
            onSuccess: (newConv: Types.Conversation) => {
                // Now send the first message
                sendMessage({
                    conversation: newConv.id,
                    body: messageBody,
                } as any, {
                    onSuccess: () => {
                        addToast('Conversation started!', 'success');
                        setIsComposeOpen(false);
                        setActiveConversationId(newConv.id);
                        resetCompose();
                    }
                });
            }
        });
    };

    const handleSendMessage = () => {
        if (!activeConversationId || !messageBody.trim()) return;

        sendMessage({
            conversation: activeConversationId,
            body: messageBody,
        } as any, {
            onSuccess: () => {
                setMessageBody('');
                // Scroll to bottom logic could go here
            }
        });
    };

    const resetCompose = () => {
        setSelectedRecipient('');
        setNewConvSubject('');
        setMessageBody('');
    };

    const getOtherParticipant = (conv: Types.Conversation) => {
        if (!currentUser?.id) return null;
        return conv.participants.find(p => String(p.user) !== String(currentUser.id));
    };

    return (
        <div className="flex h-[calc(100vh-12rem)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Sidebar: Conversation List */}
            <div className="w-80 border-r border-gray-100 flex flex-col">
                <div className="p-4 border-b border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">Inbox</h2>
                        <Button variant="ghost" size="sm" onClick={() => setIsComposeOpen(true)} className="text-brand-600 hover:text-brand-700 hover:bg-brand-50">
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search chats..."
                            className="pl-9 h-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                    {conversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 italic text-sm">
                            No conversations yet
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const other = getOtherParticipant(conv);
                            const isActive = activeConversationId === conv.id;
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => setActiveConversationId(conv.id)}
                                    className={`w-full p-4 text-left transition-colors flex gap-3 ${isActive ? 'bg-brand-50 border-l-4 border-brand-500' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-gray-900 truncate">
                                                {other?.user_name || 'System'}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {conv.last_message ? Utils.formatDate(conv.last_message.created_at) : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-xs text-gray-500 truncate pr-4">
                                                {conv.metadata?.subject || conv.last_message?.body || 'New Chat'}
                                            </p>
                                            {conv.unread_count > 0 && (
                                                <span className="bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                    {conv.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Main: Message Thread */}
            <div className="flex-1 flex flex-col bg-gray-50/30">
                {activeConversation ? (
                    <>
                        {/* Thread Header */}
                        <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 leading-none">
                                        {getOtherParticipant(activeConversation)?.user_name || 'System'}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {activeConversation.metadata?.subject || 'Direct Messaging'}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-500">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Message Explorer */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map(msg => {
                                const isMe = String(msg.sender) === String(currentUser?.id);
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] group relative`}>
                                            <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm'
                                                }`}>
                                                <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                                            </div>
                                            <p className={`text-[10px] mt-1 text-gray-400 ${isMe ? 'text-right' : 'text-left'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Reply Box */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <div className="flex items-end gap-2">
                                <textarea
                                    value={messageBody}
                                    onChange={(e) => setMessageBody(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 min-h-[44px] max-h-32 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all text-sm resize-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={isSending || !messageBody.trim()}
                                    className="h-11 w-11 rounded-full p-0 flex items-center justify-center shrink-0"
                                >
                                    <Send className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Mail className="h-10 w-10 text-gray-200" />
                        </div>
                        <p className="text-lg font-medium">Select a conversation to read</p>
                        <p className="text-sm">Or start a new one to communicate with {currentRole === 'admin' ? 'Staff/Parents' : 'School Admin'}</p>
                    </div>
                )}
            </div>

            {/* Compose Modal */}
            <Modal
                isOpen={isComposeOpen}
                onClose={() => { setIsComposeOpen(false); resetCompose(); }}
                title="Start New Conversation"
            >
                <div className="space-y-4">
                    {currentRole === 'admin' ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-xs uppercase tracking-wider">Target</label>
                                <Select
                                    value={recipientType}
                                    onChange={(e) => {
                                        setRecipientType(e.target.value as RecipientType);
                                        setSelectedRecipient('');
                                    }}
                                >
                                    <option value="staff">Staff Members</option>
                                    <option value="student">Students/Parents</option>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-xs uppercase tracking-wider italic">Recipient</label>
                                <Select
                                    value={selectedRecipient}
                                    onChange={(e) => setSelectedRecipient(Number(e.target.value))}
                                >
                                    <option value="">Select...</option>
                                    {filteredRecipients.map(r => (
                                        <option key={r.id} value={r.userId ?? ''}>
                                            {r.type === 'student' ? `${r.name} (${r.parentName || 'Parent'})` : r.name}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-brand-50 p-4 rounded-xl flex items-center gap-3 border border-brand-100">
                            <div className="h-10 w-10 bg-brand-100 rounded-full flex items-center justify-center">
                                <UserCog className="h-5 w-5 text-brand-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-brand-900 text-sm">School Administration</h4>
                                <p className="text-xs text-brand-600">Secure direct channel to school management</p>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 text-xs uppercase tracking-wider">Subject / Topic</label>
                        <Input
                            value={newConvSubject}
                            onChange={(e) => setNewConvSubject(e.target.value)}
                            placeholder="e.g. Enquiry about fees, Leave request..."
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700 text-xs uppercase tracking-wider">Message Content</label>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!newConvSubject.trim()) return addToast('Please enter a subject', 'info');
                                    addToast('Generating AI Draft...', 'info');
                                    try {
                                        const res = await (await import('@/lib/api-client')).default.post('/messages/ai-draft/', {
                                            topic: newConvSubject.trim(),
                                            recipient_type: recipientType === 'student' ? 'Parents' : recipientType,
                                            tone: 'formal'
                                        });
                                        if (res.data?.draft) setMessageBody(res.data.draft);
                                    } catch { addToast('AI failed', 'error'); }
                                }}
                                className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-full uppercase tracking-tighter transition-all"
                            >
                                ✨ Magic Draft
                            </button>
                        </div>
                        <textarea
                            value={messageBody}
                            onChange={(e) => setMessageBody(e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm resize-none"
                            placeholder="Describe your enquiry here..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button variant="secondary" onClick={() => setIsComposeOpen(false)}>Cancel</Button>
                        <Button onClick={handleStartConversation} disabled={isCreatingConv}>
                            {isCreatingConv ? 'Creating...' : 'Start Conversation'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
