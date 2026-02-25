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

    // Get messages for this user (they are already filtered by backend to only show my conversations)
    const myMessages = React.useMemo(() => {
        return [...messages]
            .sort((a: Types.Message, b: Types.Message) => {
                const aTime = new Date(a.created_at).getTime();
                const bTime = new Date(b.created_at).getTime();
                return bTime - aTime;
            })
            .slice(0, maxMessages);
    }, [messages, maxMessages]);

    // Get unread count - this is trickier now as read status is per-participant
    // For now, we'll rely on the conversational unread counts or just show 0 in this simplified widget
    const unreadCount = 0;

    // Check if this message was sent to me
    const isMessageToMe = (message: Types.Message) => {
        return String(message.sender) !== String(currentUser?.id);
    };

    // Check if this message was sent by me
    const isMessageFromMe = (message: Types.Message) => {
        return String(message.sender) === String(currentUser?.id);
    };

    const handleViewMessage = (message: Types.Message) => {
        // Note: Read status is now managed at conversation level in the new architecture
        setViewingMessage(message);
        setIsReplyMode(false);
        setReplyBody('');
    };

    const handleSendReply = () => {
        if (!viewingMessage || !replyBody.trim()) {
            addToast('Please enter a reply message', 'warning');
            return;
        }

        // Send payload using conversation ID
        const payload = {
            conversation: viewingMessage.conversation,
            body: replyBody.trim(),
        } as any;

        createMessage(payload, {
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

    // Any message sent to me can be replied to (conversation-based, anyone can reply)
    const canReply = (message: Types.Message) => {
        return isMessageToMe(message);
    };

    // Get display name for sender
    const getSenderName = (message: Types.Message) => {
        if (isMessageFromMe(message)) return 'You';
        return message.sender_name || message.sender_role || 'Unknown';
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
                    <p className="text-sm">No recent messages</p>
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
                        Recent Messages
                    </h3>
                </div>
                <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                    {myMessages.map((message: Types.Message) => {
                        const isMe = String(message.sender) === String(currentUser?.id);

                        return (
                            <div
                                key={message.id}
                                onClick={() => handleViewMessage(message)}
                                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${!isMe ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500'}`}>
                                        {isMe ? <Send className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-medium text-gray-700 truncate">
                                                {!isMe ? message.sender_name : 'To Conversation'}
                                            </p>
                                            {isMe && (
                                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                                    Sent
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                            {message.body}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {Utils.formatDate(message.created_at)}
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
                title="Message Details"
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
                        {String(viewingMessage.sender) === String(currentUser?.id) && (
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
