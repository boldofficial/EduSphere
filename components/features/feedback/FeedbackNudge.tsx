'use client';

import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { useSubmitFeedback } from '@/lib/hooks/use-feedback';
import { useToast } from '@/components/providers/toast-provider';
import { usePathname } from 'next/navigation';
import { useSchoolStore } from '@/lib/store';
import type { AxiosError } from 'axios';

const NUDGE_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function FeedbackNudge() {
  const [visible, setVisible] = useState(false);
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

  useEffect(() => {
    const firstLogin = localStorage.getItem('first_login_at');
    if (!firstLogin) {
      localStorage.setItem('first_login_at', Date.now().toString());
      return;
    }

    const sessionAge = Date.now() - parseInt(firstLogin, 10);
    if (sessionAge < MIN_SESSION_AGE_MS) return;

    const lastSubmitted = localStorage.getItem('feedback_last_submitted');
    const lastDismissed = localStorage.getItem('feedback_nudge_dismissed');
    const lastCheck = Math.max(
      lastSubmitted ? parseInt(lastSubmitted, 10) : 0,
      lastDismissed ? parseInt(lastDismissed, 10) : 0
    );

    if (Date.now() - lastCheck > NUDGE_INTERVAL_MS) {
      const timer = setTimeout(() => setVisible(true), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    // eslint-disable-next-line react-hooks/purity
    localStorage.setItem('feedback_nudge_dismissed', Date.now().toString());
    setVisible(false);
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
          setVisible(false);
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

  if (!visible) return null;

  const activeRating = hovered || rating;
  const starLabels = ['Terrible', 'Poor', 'Okay', 'Good', 'Excellent'];

  return (
    <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-black text-brand-600 uppercase tracking-widest mb-0.5">
            Quick check-in
          </p>
          <h4 className="text-base font-black text-gray-900">How are we doing?</h4>
          <p className="text-xs text-gray-500 mt-0.5">Rate your experience with EduSphere.</p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss feedback prompt"
          className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Guest identity fields */}
      {isGuest && (
        <div className="space-y-2 mb-4">
          <div>
            <input
              type="text"
              value={guestName}
              onChange={(e) => {
                setGuestName(e.target.value);
                setNameError('');
              }}
              placeholder="Your name *"
              className={`w-full bg-gray-50 border-2 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none transition-all placeholder-gray-400 ${
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
              className={`w-full bg-gray-50 border-2 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none transition-all placeholder-gray-400 ${
                emailError
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-transparent focus:border-brand-500 focus:bg-white'
              }`}
            />
            {emailError && <p className="text-xs text-red-500 mt-1 ml-1">{emailError}</p>}
          </div>
        </div>
      )}

      <div className="flex gap-1.5 justify-center mb-3">
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
              size={28}
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
        <p className="text-center text-xs font-bold text-brand-600 mb-3">
          {starLabels[activeRating - 1]}
        </p>
      )}

      {rating > 0 && (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Any additional thoughts? (optional)"
          rows={2}
          className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-xl px-3 py-2 text-sm text-gray-800 outline-none resize-none transition-all placeholder-gray-400 mb-3"
        />
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDismiss}
          className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Maybe later
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!rating || isPending}
          className="flex-1 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {isPending ? (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Send Feedback'
          )}
        </button>
      </div>
    </div>
  );
}
