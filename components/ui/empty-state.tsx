import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  /** Usually one primary Button that creates the first item. */
  action?: React.ReactNode;
  className?: string;
}

/** Shown when a list or page has nothing to display yet. */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-card border border-dashed border-gray-300 bg-white px-6 py-12 text-center ${className}`}
    >
      <span className="mb-4 rounded-full bg-brand-50 p-3 text-brand-600">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
