'use client';

import React, { useState } from 'react';
import { DiscussionMessage } from '@/lib/types';
import { Button } from '@/components/ui/button';

// Helper to format relative time without date-fns
const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  
  return date.toLocaleDateString();
};
import { Trash2, Reply, CornerDownRight, Pencil } from 'lucide-react';

interface DiscussionMessageProps {
  message: DiscussionMessage;
  onDelete: (id: string | number) => void;
  onEdit: (id: string | number, body: string) => Promise<void>;
  onReply: (parentId: string | number, body: string) => Promise<void>;
  currentUserId?: number;
}

export const DiscussionMessageComponent: React.FC<DiscussionMessageProps> = ({
  message,
  onDelete,
  onEdit,
  onReply,
  currentUserId,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(message.body);
  const [replyBody, setReplyBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReplySubmit = async () => {
    if (!replyBody.trim()) return;
    setIsSubmitting(true);
    try {
      await onReply(message.id, replyBody);
      setReplyBody('');
      setIsReplying(false);
    } catch (error) {
      console.error('Failed to post reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editBody.trim() || editBody === message.body) {
      setIsEditing(false);
      return;
    }
    setIsSubmitting(true);
    try {
      await onEdit(message.id, editBody);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="group animate-in fade-in slide-in-from-left-2 duration-300">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs">
            {message.author_name?.charAt(0) || '?'}
          </div>
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{message.author_name}</span>
              <span className="text-xs text-gray-500">
                {formatRelativeTime(new Date(message.created_at as string))} ago
              </span>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-brand-600"
                onClick={() => {
                  setIsReplying(!isReplying);
                  setIsEditing(false);
                }}
              >
                <Reply className="h-4 w-4" />
              </Button>
              
              {currentUserId === message.author && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-brand-600"
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setIsReplying(false);
                      setEditBody(message.body);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-red-600"
                    onClick={() => onDelete(message.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                className="w-full text-sm p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none min-h-[100px]"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button 
                  size="sm" 
                  className="bg-brand-600 hover:bg-brand-700 text-white"
                  disabled={isSubmitting || !editBody.trim()}
                  onClick={handleEditSubmit}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {message.body}
            </div>
          )}

          {isReplying && (
            <div className="mt-3 space-y-2 pl-2 border-l-2 border-brand-200 animate-in slide-in-from-top-2">
              <textarea
                className="w-full text-sm p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none min-h-[80px]"
                placeholder="Write a reply..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsReplying(false)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  className="bg-brand-600 hover:bg-brand-700 text-white"
                  disabled={isSubmitting || !replyBody.trim()}
                  onClick={handleReplySubmit}
                >
                  {isSubmitting ? 'Posting...' : 'Post Reply'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recursive Replies */}
      {message.replies && message.replies.length > 0 && (
        <div className="ml-8 mt-4 space-y-4 border-l border-gray-100 pl-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <CornerDownRight className="h-3 w-3" />
            <span>{message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}</span>
          </div>
          {message.replies.map((reply) => (
            <DiscussionMessageComponent
              key={reply.id}
              message={reply}
              onDelete={onDelete}
              onEdit={onEdit}
              onReply={onReply}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
