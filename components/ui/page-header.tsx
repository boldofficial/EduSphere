import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  /** Primary and secondary actions, shown on the right (stacked below on mobile). */
  actions?: React.ReactNode;
  /** Optional breadcrumb or eyebrow text above the title. */
  eyebrow?: React.ReactNode;
  className?: string;
}

/** Standard top-of-page header: title, one-line description, actions. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
