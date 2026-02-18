'use client';

import React, { useState, useMemo } from 'react';
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
    useStudents, useTeachers, useStaff, useMessages,
    useCreateMessage, useUpdateMessage, useDeleteMessage
} from '@/lib/hooks/use-data';

type RecipientType = 'teacher' | 'student' | 'staff' | 'parent';

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
    const { data: teachers = [] } = useTeachers();
    const { data: staff = [] } = useStaff();
    const { data: messages = [] } = useMessages();

    // Mutations
    const { mutate: createMessage, isPending: isSending } = useCreateMessage();
    const { mutate: updateMessage } = useUpdateMessage();
    const { mutate: deleteMessage } = useDeleteMessage();

    // State
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [viewingMessage, setViewingMessage] = useState<Types.Message | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [recipientFilter, setRecipientFilter] = useState<'all' | RecipientType>('all');
    const [viewMode, setViewMode] = useState<'sent' | 'inbox'>('sent');

    // Compose form state
    const [recipientType, setRecipientType] = useState<RecipientType>('teacher');
    const [selectedRecipient, setSelectedRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    // Only admin can access this view
    if (currentRole !== 'admin') {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">You don't have permission to access this page.</p>
            </div>
        );
    }

    // Build recipients list
    const allRecipients: Recipient[] = useMemo(() => {
        const recipients: Recipient[] = [];

        // Teachers
        teachers.forEach((t: Types.Teacher) => {
            recipients.push({
                id: t.id,
                userId: t.user,
                name: t.name,
                email: t.email,
                type: 'teacher'
            });
        });

        // Staff
        staff.forEach((s: Types.Staff) => {
            recipients.push({
                id: s.id,
                userId: s.user,
                name: s.name,
                email: s.email,
                type: 'staff'
            });
        });

        // Students (for messaging their parents)
        students.forEach((s: Types.Student) => {
            recipients.push({
                id: s.id,
                userId: s.user,
                name: s.names,
                email: s.parent_email,
                type: 'student',
                parentName: s.parent_name
            });
        });

        return recipients;
    }, [teachers, staff, students]);

    // Filtered recipients for compose dropdown
    const filteredRecipients = useMemo(() => {
        return allRecipients.filter(r => r.type === recipientType);
    }, [allRecipients, recipientType]);

    // Get recipient name from message (backend now provides sender_name/recipient_name)
    const getDisplayName = (message: Types.Message, mode: 'sent' | 'inbox') => {
        if (mode === 'sent') {
            return message.recipient_name || 'Unknown';
        }
        return message.sender_name || 'Unknown';
    };

    // Filter messages
    const filteredMessages = useMemo(() => {
        return messages
            .filter((m: Types.Message) => {
                // For sent view, show messages sent by current user
                if (viewMode === 'sent' && String(m.sender) !== String(currentUser?.id)) return false;
                // For inbox view, show messages received
                if (viewMode === 'inbox' && String(m.recipient) !== String(currentUser?.id)) return false;

                // Apply recipient filter
                if (recipientFilter !== 'all' && m.recipient_role !== recipientFilter) return false;

                // Apply search
                if (searchTerm) {
                    const search = searchTerm.toLowerCase();
                    const name = (m.recipient_name || m.sender_name || '').toLowerCase();
                    return (
                        m.subject.toLowerCase().includes(search) ||
                        m.body.toLowerCase().includes(search) ||
                        name.includes(search)
                    );
                }
                return true;
            })
            .sort((a: Types.Message, b: Types.Message) => {
                const aTime = new Date(a.created_at).getTime();
                const bTime = new Date(b.created_at).getTime();
                return bTime - aTime;
            });
    }, [messages, viewMode, recipientFilter, searchTerm, currentUser?.id]);

    // Stats
    const stats = useMemo(() => {
        const sent = messages.filter((m: Types.Message) => String(m.sender) === String(currentUser?.id));
        const unread = messages.filter((m: Types.Message) => String(m.recipient) === String(currentUser?.id) && !m.is_read);
        return {
            totalSent: sent.length,
            toTeachers: sent.filter((m: Types.Message) => m.recipient_role === 'TEACHER').length,
            toParents: sent.filter((m: Types.Message) => m.recipient_role === 'PARENT' || m.recipient_role === 'STUDENT').length,
            toStaff: sent.filter((m: Types.Message) => m.recipient_role === 'STAFF').length,
            unread: unread.length
        };
    }, [messages, currentUser?.id]);

    const resetCompose = () => {
        setRecipientType('teacher');
        setSelectedRecipient('');
        setSubject('');
        setBody('');
    };

    const handleSend = () => {
        if (!selectedRecipient || !subject.trim() || !body.trim()) {
            addToast('Please fill in all fields', 'warning');
            return;
        }

        const selectedRec = allRecipients.find(r => String(r.id) === String(selectedRecipient));
        if (!selectedRec) {
            console.error('Recipient not found:', selectedRecipient, 'in', allRecipients);
            addToast('Invalid recipient', 'error');
            return;
        }

        if (!selectedRec.userId) {
            addToast('This recipient does not have a linked user account yet. They need a login account first.', 'error');
            return;
        }

        // Send payload matching backend SchoolMessageSerializer
        const payload = {
            recipient: selectedRec.userId,
            subject: subject.trim(),
            body: body.trim(),
        } as any;

        createMessage(payload, {
            onSuccess: () => {
                addToast('Message sent successfully!', 'success');
                setIsComposeOpen(false);
                resetCompose();
            },
            onError: () => {
                addToast('Failed to send message', 'error');
            }
        });
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this message?')) {
            deleteMessage(id);
            setViewingMessage(null);
            addToast('Message deleted', 'info');
        }
    };

    const handleMarkAsRead = (message: Types.Message) => {
        if (!message.is_read) {
            updateMessage({ id: message.id, updates: { is_read: true } });
        }
        setViewingMessage(message);
    };

    const getRoleIcon = (role: Types.UserRole) => {
        switch (role) {
            case 'teacher': return <UserCog className="h-4 w-4" />;
            case 'staff': return <Users className="h-4 w-4" />;
            case 'parent': return <User className="h-4 w-4" />;
            case 'student': return <GraduationCap className="h-4 w-4" />;
            default: return <User className="h-4 w-4" />;
        }
    };

    const getRoleColor = (role: Types.UserRole) => {
        switch (role) {
            case 'teacher': return 'bg-blue-100 text-blue-700';
            case 'staff': return 'bg-purple-100 text-purple-700';
            case 'parent': return 'bg-green-100 text-green-700';
            case 'student': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                    <p className="text-sm text-gray-500 mt-1">Send and manage messages to teachers, parents, and staff</p>
                </div>
                <Button onClick={() => setIsComposeOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Compose Message
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-brand-100 rounded-lg flex items-center justify-center">
                            <Send className="h-5 w-5 text-brand-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalSent}</p>
                            <p className="text-xs text-gray-500">Total Sent</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <UserCog className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.toTeachers}</p>
                            <p className="text-xs text-gray-500">To Teachers</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.toParents}</p>
                            <p className="text-xs text-gray-500">To Parents</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <User className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.toStaff}</p>
                            <p className="text-xs text-gray-500">To Staff</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Mail className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
                            <p className="text-xs text-gray-500">Unread</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex gap-2">
                        <Button
                            variant={viewMode === 'sent' ? 'primary' : 'secondary'}
                            onClick={() => setViewMode('sent')}
                            className="flex items-center gap-2"
                        >
                            <Send className="h-4 w-4" />
                            Sent
                        </Button>
                        <Button
                            variant={viewMode === 'inbox' ? 'primary' : 'secondary'}
                            onClick={() => setViewMode('inbox')}
                            className="flex items-center gap-2"
                        >
                            <Inbox className="h-4 w-4" />
                            Inbox
                            {stats.unread > 0 && (
                                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {stats.unread}
                                </span>
                            )}
                        </Button>
                    </div>

                    <div className="flex-1 flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search messages..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            />
                        </div>
                        <Select
                            value={recipientFilter}
                            onChange={(e) => setRecipientFilter(e.target.value as any)}
                            className="w-40"
                        >
                            <option value="all">All Recipients</option>
                            <option value="teacher">Teachers</option>
                            <option value="parent">Parents</option>
                            <option value="staff">Staff</option>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Messages List */}
            <Card className="divide-y divide-gray-100">
                {filteredMessages.length === 0 ? (
                    <div className="p-12 text-center">
                        <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No messages found</p>
                        <Button onClick={() => setIsComposeOpen(true)} className="mt-4">
                            Send your first message
                        </Button>
                    </div>
                ) : (
                    filteredMessages.map((message: Types.Message) => (
                        <div
                            key={message.id}
                            onClick={() => handleMarkAsRead(message)}
                            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!message.is_read && viewMode === 'inbox' ? 'bg-brand-50' : ''
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${getRoleColor((message.recipient_role || 'admin') as Types.UserRole)}`}>
                                    {getRoleIcon((message.recipient_role || 'admin') as Types.UserRole)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-gray-900 truncate">
                                            {viewMode === 'sent'
                                                ? (message.recipient_name || 'Unknown')
                                                : (message.sender_name || 'Admin')
                                            }
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleColor((message.recipient_role || 'admin') as Types.UserRole)}`}>
                                            {message.recipient_role || 'admin'}
                                        </span>
                                        {!message.is_read && viewMode === 'inbox' && (
                                            <Circle className="h-2 w-2 fill-brand-500 text-brand-500" />
                                        )}
                                    </div>
                                    <p className="font-medium text-gray-800 truncate">{message.subject}</p>
                                    <p className="text-sm text-gray-500 truncate">{message.body}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs text-gray-400">
                                        {new Date(message.created_at).toLocaleDateString('en-NG', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                    <ChevronRight className="h-4 w-4 text-gray-300 mt-2 ml-auto" />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </Card>

            {/* Compose Modal */}
            <Modal
                isOpen={isComposeOpen}
                onClose={() => { setIsComposeOpen(false); resetCompose(); }}
                title="Compose Message"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Type</label>
                            <Select
                                value={recipientType}
                                onChange={(e) => {
                                    setRecipientType(e.target.value as RecipientType);
                                    setSelectedRecipient('');
                                }}
                            >
                                <option value="teacher">Teacher</option>
                                <option value="student">Student/Parent</option>
                                <option value="staff">Staff</option>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {recipientType === 'student' ? 'Select Student (Parent will receive)' : 'Select Recipient'}
                            </label>
                            <Select
                                value={selectedRecipient}
                                onChange={(e) => setSelectedRecipient(e.target.value)}
                            >
                                <option value="">Select...</option>
                                {filteredRecipients.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.type === 'student'
                                            ? `${r.name} → ${r.parentName || 'Parent'}`
                                            : r.name}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Enter message subject..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Type your message here..."
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="secondary" onClick={() => { setIsComposeOpen(false); resetCompose(); }}>
                            Cancel
                        </Button>
                        <Button onClick={handleSend} disabled={isSending}>
                            {isSending ? (
                                <>
                                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Message
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* View Message Modal */}
            <Modal
                isOpen={!!viewingMessage}
                onClose={() => setViewingMessage(null)}
                title="Message Details"
            >
                {viewingMessage && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 pb-4 border-b">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${getRoleColor((viewingMessage.recipient_role || 'admin') as Types.UserRole)}`}>
                                {getRoleIcon((viewingMessage.recipient_role || 'admin') as Types.UserRole)}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                    To: {viewingMessage.recipient_name || 'Unknown'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {new Date(viewingMessage.created_at).toLocaleString('en-NG')}
                                </p>
                            </div>
                            {viewingMessage.is_read ? (
                                <span className="flex items-center gap-1 text-green-600 text-sm">
                                    <MailOpen className="h-4 w-4" />
                                    Read
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-gray-400 text-sm">
                                    <Mail className="h-4 w-4" />
                                    Unread
                                </span>
                            )}
                        </div>

                        <div>
                            <h3 className="font-bold text-lg text-gray-900 mb-2">{viewingMessage.subject}</h3>
                            <p className="text-gray-700 whitespace-pre-wrap">{viewingMessage.body}</p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="secondary" onClick={() => handleDelete(viewingMessage.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                            <Button variant="secondary" onClick={() => setViewingMessage(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
