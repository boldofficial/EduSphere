'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, GraduationCap, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useSchoolStore } from '@/lib/store';
import { useAcademicCalendar } from '@/lib/hooks/use-calendar';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/providers/toast-provider';

type Decision = 'promote' | 'repeat' | 'graduate';

interface PlanStudent {
  id: string;
  names: string;
  student_no: string;
  average: number | null;
  terms: number;
  suggestion: Decision;
  done: boolean;
}

interface PlanClass {
  id: number;
  name: string;
  next_class: { id: number; name: string } | null;
  graduates: boolean;
  students: PlanStudent[];
}

interface Plan {
  session: string;
  next_session: string;
  threshold: number;
  classes: PlanClass[];
  pending: number;
}

const control =
  'rounded-control border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none';

function detailOf(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || fallback
  );
}

/**
 * End of session: every class's students with a suggested decision from the pass mark, sent to the
 * class's own next class. The admin adjusts and applies once for the whole school.
 */
export function SessionPromotionView({ embedded = false }: { embedded?: boolean }) {
  const { currentRole } = useSchoolStore();
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin';
  const confirm = useConfirm();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['session-promotion'],
    queryFn: async () => (await apiClient.get('academic/calendar/promotion/')).data as Plan,
    enabled: isAdmin,
  });
  const current = useAcademicCalendar(isAdmin).data?.current;
  const [changes, setChanges] = useState<Record<string, Decision>>({});
  const [copyTeachers, setCopyTeachers] = useState(true);

  const decisionOf = (s: PlanStudent) => changes[s.id] ?? s.suggestion;
  const pending = useMemo(
    () => (data?.classes ?? []).flatMap((c) => c.students.filter((s) => !s.done)),
    [data]
  );
  const totals = pending.reduce((acc, s) => ({ ...acc, [decisionOf(s)]: acc[decisionOf(s)] + 1 }), {
    promote: 0,
    repeat: 0,
    graduate: 0,
  } as Record<Decision, number>);

  const apply = useMutation({
    mutationFn: async () =>
      (
        await apiClient.post('academic/calendar/promotion/', {
          session: data!.session,
          decisions: Object.fromEntries(pending.map((s) => [s.id, decisionOf(s)])),
          copy_subject_teachers: copyTeachers,
        })
      ).data as { promoted: number; repeated: number; graduated: number },
    onSuccess: (result) => {
      setChanges({});
      // Students' classes changed everywhere.
      queryClient.invalidateQueries();
      addToast(
        `Done: ${result.promoted} promoted, ${result.repeated} repeating, ${result.graduated} graduated.`,
        'success'
      );
    },
    onError: (error) => addToast(detailOf(error, 'Could not apply the promotions.'), 'error'),
  });

  const run = async () => {
    const ok = await confirm({
      title: `Apply promotions for ${data?.session}?`,
      description: `${totals.promote} promoted, ${totals.repeat} repeating and ${totals.graduate} graduating. Each student's class for ${data?.session} is kept in their history; graduates move to alumni.`,
      confirmLabel: 'Apply promotions',
    });
    if (ok) apply.mutate();
  };

  const header = (
    <PageHeader
      eyebrow={embedded ? undefined : 'Sessions & terms'}
      title={data ? `End of session ${data.session}` : 'End of session'}
      description={
        data
          ? `Promote, repeat or graduate every student before ${data.next_session} starts. Suggestions use the pass mark of ${data.threshold}% across the session's report cards; change any of them.`
          : 'Promote, repeat or graduate every student before the new session starts.'
      }
    />
  );

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        {header}
        <p className="text-sm text-gray-600">Only the school&apos;s admins can promote students.</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        {header}
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  if (data.classes.length === 0) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          icon={GraduationCap}
          title="No students in classes"
          description="There is nobody to promote."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      {header}
      {current && current.session === data.session && current.term !== 'Third Term' && (
        <p className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          It is still {current.term}. Promotions are normally applied at the end of Third Term, once
          the session&apos;s results are in; applying now moves students to their new classes
          straight away.
        </p>
      )}
      {data.pending === 0 && (
        <p className="flex items-center gap-2 rounded-card border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 size={16} /> Every student has been promoted, repeated or graduated for{' '}
          {data.session}.
        </p>
      )}

      {data.classes.map((cls) => (
        <section
          key={cls.id}
          className="overflow-hidden rounded-card border border-gray-200 bg-white"
        >
          <header className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-5 py-3">
            <h3 className="text-base font-bold text-gray-900">{cls.name}</h3>
            <ArrowRight size={15} className="text-gray-400" />
            {cls.graduates ? (
              <span className="text-sm font-semibold text-brand-700">Graduates</span>
            ) : cls.next_class ? (
              <span className="text-sm font-semibold text-brand-700">{cls.next_class.name}</span>
            ) : (
              <span className="text-sm text-amber-700">
                No next class set.{' '}
                <Link href="/school-structure" className="font-semibold underline">
                  Set it in School structure
                </Link>
              </span>
            )}
          </header>
          <ul className="divide-y divide-gray-100">
            {cls.students.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{s.names}</p>
                  <p className="text-xs text-gray-500">{s.student_no}</p>
                </div>
                <p className="w-28 text-sm text-gray-600">
                  {s.average == null
                    ? 'No results'
                    : `${s.average}% · ${s.terms} term${s.terms === 1 ? '' : 's'}`}
                </p>
                {s.done ? (
                  <span className="w-44 text-right text-xs font-semibold text-green-700">Done</span>
                ) : (
                  <select
                    aria-label={`Decision for ${s.names}`}
                    className={`${control} w-44`}
                    value={decisionOf(s)}
                    onChange={(e) => setChanges({ ...changes, [s.id]: e.target.value as Decision })}
                  >
                    {cls.next_class && !cls.graduates && (
                      <option value="promote">Promote to {cls.next_class.name}</option>
                    )}
                    <option value="repeat">Repeat {cls.name}</option>
                    <option value="graduate">Graduate</option>
                  </select>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {pending.length > 0 && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card border border-gray-200 bg-white px-5 py-3 shadow-raised">
          <div className="text-sm text-gray-700">
            <strong>{totals.promote}</strong> promote · <strong>{totals.repeat}</strong> repeat ·{' '}
            <strong>{totals.graduate}</strong> graduate
            <label className="mt-1 flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={copyTeachers}
                onChange={(e) => setCopyTeachers(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600"
              />
              Keep each class&apos;s subject teachers for {data.next_session}
            </label>
          </div>
          <button
            type="button"
            onClick={run}
            disabled={apply.isPending}
            className="inline-flex items-center gap-2 rounded-control bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {apply.isPending && <Loader2 size={15} className="animate-spin" />}
            Apply promotions
          </button>
        </div>
      )}
    </div>
  );
}
