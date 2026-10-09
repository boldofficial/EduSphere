import React from 'react';

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

const tones: Record<StatusTone, string> = {
  neutral: 'bg-gray-100 text-gray-700 ring-gray-200',
  success: 'bg-success-50 text-success-700 ring-success-200',
  warning: 'bg-warning-50 text-warning-700 ring-warning-200',
  danger: 'bg-danger-50 text-danger-700 ring-danger-200',
  info: 'bg-info-50 text-info-700 ring-info-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
};

/** Common statuses across modules mapped to one meaning each, so "paid" looks the same everywhere. */
const STATUS_TONES: Record<string, StatusTone> = {
  active: 'success',
  paid: 'success',
  completed: 'success',
  approved: 'success',
  present: 'success',
  published: 'success',
  accepted: 'success',
  pending: 'warning',
  partial: 'warning',
  late: 'warning',
  draft: 'neutral',
  scheduled: 'info',
  in_progress: 'info',
  overdue: 'danger',
  absent: 'danger',
  failed: 'danger',
  rejected: 'danger',
  expired: 'danger',
  cancelled: 'neutral',
};

interface StatusBadgeProps {
  /** A status value like "paid" or "overdue"; its tone is looked up automatically. */
  status?: string;
  /** Override the looked-up tone. */
  tone?: StatusTone;
  children?: React.ReactNode;
  className?: string;
}

export function StatusBadge({ status, tone, children, className = '' }: StatusBadgeProps) {
  const key = (status || '').toLowerCase().replace(/[\s-]+/g, '_');
  const resolved = tone || STATUS_TONES[key] || 'neutral';
  const label = children ?? (status || '').replace(/[_-]+/g, ' ');
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${tones[resolved]} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {label}
    </span>
  );
}
