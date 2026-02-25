'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Mail, Plus, Trash2, Send, Inbox, CheckCircle, Circle,
    User, Users, GraduationCap, UserCog, Search, X, Clock,
    ChevronRight, MailOpen, Reply, Paperclip, Archive, Check, CheckCheck,
    MessageSquarePlus, Hash, FileText
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
    useStudents, useTeachers, useStaff, useMessages,
    useCreateMessage, useUpdateMessage, useDeleteMessage,
    useConversations, useCreateConversation, useMarkConversationRead,
    useArchiveConversation
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

// Pre-built message templates
const MESSAGE_TEMPLATES = [
    { label: 'Fee Reminder', subject: 'Outstanding Fee Reminder', body: 'Dear Parent/Guardian,\n\nThis is a friendly reminder regarding your outstanding school fees. Kindly ensure payment is made at your earliest convenience to avoid any disruption to your ward\'s academic activities.\n\nThank you for your prompt attention to this matter.' },
    { label: 'Absence Follow-up', subject: 'Student Absence Notice', body: 'Dear Parent/Guardian,\n\nWe noticed your ward was absent from school today. We hope all is well. Kindly inform us of the reason for the absence so we can update our records accordingly.\n\nThank you for your cooperation.' },
    { label: 'Event Invitation', subject: 'Upcoming School Event', body: 'Dear Parent/Guardian,\n\nWe are pleased to invite you to an upcoming school event. Your presence and support would be greatly appreciated.\n\nPlease find the details below:\n\n[Event Details]\n\nWe look forward to seeing you.\n\nWarm regards.' },
    { label: 'Parent Meeting', subject: 'Parent-Teacher Meeting', body: 'Dear Parent/Guardian,\n\nYou are cordially invited to attend a Parent-Teacher Meeting scheduled for [Date]. This is an opportunity to discuss your ward\'s academic progress and address any concerns.\n\nPlease confirm your attendance at your earliest convenience.\n\nBest regards.' },
    { label: 'Achievement Notice', subject: 'Academic Achievement', body: 'Dear Parent/Guardian,\n\nWe are delighted to inform you that your ward has shown outstanding academic performance. We commend their hard work and dedication.\n\nWe encourage you to continue supporting their academic journey.\n\nCongratulations!' },
];

