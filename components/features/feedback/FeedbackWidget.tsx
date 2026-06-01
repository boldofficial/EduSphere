'use client';

import React, { useState } from 'react';
import { MessageSquarePlus, Star, X, Send } from 'lucide-react';
import { useSubmitFeedback } from '@/lib/hooks/use-feedback';
import { useToast } from '@/components/providers/toast-provider';
import { usePathname } from 'next/navigation';
import { useSchoolStore } from '@/lib/store';
import type { AxiosError } from 'axios';

interface FeedbackWidgetProps {
  onSubmitted?: () => void;
}

export function FeedbackWidget({ onSubmitted }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const pathname = usePathname();
  const { currentUser } = useSchoolStore();
  const isGuest = !currentUser;

  const { mutate, isPending } = useSubmitFeedback();
  const { addToast } = useToast();

  const handleOpen = () => {
    setIsOpen(true);
    setRating(0);
    setComment('');
    setGuestName('');
    setGuestEmail('');
    setNameError('');
    setEmailError('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setRating(0);
    setHovered(0);
    setComment('');
    setGuestName('');
    setGuestEmail('');
    setNameError('');
    setEmailError('');
  };

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleSubmit = () => {
    if (!rating) return;

    // Validate required guest fields
    if (isGuest) {
      let valid = true;
      if (!guestName.trim()) {
        setNameError('Name is required');
        valid = false;
      } else {
        setNameError('');
      }
      if (!guestEmail.trim()) {
        setEmailError('Email is required');
        valid = false;
      } else {
        setEmailError('');
      }
      if (!valid) return;
    }

    mutate(
      {
        rating,
        comment,
        page_url: pathname,
        ...(isGuest && { guest_name: guestName, guest_email: guestEmail }),
      },
      {
        onSuccess: () => {
          localStorage.setItem('feedback_last_submitted', Date.now().toString());
          addToast('Thank you for your feedback!', 'success');
          handleClose();
          onSubmitted?.();
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<{ error?: string; errors?: Record<string, string> }>;
          const message =
            axiosErr.response?.data?.error ||
            axiosErr.response?.data?.errors ||
            'Failed to submit feedback. Please try again.';
          addToast(
            typeof message === 'string' ? message : 'Failed to submit feedback. Please try again.',
            'error'
          );
        },
      }
    );
  };

  const starLabels = ['Terrible', 'Poor', 'Okay', 'Good', 'Excellent'];
  const activeRating = hovered || rating;

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        onClick={handleOpen}
        title="Give feedback"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl shadow-lg shadow-brand-600/30 flex items-center justify-center transition-all hover:scale-110 hover:shadow-xl hover:shadow-brand-600/40"
      >
        <MessageSquarePlus size={20} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-end justify-end p-6"
          onClick={handleClose}
        >
          {/* Modal */}
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in slide-in-from-bottom-4 fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-black text-gray-900">Share your feedback</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  How&apos;s your experience with EduSphere?
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close feedback"
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Guest identity fields */}
            {isGuest && (
              <div className="space-y-3 mb-5">
                <div>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => {
                      setGuestName(e.target.value);
                      setNameError('');
                    }}
                    placeholder="Your name *"
                    className={`w-full bg-gray-50 border-2 rounded-2xl px-4 py-2.5 text-sm text-gray-800 outline-none transition-all placeholder-gray-400 ${
                      nameError
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-transparent focus:border-brand-500 focus:bg-white'
                    }`}
                  />
                  {nameError && <p className="text-xs text-red-500 mt-1 ml-1">{nameError}</p>}
                </div>
                <div>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => {
                      setGuestEmail(e.target.value);
                      setEmailError('');
                    }}
                    placeholder="Email address *"
                    className={`w-full bg-gray-50 border-2 rounded-2xl px-4 py-2.5 text-sm text-gray-800 outline-none transition-all placeholder-gray-400 ${
                      emailError
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-transparent focus:border-brand-500 focus:bg-white'
                    }`}
                  />
                  {emailError && <p className="text-xs text-red-500 mt-1 ml-1">{emailError}</p>}
                </div>
              </div>
            )}

            {/* Star Rating */}
            <div className="mb-5">
              <div className="flex gap-2 justify-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={`transition-colors ${
                        star <= activeRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-gray-100 text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {activeRating > 0 && (
                <p className="text-center text-sm font-bold text-brand-600">
                  {starLabels[activeRating - 1]}
                </p>
              )}
            </div>

            {/* Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more (optional)..."
              rows={3}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none resize-none transition-all placeholder-gray-400"
            />

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!rating || isPending}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={14} />
                    Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
