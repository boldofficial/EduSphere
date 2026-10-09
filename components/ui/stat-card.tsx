import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info';

const toneStyles: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
  info: 'bg-info-50 text-info-700',
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: Tone;
  /** Change vs. the previous period, e.g. 12 for +12%. Positive is shown as good. */
  trend?: number;
  hint?: React.ReactNode;
  className?: string;
}

/** A single KPI: label, big number, optional trend and icon. */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  trend,
  hint,
  className = '',
}: StatCardProps) {
  const up = (trend ?? 0) >= 0;
  return (
    <div className={`rounded-card border border-gray-200 bg-white p-5 shadow-card ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {Icon && (
          <span className={`rounded-lg p-2 ${toneStyles[tone]}`}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
      {(trend !== undefined || hint) && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          {trend !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 font-semibold ${
                up ? 'text-success-600' : 'text-danger-600'
              }`}
            >
              {up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {Math.abs(trend)}%
            </span>
          )}
          {hint && <span className="text-gray-500">{hint}</span>}
        </div>
      )}
    </div>
  );
}
