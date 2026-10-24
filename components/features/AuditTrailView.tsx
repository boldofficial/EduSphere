'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowRight, History, Search } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';

type Action = 'CREATE' | 'UPDATE' | 'DELETE';

interface AuditRow {
  id: number;
  at: string;
  action: Action;
  action_text: string;
  area: string;
  record: string;
  field: string;
  old: string | null;
  new: string | null;
  user: { id: number; name: string; role: string } | null;
  ip: string | null;
}

interface Person {
  id: number;
  name: string;
  role: string;
  changes: number;
}

const AREAS = ['Scores', 'Report cards', 'Students', 'Payments', 'Fees'];
const PAGE_SIZE = 50;

const ACTION_STYLE: Record<Action, string> = {
  CREATE: 'bg-success-50 text-success-700',
  UPDATE: 'bg-info-50 text-info-700',
  DELETE: 'bg-danger-50 text-danger-700',
};

const ROLE_TEXT: Record<string, string> = {
  SCHOOL_ADMIN: 'Admin',
  SUPER_ADMIN: 'Platform',
  TEACHER: 'Teacher',
  STAFF: 'Staff',
  STUDENT: 'Student',
  PARENT: 'Parent',
};

function when(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Value({ value }: { value: string | null }) {
  if (value === null || value === '') return <span className="text-gray-400">empty</span>;
  return <span className="break-words">{value}</span>;
}

const control =
  'rounded-control border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none';

/** Who changed scores, report cards, students, payments and fees, and when. Admins only. */
export function AuditTrailView() {
  const [area, setArea] = useState('');
  const [user, setUser] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  // Wait for a pause in typing before searching.
  useEffect(() => {
    const id = setTimeout(() => setQ(search.trim()), 350);
    return () => clearTimeout(id);
  }, [search]);
  useEffect(() => setPage(1), [area, user, action, from, to, q]);

  const params = { area, user, action, from, to, q, page, page_size: PAGE_SIZE };
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['audit-trail', params],
    queryFn: async () =>
      (
        await apiClient.get<{ count: number; results: AuditRow[] }>('core/audit-trail/', {
          params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '')),
        })
      ).data,
    placeholderData: keepPreviousData,
  });
  const { data: people = [] } = useQuery({
    queryKey: ['audit-trail-people'],
    queryFn: async () => (await apiClient.get<Person[]>('core/audit-trail/people/')).data,
  });

  const rows = data?.results ?? [];
  const total = data?.count ?? 0;
  const filtered = Boolean(area || user || action || from || to || q);

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        eyebrow="Tools"
        title="Audit trail"
        description="Every change to scores, report cards, students, payments and fees: who made it, when, and what it was before."
      />

      <section className="grid gap-3 rounded-card border border-gray-100 bg-white p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <label className="relative sm:col-span-2">
          <span className="sr-only">Search</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Student, subject, receipt no…"
            className={`${control} w-full pl-9`}
          />
        </label>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className={control}
          aria-label="Area"
        >
          <option value="">All areas</option>
          {AREAS.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <select
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className={control}
          aria-label="Changed by"
        >
          <option value="">Anyone</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({ROLE_TEXT[p.role] ?? p.role})
            </option>
          ))}
        </select>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className={control}
          aria-label="Kind of change"
        >
          <option value="">All changes</option>
          <option value="UPDATE">Changed</option>
          <option value="CREATE">Created</option>
          <option value="DELETE">Deleted</option>
        </select>
        <div className="flex min-w-0 items-center gap-2 sm:col-span-2 lg:col-span-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={`${control} min-w-0 flex-1`}
            aria-label="From"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={`${control} min-w-0 flex-1`}
            aria-label="To"
          />
        </div>
      </section>

      <p className="text-sm text-gray-500">
        {isLoading ? 'Loading…' : `${total.toLocaleString()} change${total === 1 ? '' : 's'}`}
        {isFetching && !isLoading ? ' · updating…' : ''}
      </p>

      {!isLoading && rows.length === 0 ? (
        <EmptyState
          icon={History}
          title={filtered ? 'No changes match these filters' : 'No changes recorded yet'}
          description={
            filtered
              ? 'Try a wider date range or clear a filter.'
              : 'Edits to scores, report cards, students, payments and fees will appear here.'
          }
        />
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-card border border-gray-100 bg-white shadow-card">
          {rows.map((row) => (
            <li key={row.id} className="grid gap-2 p-4 md:grid-cols-[180px_minmax(0,1fr)_200px]">
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-gray-900">{when(row.at)}</p>
                <p className="truncate text-gray-500">
                  {row.user
                    ? `${row.user.name} · ${ROLE_TEXT[row.user.role] ?? row.user.role}`
                    : 'System'}
                </p>
              </div>
              <div className="min-w-0 space-y-1 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ACTION_STYLE[row.action]}`}
                  >
                    {row.action_text}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {row.area}
                  </span>
                </div>
                <p className="break-words font-medium text-gray-900">{row.record}</p>
                {row.action === 'UPDATE' && (
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-600">
                    <span className="font-semibold text-gray-700">{row.field}:</span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 line-through decoration-gray-400">
                      <Value value={row.old} />
                    </span>
                    <ArrowRight size={14} className="shrink-0 text-gray-400" />
                    <span className="rounded bg-brand-50 px-1.5 py-0.5 text-gray-900">
                      <Value value={row.new} />
                    </span>
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-400 md:text-right">{row.ip ? `IP ${row.ip}` : ''}</p>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        currentPage={page}
        totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        onPageChange={setPage}
        isLoading={isFetching}
      />
    </div>
  );
}
