'use client';

import React, { useState } from 'react';
import { Mail, MailOpen, ChevronRight, Clock, Reply, Send, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useMessages, useUpdateMessage, useCreateMessage } from '@/lib/hooks/use-data';
import { useSchoolStore } from '@/lib/store';
import { useToast } from '@/components/providers/toast-provider';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';

interface MessageInboxWidgetProps {
    maxMessages?: number;
    showViewAll?: boolean;
}

export const MessageInboxWidget: React.FC<MessageInboxWidgetProps> = ({
    maxMessages = 5,
    showViewAll = true
}) => {
    const { currentRole, currentUser } = useSchoolStore();
    const { addToast } = useToast();
    const { data: messages = [] } = useMessages();
    const { mutate: updateMessage } = useUpdateMessage();
    const { mutate: createMessage, isPending: isSending } = useCreateMessage();

    // State for viewing/replying
    const [viewingMessage, setViewingMessage] = useState<Types.Message | null>(null);
    const [isReplyMode, setIsReplyMode] = useState(false);
    const [replyBody, setReplyBody] = useState('');

    // Get the user's profile ID - now from currentUser (demo mode)
    const myProfileId = currentUser?.id;
    const myAuthId = currentUser?.id;

    // Get messages for this user (both received and sent)
    // Check both profile_id AND auth user id since messages may use either
    const myMessages = React.useMemo(() => {
        return messages
            .filter((m: Types.Message) =>
                m.to_id === myProfileId ||
                m.from_id === myProfileId ||
                m.to_id === myAuthId ||
                m.from_id === myAuthId
            )
            .sort((a: Types.Message, b: Types.Message) => b.created_at - a.created_at)
            .slice(0, maxMessages);
    }, [messages, myProfileId, myAuthId, maxMessages]);

    // Get unread count (only for received messages)
    const unreadCount = React.useMemo(() => {
        return messages.filter((m: Types.Message) =>
            (m.to_id === myProfileId || m.to_id === myAuthId) && !m.is_read
        ).length;
    }, [messages, myProfileId, myAuthId]);

    // Check if this message was sent to me
    const isMessageToMe = (message: Types.Message) => {
        return message.to_id === myProfileId || message.to_id === myAuthId;
    };

    // Check if this message was sent by me
    const isMessageFromMe = (message: Types.Message) => {
        return message.from_id === myProfileId || message.from_id === myAuthId;
    };

    const handleViewMessage = (message: Types.Message) => {
        // Mark as read if it's a received message and not already read
        if (isMessageToMe(message) && !message.is_read) {
            updateMessage({ id: message.id, updates: { is_read: true } });
        }
        setViewingMessage(message);
        setIsReplyMode(false);
        setReplyBody('');
    };

    const handleSendReply = () => {
        if (!viewingMessage || !replyBody.trim()) {
            addToast('Please enter a reply message', 'warning');
            return;
        }

        const replyMessage: Types.Message = {
            id: Utils.generateId(),
            from_id: myProfileId || myAuthId || '',
            from_role: currentRole,
            to_id: viewingMessage.from_id,
            to_role: viewingMessage.from_role,
            parent_message_id: viewingMessage.id,
            subject: `Re: ${viewingMessage.subject}`,
            body: replyBody.trim(),
            is_read: false,
            created_at: Date.now(),
            updated_at: Date.now()
        };

        createMessage(replyMessage, {
            onSuccess: () => {
                addToast('Reply sent successfully!', 'success');
                setViewingMessage(null);
                setIsReplyMode(false);
                setReplyBody('');
            },
            onError: () => {
                addToast('Failed to send reply', 'error');
            }
        });
    };

    const closeModal = () => {
        setViewingMessage(null);
        setIsReplyMode(false);
        setReplyBody('');
    };

    // Check if message is from admin (can reply)
    const canReply = (message: Types.Message) => {
        return isMessageToMe(message) && message.from_role === 'admin';
    };

    // Get display name for sender
    const getSenderName = (message: Types.Message) => {
        if (isMessageFromMe(message)) return 'You';
        if (message.from_role === 'admin') return 'School Admin';
        return message.from_role.charAt(0).toUpperCase() + message.from_role.slice(1);
    };

    if (myMessages.length === 0) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Mail className="h-5 w-5 text-brand-500" />
                        Messages
                    </h3>
                </div>
                <div className="text-center py-8 text-gray-400">
                    <Mail className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No messages yet</p>
                </div>
            </Card>
        );
    }

    return (
        <>
            <Card className="overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Mail className="h-5 w-5 text-brand-500" />
                        Messages
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                {unreadCount} new
                            </span>
                        )}
                    </h3>
                </div>
                <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                    {myMessages.map((message: Types.Message) => {
                        const isReceived = message.to_id === currentUser?.id;
                        const isUnread = isReceived && !message.is_read;

                        return (
                            <div
                                key={message.id}
                                onClick={() => handleViewMessage(message)}
                                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${isUnread ? 'bg-brand-50/50' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isUnread ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {isReceived ? (
                                            isUnread ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                {message.subject}
                                            </p>
                                            {!isReceived && (
                                                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                                    Sent
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                            {isReceived ? `From: ${getSenderName(message)}` : message.body}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(message.created_at).toLocaleDateString('en-NG', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Message View Modal */}
            <Modal
                isOpen={!!viewingMessage}
                onClose={closeModal}
                title={viewingMessage?.subject || 'Message'}
                size="sm"
            >
                {viewingMessage && (
                    <div className="space-y-4">
                        {/* Message Header */}
                        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                            <div className="h-10 w-10 bg-brand-100 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-brand-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">{getSenderName(viewingMessage)}</p>
                                <p className="text-xs text-gray-500">
                                    {new Date(viewingMessage.created_at).toLocaleDateString('en-NG', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Message Body */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-700 whitespace-pre-wrap">{viewingMessage.body}</p>
                        </div>

                        {/* Reply Section */}
                        {canReply(viewingMessage) && (
                            <>
                                {!isReplyMode ? (
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsReplyMode(true)}
                                        className="w-full"
                                    >
                                        <Reply className="h-4 w-4 mr-2" />
                                        Reply to this message
                                    </Button>
                                ) : (
                                    <div className="space-y-3 pt-3 border-t border-gray-100">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Your Reply
                                        </label>
                                        <textarea
                                            value={replyBody}
                                            onChange={(e) => setReplyBody(e.target.value)}
                                            placeholder="Type your reply here..."
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleSendReply}
                                                disabled={isSending || !replyBody.trim()}
                                                className="flex-1"
                                            >
                                                {isSending ? (
                                                    <>Sending...</>
                                                ) : (
                                                    <>
                                                        <Send className="h-4 w-4 mr-2" />
                                                        Send Reply
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setIsReplyMode(false);
                                                    setReplyBody('');
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Info for sent messages */}
                        {viewingMessage.from_id === currentUser?.id && (
                            <div className="text-center text-sm text-gray-500 py-2 bg-gray-50 rounded-lg">
                                This is a message you sent
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
};
