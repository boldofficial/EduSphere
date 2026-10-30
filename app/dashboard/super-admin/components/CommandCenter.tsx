'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Database,
  GraduationCap,
  Megaphone,
  RefreshCw,
  School as SchoolIcon,
  Server,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { queryKeys, useCommandCenter, useSystemHealth } from '@/lib/hooks/use-data';
import type { CommandCenter as CommandCenterData, CommandCenterAttention } from '@/lib/types';

const ROOT = '/dashboard/super-admin';

const naira = (value: number) => `₦${Math.round(value || 0).toLocaleString('en-NG')}`;

const compactNaira = (value: number) =>
  value >= 1_000_000
    ? `₦${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
    : value >= 1_000
      ? `₦${Math.round(value / 1_000)}k`
      : `₦${value}`;

function ago(date: string) {
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 30
    ? `${days}d ago`
    : new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function Panel({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col rounded-card border border-gray-200 bg-white shadow-card ${className}`}
    >
      <header className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
        </div>
        {action}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-brand-600 hover:text-brand-800"
    >
      {children} <ArrowRight size={13} />
    </Link>
  );
}

// ---------------------------------------------------------------- system status

type HealthState = 'ok' | 'down' | 'off';

function SystemStatus() {
  const { data: health, isError } = useSystemHealth();
  const cache = health?.redis_status as string | undefined;
  const workers = health?.celery_status as string | undefined;
  const checks: { label: string; icon: typeof Database; state: HealthState; text: string }[] = [
    {
      label: 'Database',
      icon: Database,
      state: isError ? 'down' : 'ok',
      text: isError ? 'Unreachable' : health?.db_latency || '…',
    },
    {
      label: 'Cache',
      icon: Zap,
      state: !cache
        ? 'off'
        : cache === 'connected'
          ? 'ok'
          : cache.startsWith('not_configured')
            ? 'off'
            : 'down',
      text: !cache
        ? '…'
        : cache === 'connected'
          ? 'Connected'
          : cache.startsWith('not_configured')
            ? 'Not configured'
            : 'Disconnected',
    },
    {
      label: 'Background jobs',
      icon: Server,
      state: !workers ? 'off' : workers === 'active' ? 'ok' : 'down',
      text: !workers ? '…' : workers === 'active' ? 'Running' : 'No workers',
    },
  ];
  const down = checks.filter((c) => c.state === 'down');
  const dot: Record<HealthState, string> = {
    ok: 'bg-green-500',
    down: 'bg-red-500',
    off: 'bg-gray-300',
  };

  return (
    <div className="flex flex-col gap-3 rounded-card border border-gray-200 bg-white px-5 py-3 shadow-card md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2.5">
        {down.length === 0 ? (
          <CheckCircle2 size={18} className="text-green-600" />
        ) : (
          <AlertTriangle size={18} className="text-red-600" />
        )}
        <p className="text-sm font-semibold text-gray-900">
          {!health && !isError
            ? 'Checking systems…'
            : down.length === 0
              ? 'All systems operational'
              : `Needs attention: ${down.map((c) => c.label.toLowerCase()).join(' and ')}`}
        </p>
      </div>
      <dl className="flex flex-wrap gap-x-6 gap-y-2">
        {checks.map(({ label, icon: Icon, state, text }) => (
          <div key={label} className="flex items-center gap-2 text-sm">
            <span className={`h-2 w-2 rounded-full ${dot[state]}`} />
            <Icon size={14} className="text-gray-400" />
            <dt className="text-gray-500">{label}</dt>
            <dd className="font-medium text-gray-900">{text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ---------------------------------------------------------------- attention queue

const severityStyle: Record<CommandCenterAttention['severity'], { bar: string; badge: string }> = {
  critical: { bar: 'bg-red-500', badge: 'bg-red-50 text-red-700 ring-red-200' },
  warning: { bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  info: { bar: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 ring-blue-200' },
};

function AttentionRow({ item }: { item: CommandCenterAttention }) {
  const [open, setOpen] = useState(false);
  const style = severityStyle[item.severity];
  return (
    <li className="relative">
      <span className={`absolute inset-y-3 left-0 w-1 rounded-r ${style.bar}`} />
      <div className="flex items-start gap-3 py-3 pl-5 pr-5">
        <span
          className={`mt-0.5 inline-flex min-w-8 justify-center rounded-full px-2 py-0.5 text-xs font-bold ring-1 ring-inset ${style.badge}`}
        >
          {item.count}
        </span>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="flex w-full items-center gap-1.5 text-left text-sm font-semibold text-gray-900"
          >
            {item.title}
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>
          <p className="mt-0.5 text-xs text-gray-500">{item.summary}</p>
          {open && (
            <ul className="mt-2 space-y-1 rounded-control bg-gray-50 px-3 py-2">
              {item.items.map((row, index) => (
                <li key={index} className="flex justify-between gap-3 text-xs">
                  <span className="truncate font-medium text-gray-800">{row.label}</span>
                  <span className="shrink-0 text-gray-500">{row.detail}</span>
                </li>
              ))}
              {item.count > item.items.length && (
                <li className="text-xs text-gray-400">and {item.count - item.items.length} more</li>
              )}
            </ul>
          )}
        </div>
        <PanelLink href={item.href}>Open</PanelLink>
      </div>
    </li>
  );
}

function AttentionQueue({ items }: { items: CommandCenterAttention[] }) {
  const critical = items.filter((i) => i.severity === 'critical').length;
  return (
    <Panel
      title="Needs your attention"
      description={
        items.length === 0
          ? 'Nothing is waiting on you.'
          : `${items.length} item${items.length === 1 ? '' : 's'}${critical ? `, ${critical} urgent` : ''}, most urgent first.`
      }
      className="lg:col-span-2"
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center">
          <CheckCircle2 size={28} className="text-green-500" />
          <p className="text-sm font-semibold text-gray-900">You&apos;re all caught up</p>
          <p className="max-w-xs text-xs text-gray-500">
            No payments to approve, lapsed subscriptions, urgent tickets or failed emails.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((item) => (
            <AttentionRow key={item.key} item={item} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- renewals

function Renewals({ rows }: { rows: CommandCenterData['renewals'] }) {
  const due = rows.reduce((sum, r) => sum + r.amount, 0);
  return (
    <Panel
      title="Renewals in the next 30 days"
      description={
        rows.length
          ? `${naira(due)} due across ${rows.length} school${rows.length === 1 ? '' : 's'}`
          : undefined
      }
      action={<PanelLink href={`${ROOT}/financials`}>Financials</PanelLink>}
    >
      {rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-gray-500">No renewals due this month.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map((r) => (
            <li key={r.school_id} className="flex items-center gap-3 px-5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{r.school}</p>
                <p className="text-xs text-gray-500">
                  {r.plan} · {naira(r.amount)}
                  {!r.auto_renew && <span className="text-amber-700"> · manual renewal</span>}
                </p>
              </div>
              <span
                className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${
                  r.days_left <= 7 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {r.days_left === 0 ? 'Today' : `${r.days_left}d`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- growth chart

function Growth({ trends }: { trends: CommandCenterData['trends'] }) {
  const revenue = trends.reduce((sum, m) => sum + m.revenue, 0);
  const schools = trends.reduce((sum, m) => sum + m.schools, 0);
  return (
    <Panel
      title="Revenue and new schools"
      description={`Last 12 months: ${naira(revenue)} collected, ${schools} school${schools === 1 ? '' : 's'} joined`}
      className="lg:col-span-2"
      action={
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-brand-600" /> Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-amber-500" /> New schools
          </span>
        </div>
      }
    >
      <div className="h-64 px-2 pb-3 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trends} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tick={{ fill: '#64748b' }}
            />
            <YAxis
              yAxisId="revenue"
              domain={[0, (max: number) => Math.max(max, 1000)]}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={52}
              tick={{ fill: '#64748b' }}
              tickFormatter={compactNaira}
            />
            <YAxis
              yAxisId="schools"
              orientation="right"
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={28}
              tick={{ fill: '#64748b' }}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                boxShadow: '0 8px 24px -6px rgb(16 24 40 / 0.12)',
                fontSize: 12,
              }}
              formatter={(value, name) =>
                name === 'revenue' ? [naira(Number(value)), 'Revenue'] : [value, 'New schools']
              }
            />
            <Bar
              yAxisId="revenue"
              dataKey="revenue"
              fill="var(--color-brand-600)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Line
              yAxisId="schools"
              dataKey="schools"
              type="linear"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 2.5, fill: '#f59e0b', strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function PlanMix({ plans }: { plans: CommandCenterData['plans'] }) {
  const most = Math.max(1, ...plans.map((p) => p.schools));
  return (
    <Panel
      title="Plans"
      description="Schools on an active subscription"
      action={<PanelLink href={`${ROOT}/plans`}>Manage</PanelLink>}
    >
      {plans.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-gray-500">No plans yet.</p>
      ) : (
        <ul className="space-y-4 px-5 py-4">
          {plans.map((plan) => (
            <li key={plan.name}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-gray-900">{plan.name}</span>
                <span className="text-gray-500">
                  <strong className="font-semibold text-gray-900">{plan.schools}</strong>
                  {plan.mrr > 0 && ` · ${naira(plan.mrr)}/mo`}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full bg-brand-500"
                  style={{ width: `${(plan.schools / most) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- schools and activity

const statusStyle: Record<string, [string, string]> = {
  active: ['Active', 'bg-green-50 text-green-700'],
  pending: ['Awaiting approval', 'bg-amber-50 text-amber-700'],
  expired: ['Expired', 'bg-red-50 text-red-700'],
  cancelled: ['Cancelled', 'bg-gray-100 text-gray-600'],
  no_plan: ['No plan', 'bg-gray-100 text-gray-600'],
};

function RecentSchools({ rows }: { rows: CommandCenterData['recent_schools'] }) {
  return (
    <Panel
      title="Newest schools"
      action={<PanelLink href={`${ROOT}/tenants`}>All schools</PanelLink>}
      className="lg:col-span-2"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-500">
              <th className="px-5 py-2 font-medium">School</th>
              <th className="px-3 py-2 font-medium">Plan</th>
              <th className="px-3 py-2 text-right font-medium">Students</th>
              <th className="px-5 py-2 text-right font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((school) => {
              const [label, tone] = statusStyle[school.status] ?? [
                school.status,
                'bg-gray-100 text-gray-600',
              ];
              return (
                <tr key={school.id}>
                  <td className="px-5 py-2.5">
                    <p className="font-medium text-gray-900">{school.name}</p>
                    {school.domain && <p className="text-xs text-gray-500">{school.domain}</p>}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-gray-700">{school.plan ?? '—'}</span>{' '}
                    <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
                      {label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-900">
                    {school.students.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-right text-gray-500">
                    {ago(school.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-gray-500">No schools yet.</p>
        )}
      </div>
    </Panel>
  );
}

function ActivityFeed({ rows }: { rows: CommandCenterData['activity'] }) {
  const iconFor = (action: string) =>
    action.includes('PAYMENT') || action.includes('SUBSCRIPTION')
      ? CreditCard
      : action.startsWith('SCHOOL_')
        ? SchoolIcon
        : Activity;
  return (
    <Panel
      title="Recent activity"
      action={<PanelLink href={`${ROOT}/governance`}>Audit log</PanelLink>}
    >
      {rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-gray-500">No activity yet.</p>
      ) : (
        <ul className="space-y-3 px-5 py-4">
          {rows.map((row) => {
            const Icon = iconFor(row.action);
            return (
              <li key={row.id} className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <Icon size={14} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-gray-800">{row.description}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {row.school_name} · {ago(row.created_at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- page

function percentChange(now: number, before: number) {
  if (!before) return undefined;
  return Math.round(((now - before) / before) * 100);
}

function Skeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="h-12 animate-pulse rounded-card bg-gray-100" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-card bg-gray-100" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-card bg-gray-100 lg:col-span-2" />
        <div className="h-80 animate-pulse rounded-card bg-gray-100" />
      </div>
    </div>
  );
}

/**
 * The super admin's home: platform status, the numbers that matter, what is waiting on them and
 * where the business is heading. Every figure comes from schools/command-center/.
 */
export function CommandCenter() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, isFetching, refetch } = useCommandCenter();

  const refresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: queryKeys.systemHealth });
  };

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const header = (
    <PageHeader
      eyebrow={today}
      title="Command center"
      description={
        data
          ? `Updated ${new Date(data.generated_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}. Refreshes every minute.`
          : 'Everything happening across the platform.'
      }
      actions={
        <>
          <button
            type="button"
            onClick={refresh}
            disabled={isFetching}
            aria-label="Refresh"
            className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <Link
            href={`${ROOT}/governance`}
            className="inline-flex h-9 items-center gap-2 rounded-control border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Megaphone size={15} /> Announcement
          </Link>
          <Link
            href={`${ROOT}/tenants`}
            className="inline-flex h-9 items-center gap-2 rounded-control bg-brand-600 px-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <SchoolIcon size={15} /> Manage schools
          </Link>
        </>
      }
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <Skeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        {header}
        <div className="flex items-center justify-between gap-3 rounded-card border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          <span className="flex items-center gap-2">
            <AlertTriangle size={16} /> The overview could not be loaded.
          </span>
          <button type="button" onClick={refresh} className="font-semibold underline">
            Try again
          </button>
        </div>
        <SystemStatus />
      </div>
    );
  }

  const { kpis } = data;
  const newSchools = kpis.schools.new_this_month;

  return (
    <div className="space-y-6">
      {header}
      <SystemStatus />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active schools"
          value={kpis.schools.active.toLocaleString()}
          icon={SchoolIcon}
          hint={`of ${kpis.schools.total.toLocaleString()} · ${newSchools} new this month`}
        />
        <StatCard
          label="Monthly recurring revenue"
          value={naira(kpis.mrr)}
          icon={Wallet}
          tone="success"
          hint={`${naira(kpis.mrr * 12)} a year at this rate`}
        />
        <StatCard
          label="Collected this month"
          value={naira(kpis.revenue.this_month)}
          icon={CreditCard}
          tone="info"
          trend={percentChange(kpis.revenue.this_month, kpis.revenue.last_month)}
          hint={
            kpis.revenue.last_month ? 'vs last month' : `${naira(kpis.revenue.this_year)} this year`
          }
        />
        <StatCard
          label="Students on the platform"
          value={kpis.students.toLocaleString()}
          icon={GraduationCap}
          tone="warning"
          hint={`${kpis.teachers.toLocaleString()} teachers`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AttentionQueue items={data.attention} />
        <Renewals rows={data.renewals} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Growth trends={data.trends} />
        <PlanMix plans={data.plans} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RecentSchools rows={data.recent_schools} />
        <ActivityFeed rows={data.activity} />
      </div>
    </div>
  );
}
