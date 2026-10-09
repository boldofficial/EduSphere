'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Package,
  Users,
  Wallet,
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminDashboard } from '@/lib/hooks/use-dashboard';
import * as Utils from '@/lib/utils';
import { FinanceChart } from './FinanceChart';
import { AttendanceAnalytics } from './AttendanceAnalytics';
import { ExecutiveAcademicSummary } from './ExecutiveAcademicSummary';

const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;

const shortDate = (value: string) =>
  new Date(value).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-gray-200 bg-white shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

interface AdminOverviewProps {
  allowedModules: string[];
  quickActions?: React.ReactNode;
}

/** The admin "today" view: key numbers, what needs attention, money in and out, what's coming up. */
export function AdminOverview({ allowedModules, quickActions }: AdminOverviewProps) {
  const { data, isLoading, isError } = useAdminDashboard();
  const has = (m: string) => allowedModules.includes(m);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-card" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Dashboard unavailable"
        description="We couldn't load this school's summary. Refresh the page, or pick a school if you're signed in as a platform admin."
      />
    );
  }

  const { counts, finance, attendance_today: att, action_items: todo } = data;
  const actions = [
    {
      show: has('admissions'),
      count: todo.pending_admissions,
      label: 'admission applications to review',
      href: '/admissions',
      icon: ClipboardList,
    },
    {
      show: has('bursary'),
      count: todo.payments_to_verify,
      label: 'payments waiting for verification',
      href: '/bursary',
      icon: Wallet,
    },
    {
      show: has('inventory'),
      count: todo.low_stock_items,
      label: 'inventory items at or below reorder level',
      href: '/inventory',
      icon: Package,
    },
  ].filter((a) => a.show && a.count > 0);

  return (
    <div className="space-y-6">
      {/* Key numbers */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Students"
          value={counts.students.toLocaleString('en-NG')}
          icon={Users}
          hint={`${counts.classes} classes · ${counts.teachers + counts.staff} staff`}
        />
        {has('bursary') && (
          <StatCard
            label="Fees collected this term"
            value={naira(finance.collected)}
            icon={Wallet}
            tone="success"
            hint={
              finance.collection_rate !== null
                ? `${finance.collection_rate}% of ${naira(finance.expected)}`
                : 'No fees assigned yet'
            }
          />
        )}
        {has('bursary') && (
          <StatCard
            label="Outstanding fees"
            value={naira(finance.outstanding)}
            icon={AlertTriangle}
            tone={finance.outstanding > 0 ? 'danger' : 'success'}
            hint={data.term}
          />
        )}
        {has('attendance') && (
          <StatCard
            label="Attendance today"
            value={att.rate !== null ? `${att.rate}%` : '—'}
            icon={CalendarCheck}
            tone="info"
            hint={
              att.records
                ? `${att.classes_marked} of ${counts.classes} classes marked`
                : 'No register taken yet today'
            }
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Needs your attention">
            {actions.length === 0 ? (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle2 className="h-5 w-5 text-success-600" />
                You&apos;re all caught up. Nothing is waiting on you right now.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {actions.map((a) => (
                  <li key={a.href}>
                    <Link
                      href={a.href}
                      className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <span className="rounded-lg bg-warning-50 p-2 text-warning-700">
                        <a.icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-sm text-gray-700">
                        <span className="font-semibold text-gray-900">{a.count}</span> {a.label}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {has('bursary') && (
            <FinanceChart revenue={finance.collected} expenses={finance.expenses} />
          )}

          <ExecutiveAcademicSummary />
          {quickActions}
        </div>

        <div className="space-y-6">
          {has('bursary') && (
            <Panel
              title="Recent payments"
              action={
                <Link
                  href="/bursary"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  View all
                </Link>
              }
            >
              {data.recent_payments.length === 0 ? (
                <p className="text-sm text-gray-500">No payments recorded this term yet.</p>
              ) : (
                <ul className="space-y-3">
                  {data.recent_payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {p.student_name || 'Unknown student'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {shortDate(p.date)} · {p.method}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {Utils.formatCurrency(p.amount)}
                        </p>
                        <StatusBadge status={p.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}

          <Panel title="Coming up">
            {data.upcoming_events.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming events on the calendar.</p>
            ) : (
              <ul className="space-y-3">
                {data.upcoming_events.map((e) => (
                  <li key={e.id} className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <CalendarDays className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{e.title}</p>
                      <p className="text-xs capitalize text-gray-500">
                        {shortDate(e.start_date)} · {e.event_type}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {has('attendance') && <AttendanceAnalytics />}
        </div>
      </div>
    </div>
  );
}