export const MessagesView: React.FC = () => {
    const { currentRole, currentUser } = useSchoolStore();
    const { addToast } = useToast();

    // Data Hooks
    const { data: students = [] } = useStudents();
    const { data: teachers = [] } = useTeachers();
    const { data: staff = [] } = useStaff();
    const { data: conversations = [], isLoading: isLoadingConversations } = useConversations();

    // State
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const { data: messages = [], isLoading: isLoadingMessages } = useMessages(activeConversationId || '');

    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [messageBody, setMessageBody] = useState('');
    const [showTemplates, setShowTemplates] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Compose form state
    const [recipientType, setRecipientType] = useState<RecipientType>(
        currentRole === 'admin' ? 'teacher' : 'admin'
    );
    const [selectedRecipient, setSelectedRecipient] = useState<number | ''>('');
    const [newConvSubject, setNewConvSubject] = useState('');

    // Mutations
    const { mutate: createConversation, isPending: isCreatingConv } = useCreateConversation();
    const { mutate: sendMessage, isPending: isSending } = useCreateMessage();
    const { mutate: markRead } = useMarkConversationRead();
    const { mutate: archiveConversation } = useArchiveConversation();

    // Selected conversation
    const activeConversation = useMemo(() =>
        conversations.find(c => c.id === activeConversationId),
        [conversations, activeConversationId]);

    // Role-based recipient filtering
    const allRecipients: Recipient[] = useMemo(() => {
        const recipients: Recipient[] = [];
        const seenUserIds = new Set<number>();

        // Teachers (academic staff)
        teachers.forEach((t: Types.Teacher) => {
            if (t.user && !seenUserIds.has(t.user)) {
                seenUserIds.add(t.user);
                recipients.push({ id: String(t.id), userId: t.user, name: t.name, type: 'teacher' });
            }
        });

        // Non-academic staff
        staff.forEach((s: Types.Staff) => {
            if (s.user && !seenUserIds.has(s.user)) {
                seenUserIds.add(s.user);
                const rec: Recipient = { id: String(s.id), userId: s.user, name: s.name, type: 'staff' };
                recipients.push(rec);
                // Also tag admin-like staff for non-admin user targeting
                const role = s.role.toLowerCase();
                const isAdmin = ['principal', 'admin', 'head', 'director', 'manage', 'secretary', 'proprietor', 'accountant', 'bursar', 'registrar', 'clerk', 'office'].some(r => role.includes(r));
                if (isAdmin) {
                    recipients.push({ ...rec, type: 'admin' });
                }
            }
        });

        // Students
        students.forEach((s: Types.Student) => {
            if (s.user) {
                recipients.push({ id: String(s.id), userId: s.user, name: s.names, type: 'student', parentName: s.parent_name });
            }
        });
        return recipients;
    }, [teachers, staff, students]);

    const filteredRecipients = useMemo(() => {
        if (currentRole === 'admin') {
            return allRecipients.filter(r => r.type === recipientType);
        }
        // Non-admin users: show admin staff as recipients
        return allRecipients.filter(r => r.type === 'admin');
    }, [allRecipients, recipientType, currentRole]);

    // ============================================
    // BUG FIX: Working conversation search
    // ============================================
    const filteredConversations = useMemo(() => {
        if (!searchTerm.trim()) return conversations;
        const term = searchTerm.toLowerCase();
        return conversations.filter(conv => {
            const other = getOtherParticipant(conv);
            const otherName = other?.user_name?.toLowerCase() || '';
            const subject = (conv.metadata?.subject || '').toLowerCase();
            const lastMsg = (conv.last_message?.body || '').toLowerCase();
            return otherName.includes(term) || subject.includes(term) || lastMsg.includes(term);
        });
    }, [conversations, searchTerm, currentUser?.id]);

    // Selection Side Effects
    useEffect(() => {
        if (activeConversationId) {
            markRead(activeConversationId);
        }
    }, [activeConversationId]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-select recipient for non-admin users
    useEffect(() => {
        if (isComposeOpen && currentRole !== 'admin') {
            const adminRec = allRecipients.find(r => r.type === 'admin');
            if (adminRec && adminRec.userId) {
                setSelectedRecipient(adminRec.userId);
            } else {
                const staffRec = allRecipients.find(r => r.type === 'staff');
                if (staffRec && staffRec.userId) {
                    setSelectedRecipient(staffRec.userId);
                }
            }
        } else if (isComposeOpen && currentRole === 'admin' && filteredRecipients.length > 0) {
            if (!selectedRecipient) setSelectedRecipient(filteredRecipients[0].userId || '');
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
                // Send the first message into the (new or existing) conversation
                sendMessage({
                    conversation: newConv.id,
                    body: messageBody,
                } as any, {
                    onSuccess: () => {
                        addToast('Message sent!', 'success');
                        setIsComposeOpen(false);
                        setActiveConversationId(newConv.id);
                        resetCompose();
                    }
                });
            },
            onError: () => {
                addToast('Failed to start conversation. Please try again.', 'error');
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
            }
        });
    };

    // ============================================
    // BUG FIX: Archive/Delete conversation
    // ============================================
    const handleArchiveConversation = (convId: string) => {
        archiveConversation(convId, {
            onSuccess: () => {
                addToast('Conversation archived', 'success');
                if (activeConversationId === convId) {
                    setActiveConversationId(null);
                }
            }
        });
    };

    const resetCompose = () => {
        setSelectedRecipient('');
        setNewConvSubject('');
        setMessageBody('');
        setShowTemplates(false);
    };

    const getOtherParticipant = (conv: Types.Conversation) => {
        if (!currentUser?.id) return null;
        return conv.participants.find(p => String(p.user) !== String(currentUser.id));
    };

    // Helper: check if message was read by other participant
    const isMessageRead = (msg: Types.Message, conv: Types.Conversation) => {
        if (String(msg.sender) !== String(currentUser?.id)) return false; // Only show read status for own messages
        const other = getOtherParticipant(conv);
        if (!other?.last_read_at) return false;
        return new Date(other.last_read_at) >= new Date(msg.created_at);
    };

    const applyTemplate = (template: typeof MESSAGE_TEMPLATES[0]) => {
        setNewConvSubject(template.subject);
        setMessageBody(template.body);
        setShowTemplates(false);
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
                            placeholder="Search by name, subject..."
                            className="pl-9 h-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                    {isLoadingConversations ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 italic text-sm">
                            {searchTerm ? 'No matches found' : 'No conversations yet'}
                        </div>
                    ) : (
                        filteredConversations.map(conv => {
                            const other = getOtherParticipant(conv);
                            const isActive = activeConversationId === conv.id;
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => setActiveConversationId(conv.id)}
                                    className={`w-full p-4 text-left transition-colors flex gap-3 ${isActive ? 'bg-brand-50 border-l-4 border-brand-500' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${conv.type === 'GROUP' ? 'bg-purple-100 text-purple-600' : 'bg-brand-100 text-brand-600'}`}>
                                        {conv.type === 'GROUP' ? <Users className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-gray-900 truncate">
                                                {conv.type === 'GROUP' ? (conv.metadata?.subject || 'Group Chat') : (other?.user_name || 'System')}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {conv.last_message ? Utils.formatDate(conv.last_message.created_at) : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-xs text-gray-500 truncate pr-4">
                                                {conv.type !== 'GROUP' ? (conv.metadata?.subject || conv.last_message?.body || 'New Chat') : (conv.last_message?.body || 'No messages')}
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
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${activeConversation.type === 'GROUP' ? 'bg-purple-100 text-purple-600' : 'bg-brand-100 text-brand-600'}`}>
                                    {activeConversation.type === 'GROUP' ? <Users className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 leading-none">
                                        {activeConversation.type === 'GROUP'
                                            ? (activeConversation.metadata?.subject || 'Group Chat')
                                            : (getOtherParticipant(activeConversation)?.user_name || 'System')
                                        }
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {activeConversation.type === 'GROUP'
                                            ? `${activeConversation.participants.length} members`
                                            : (activeConversation.metadata?.subject || 'Direct Messaging')
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-400 hover:text-orange-500"
                                    title="Archive conversation"
                                    onClick={() => handleArchiveConversation(activeConversation.id)}
                                >
                                    <Archive className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Message Explorer */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {isLoadingMessages ? (
                                <div className="text-center text-gray-400 text-sm py-8">Loading messages...</div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-gray-400 text-sm py-8">No messages yet. Say hello!</div>
                            ) : (
                                messages.map(msg => {
                                    const isMe = String(msg.sender) === String(currentUser?.id);
                                    const read = isMe && isMessageRead(msg, activeConversation);
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] group relative`}>
                                                {/* Sender name for group conversations */}
                                                {!isMe && activeConversation.type === 'GROUP' && (
                                                    <p className="text-[10px] text-gray-500 font-medium mb-0.5 ml-3">{msg.sender_name}</p>
                                                )}
                                                <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm'
                                                    }`}>
                                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                                                    {/* Attachment indicator */}
                                                    {msg.attachment_url && (
                                                        <a
                                                            href={msg.attachment_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`flex items-center gap-1.5 mt-2 text-xs ${isMe ? 'text-white/80 hover:text-white' : 'text-brand-600 hover:text-brand-700'}`}
                                                        >
                                                            <FileText className="h-3.5 w-3.5" />
                                                            <span className="underline">View Attachment</span>
                                                        </a>
                                                    )}
                                                </div>
                                                <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <p className="text-[10px] text-gray-400">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    {/* Read receipts */}
                                                    {isMe && (
                                                        read
                                                            ? <CheckCheck className="h-3 w-3 text-blue-500" />
                                                            : <Check className="h-3 w-3 text-gray-400" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
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
                                    <option value="teacher">Teachers</option>
                                    <option value="staff">Non-Academic Staff</option>
                                    <option value="student">Students / Parents</option>
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
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700 text-xs uppercase tracking-wider">Subject / Topic</label>
                            {/* Message Templates */}
                            {currentRole === 'admin' && (
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowTemplates(!showTemplates)}
                                        className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-full uppercase tracking-tighter transition-all"
                                    >
                                        <FileText className="h-3 w-3" /> Templates
                                    </button>
                                    {showTemplates && (
                                        <div className="absolute right-0 top-7 z-50 w-56 bg-white border border-gray-200 rounded-lg shadow-xl py-1">
                                            {MESSAGE_TEMPLATES.map((t, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => applyTemplate(t)}
                                                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors text-gray-700"
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
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
