'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Loader2,
  Lock,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import {
  type CalendarSession,
  type CalendarTerm,
  useAcademicCalendar,
} from '@/lib/hooks/use-calendar';
import { useSchoolStore } from '@/lib/store';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/providers/toast-provider';

const control =
  'w-full rounded-control border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none';

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
  upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
};
const STATUS_TEXT: Record<string, string> = {
  active: 'Current',
  closed: 'Closed',
  upcoming: 'Upcoming',
};

function detailOf(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || fallback
  );
}

export function formatDay(value: string | null | undefined) {
  if (!value) return '';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function range(start: string | null, end: string | null) {
  if (!start && !end) return 'Dates not set';
  return `${formatDay(start) || '?'} – ${formatDay(end) || '?'}`;
}

/** The upcoming term straight after the current one: the only term that can be started. */
function nextTermId(sessions: CalendarSession[]) {
  const terms = [...sessions]
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((s) => [...s.terms].sort((a, b) => a.order - b.order));
  const current = terms.findIndex((t) => t.status === 'active');
  const next = terms.slice(current + 1).find((t) => t.status === 'upcoming');
  return next?.id ?? null;
}

/** Sessions and terms: dates, mid-term breaks, school days and the current term. */
export function AcademicCalendarView() {
  const { currentRole } = useSchoolStore();
  const canEdit = currentRole === 'admin' || currentRole === 'super_admin';
  const confirm = useConfirm();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useAcademicCalendar();
  const [editing, setEditing] = useState<{ term: CalendarTerm; session: string } | null>(null);

  const addSession = useMutation({
    mutationFn: async () => (await apiClient.post('academic/calendar/', {})).data,
    onSuccess: (session: CalendarSession) => {
      queryClient.invalidateQueries({ queryKey: ['academic-calendar'] });
      addToast(`${session.name} added. Check its term dates.`, 'success');
    },
    onError: (error) => addToast(detailOf(error, 'Could not add the session.'), 'error'),
  });

  const removeSession = useMutation({
    mutationFn: async (id: number) => apiClient.delete(`academic/calendar/sessions/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-calendar'] });
      addToast('Session removed.', 'success');
    },
    onError: (error) => addToast(detailOf(error, 'Could not remove the session.'), 'error'),
  });

  const sessions = data?.sessions ?? [];
  const current = data?.current;
  const nextId = nextTermId(sessions);
  const [closing, setClosing] = useState(false);

  const remove = async (session: CalendarSession) => {
    const ok = await confirm({
      title: `Remove ${session.name}?`,
      description: 'It has not started, so nothing has been recorded under it.',
      confirmLabel: 'Remove',
      tone: 'danger',
    });
    if (ok) removeSession.mutate(session.id);
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        eyebrow="Administration"
        title="Sessions & terms"
        description="Each session's terms, their dates and mid-term breaks. Every score, fee, attendance record and report card is filed under the current term."
        actions={
          canEdit ? (
            <button
              type="button"
              onClick={() => addSession.mutate()}
              disabled={addSession.isPending}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-control bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {addSession.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              Add next session
            </button>
          ) : undefined
        }
      />

      {current && (
        <section className="rounded-card border border-brand-100 bg-brand-50/60 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Current term</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="text-xl font-bold text-gray-900">
                {current.term}, {current.session}
              </h2>
              {current.week && current.weeks && (
                <span className="text-sm font-semibold text-brand-700">
                  Week {current.week} of {current.weeks}
                </span>
              )}
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => setClosing(true)}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-control border border-brand-200 bg-white px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50"
              >
                <Lock size={15} /> Close term
              </button>
            )}
          </div>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-gray-500">Dates</dt>
              <dd className="font-medium text-gray-900">
                {range(current.start_date, current.end_date)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">School days</dt>
              <dd className="font-medium text-gray-900">
                {current.school_days ?? 'Set the dates to count them'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Term ends</dt>
              <dd className="font-medium text-gray-900">
                {current.days_left == null
                  ? 'No end date yet'
                  : current.days_left < 0
                    ? `Ended ${-current.days_left} day${current.days_left === -1 ? '' : 's'} ago`
                    : `In ${current.days_left} day${current.days_left === 1 ? '' : 's'}`}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="No sessions yet"
          description="Add the current session to set its term dates."
        />
      ) : (
        <div className="space-y-5">
          {sessions.map((session) => (
            <section
              key={session.id}
              className="overflow-hidden rounded-card border border-gray-200 bg-white"
            >
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-gray-900">{session.name}</h3>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[session.status]}`}
                  >
                    {STATUS_TEXT[session.status]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {range(session.start_date, session.end_date)}
                  </span>
                </div>
                {canEdit && session.status === 'upcoming' && (
                  <button
                    type="button"
                    onClick={() => remove(session)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </header>
              <ul className="divide-y divide-gray-100">
                {session.terms.map((term) => (
                  <li
                    key={term.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{term.name}</p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[term.status]}`}
                        >
                          {STATUS_TEXT[term.status]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-600">
                        {range(term.start_date, term.end_date)}
                        {term.mid_term_start && (
                          <span className="text-gray-500">
                            {' '}
                            · Mid-term {formatDay(term.mid_term_start)} –{' '}
                            {formatDay(term.mid_term_end)}
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 sm:w-32 sm:text-right">
                      {term.school_days != null ? `${term.school_days} school days` : ''}
                    </p>
                    {canEdit && (
                      <div className="flex gap-2 sm:w-56 sm:justify-end">
                        {term.status !== 'closed' && (
                          <button
                            type="button"
                            onClick={() => setEditing({ term, session: session.name })}
                            className="inline-flex items-center gap-1 rounded-control border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil size={13} /> Dates
                          </button>
                        )}
                        {term.id === nextId && (
                          <button
                            type="button"
                            onClick={() => setClosing(true)}
                            className="inline-flex items-center gap-1 rounded-control bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                          >
                            <Play size={13} /> Start term
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="flex items-start gap-2 text-sm text-gray-500">
        <CalendarDays size={16} className="mt-0.5 shrink-0" />
        <span>
          Public holidays and other days off come from{' '}
          <Link href="/calendar" className="font-semibold text-brand-700 hover:underline">
            the school calendar
          </Link>
          : add them as Holiday events and they are left out of the school days.
        </span>
      </p>

      {closing && current && (
        <CloseTermModal termId={current.id} onClose={() => setClosing(false)} />
      )}

      {editing && (
        <TermDatesModal
          term={editing.term}
          session={editing.session}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function TermDatesModal({
  term,
  session,
  onClose,
}: {
  term: CalendarTerm;
  session: string;
  onClose: () => void;
}) {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    start_date: term.start_date ?? '',
    end_date: term.end_date ?? '',
    mid_term_start: term.mid_term_start ?? '',
    mid_term_end: term.mid_term_end ?? '',
  });
  const [error, setError] = useState('');

  const save = useMutation({
    mutationFn: async () =>
      apiClient.patch(
        `academic/calendar/terms/${term.id}/`,
        Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v || null]))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      addToast(`${term.name} dates saved.`, 'success');
      onClose();
    },
    onError: (err) => setError(detailOf(err, 'Could not save the dates.')),
  });

  const field = (key: keyof typeof form, label: string) => (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      <input
        type="date"
        className={control}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </label>
  );

  return (
    <Modal isOpen onClose={onClose} title={`${term.name}, ${session}`}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError('');
          save.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {field('start_date', 'Resumes')}
          {field('end_date', 'Vacates')}
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Mid-term break (optional)
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {field('mid_term_start', 'First day off')}
          {field('mid_term_end', 'Last day off')}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-control border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={save.isPending}
            className="rounded-control bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {save.isPending ? 'Saving…' : 'Save dates'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface ChecklistItem {
  class: string;
  missing: number;
  detail: string;
}

interface Checklist {
  term: { id: number; session: string; term: string };
  next: { id: number; session: string; term: string } | null;
  checks: {
    key: string;
    title: string;
    status: 'ok' | 'warn';
    summary: string;
    items: ChecklistItem[];
  }[];
  ready: boolean;
}

/** What is still missing in the current term, then close it and start the next one. */
function CloseTermModal({ termId, onClose }: { termId: number; onClose: () => void }) {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['term-checklist', termId],
    queryFn: async () =>
      (await apiClient.get(`academic/calendar/terms/${termId}/checklist/`)).data as Checklist,
    staleTime: 0,
  });

  const start = useMutation({
    mutationFn: async (id: number) => apiClient.post(`academic/calendar/terms/${id}/start/`),
    onSuccess: () => {
      // Almost every screen reads the current term: refresh everything.
      queryClient.invalidateQueries();
      addToast(
        `${data?.next?.term} ${data?.next?.session} has started. The bursar can now set up its fees.`,
        'success'
      );
      onClose();
    },
    onError: (error) => addToast(detailOf(error, 'Could not start the term.'), 'error'),
  });

  const title = data ? `Close ${data.term.term}, ${data.term.session}` : 'Close term';
  return (
    <Modal isOpen onClose={onClose} title={title} size="lg">
      {isLoading || !data ? (
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Checking the term…
        </p>
      ) : (
        <div className="space-y-5">
          <ul className="space-y-3">
            {data.checks.map((check) => (
              <li key={check.key} className="rounded-control border border-gray-200 p-3">
                <div className="flex items-start gap-3">
                  {check.status === 'ok' ? (
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" />
                  ) : (
                    <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{check.title}</p>
                    <p className="text-sm text-gray-600">{check.summary}</p>
                    {check.key === 'promotion' && check.status === 'warn' && (
                      <Link
                        href="/sessions/promotion"
                        className="mt-1 inline-block text-sm font-semibold text-brand-700 hover:underline"
                      >
                        Review promotions →
                      </Link>
                    )}
                    {check.items.length > 0 && (
                      <ul className="mt-2 divide-y divide-gray-100 rounded-control bg-gray-50 text-xs">
                        {check.items.map((item) => (
                          <li key={item.class} className="flex gap-3 px-3 py-1.5">
                            <span className="w-24 shrink-0 font-semibold text-gray-800">
                              {item.class}
                            </span>
                            <span className="text-gray-600">
                              {item.detail || `${item.missing} missing`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {data.next ? (
            <p className="text-sm text-gray-600">
              {data.ready ? 'Everything is in place. ' : 'You can still close the term. '}
              After closing, teachers can no longer change {data.term.term} scores, report cards or
              attendance (admins still can), and everything new is recorded under{' '}
              <strong>
                {data.next.term} {data.next.session}
              </strong>
              .
            </p>
          ) : (
            <p className="text-sm text-amber-700">
              There is no term after this one yet. Add the next session on this page first.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-control border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Not yet
            </button>
            {data.next && (
              <button
                type="button"
                onClick={() => start.mutate(data.next!.id)}
                disabled={start.isPending}
                className="inline-flex items-center gap-2 rounded-control bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {start.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Play size={15} />
                )}
                Close and start {data.next.term}
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
