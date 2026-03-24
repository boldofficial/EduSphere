'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSchoolStore } from '@/lib/store';
import { DiscussionThread, DiscussionMessage } from '@/lib/types';
import { DiscussionMessageComponent } from './DiscussionMessage';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MessageSquare, Loader2, Send } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface DiscussionThreadProps {
  contentTypeId: number;
  objectId: number;
  title?: string;
}

export const DiscussionThreadComponent: React.FC<DiscussionThreadProps> = ({
  contentTypeId,
  objectId,
  title = "Discussion",
}) => {
  const [thread, setThread] = useState<DiscussionThread | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useSchoolStore();
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(currentUser?.id);

  const fetchThread = useCallback(async () => {
    try {
      // Get or create thread
      const response = await apiClient.post<DiscussionThread>('lms/threads/', {
        content_type: contentTypeId,
        object_id: objectId,
      });
      setThread(response.data);
    } catch (error) {
      console.error('Failed to fetch discussion thread:', error);
    } finally {
      setIsLoading(false);
    }
  }, [contentTypeId, objectId]);

  useEffect(() => {
    fetchThread();
    if (currentUser?.id) {
      setCurrentUserId(currentUser.id);
    }
  }, [fetchThread, currentUser?.id]);

  const handlePostMessage = async (parentId: string | number | null = null, body: string) => {
    if (!thread) return;
    
    try {
      await apiClient.post('lms/messages/', {
        thread: thread.id,
        parent: parentId,
        body: body,
      });
      // Refresh thread to show new message
      await fetchThread();
    } catch (error) {
      console.error('Failed to post message:', error);
      throw error;
    }
  };

  const handleDeleteMessage = async (messageId: string | number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await apiClient.delete(`lms/messages/${messageId}/`);
      await fetchThread();
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleEditMessage = async (messageId: string | number, body: string) => {
    try {
      await apiClient.patch(`lms/messages/${messageId}/`, { body });
      await fetchThread();
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg flex items-center gap-2 text-brand-800">
          <MessageSquare className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        {/* New Top-Level Comment Input */}
        <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
          <textarea
            className="w-full text-sm p-0 border-none focus:ring-0 outline-none min-h-[100px] resize-none"
            placeholder="Share your thoughts or ask a question..."
            value={newCommentBody}
            onChange={(e) => setNewCommentBody(e.target.value)}
          />
          <div className="flex justify-end pt-2 border-t border-gray-50">
            <Button 
              className="bg-brand-600 hover:bg-brand-700 text-white gap-2 px-6"
              disabled={isSubmitting || !newCommentBody.trim()}
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  await handlePostMessage(null, newCommentBody);
                  setNewCommentBody('');
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <Send className="h-4 w-4" />
              Post Comment
            </Button>
          </div>
        </div>

        {/* Messages List */}
        <div className="space-y-8 mt-8">
          {thread?.messages.length === 0 ? (
            <div className="text-center py-12 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
              <MessageSquare className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No discussions yet. Be the first to start one!</p>
            </div>
          ) : (
            thread?.messages.map((message) => (
              <DiscussionMessageComponent
                key={message.id}
                message={message}
                onDelete={handleDeleteMessage}
                onEdit={handleEditMessage}
                onReply={handlePostMessage}
                currentUserId={currentUserId}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
