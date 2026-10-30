'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpenCheck, Check, Loader2, Lock } from 'lucide-react';
import apiClient from '@/lib/api-client';
import * as Types from '@/lib/types';
import { queryKeys, useClasses } from '@/lib/hooks/use-data';
import { useSchoolStore } from '@/lib/store';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/providers/toast-provider';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface Preset {
  key: string;
  label: string;
  subjects: string[];
}

interface ChoicesData {
  class_id: number;
  class_name: string;
  subjects: string[];
  compulsory: string[];
  presets: Preset[];
  students: { id: number; names: string; student_no: string; subjects: string[] }[];
}

const control =
  'rounded-control border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none';

/**
 * Which subjects each student in a class takes: compulsory subjects for everyone, plus electives
 * per student (senior secondary departments, language options…). Score entry, broadsheets and
 * report cards follow these choices.
 */
export function SubjectChoicesView() {
  const { addToast } = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const { currentRole } = useSchoolStore();
  const canEdit = currentRole === 'admin' || currentRole === 'super_admin';
  const params = useSearchParams();
  const { data: classes = [] } = useClasses();

  const [chosenClass, setChosenClass] = useState(params.get('class') || '');
  const classId = chosenClass || String(classes[0]?.id || '');

  const { data, isLoading } = useQuery({
    queryKey: ['subject-choices', classId],
    queryFn: async () =>
      (await apiClient.get<ChoicesData>(`academic/classes/${classId}/subject-choices/`)).data,
    enabled: !!classId,
  });

  // Local draft: the compulsory set and each student's electives.
  const [compulsory, setCompulsory] = useState<Set<string>>(new Set());
  const [electives, setElectives] = useState<Record<number, Set<string>>>({});
  const [loadedFor, setLoadedFor] = useState<ChoicesData | null>(null);
  if (data && data !== loadedFor) {
    const core = new Set(data.compulsory);
    setLoadedFor(data);
    setCompulsory(core);
    setElectives(
      Object.fromEntries(
        data.students.map((s) => [s.id, new Set(s.subjects.filter((name) => !core.has(name)))])
      )
    );
  }

  const optional = useMemo(
    () => (data?.subjects ?? []).filter((name) => !compulsory.has(name)),
    [data, compulsory]
  );

  const dirty = useMemo(() => {
    if (!data) return false;
    const core = new Set(data.compulsory);
    if (core.size !== compulsory.size || [...core].some((s) => !compulsory.has(s))) return true;
    return data.students.some((s) => {
      const saved = s.subjects
        .filter((name) => !compulsory.has(name))
        .sort()
        .join('|');
      const now = [...(electives[s.id] ?? [])]
        .filter((name) => !compulsory.has(name))
        .sort()
        .join('|');
      return saved !== now;
    });
  }, [data, compulsory, electives]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const save = useMutation({
    mutationFn: async () =>
      (
        await apiClient.put<ChoicesData & { updated: number }>(
          `academic/classes/${classId}/subject-choices/`,
          {
            compulsory: [...compulsory],
            choices: Object.fromEntries(
              (data?.students ?? []).map((s) => [
                s.id,
                [...(electives[s.id] ?? [])].filter((name) => !compulsory.has(name)),
              ])
            ),
          }
        )
      ).data,
    onSuccess: (saved) => {
      queryClient.setQueryData(['subject-choices', classId], saved);
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      addToast(`Subjects saved for ${saved.class_name}`, 'success');
    },
    onError: (error) => {
      const detail = (error as { response?: { data?: { detail?: string } } }).response?.data
        ?.detail;
      addToast(detail || 'Could not save the subjects.', 'error');
    },
  });

  const toggleCompulsory = (name: string) =>
    setCompulsory((current) => {
      const next = new Set(current);
      if (next.has(name)) {
        if (next.size === 1) {
          addToast('Keep at least one subject that everyone takes.', 'warning');
          return current;
        }
        next.delete(name);
      } else next.add(name);
      return next;
    });

  const toggleElective = (studentId: number, name: string) =>
    setElectives((all) => {
      const next = new Set(all[studentId] ?? []);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return { ...all, [studentId]: next };
    });

  const applyPreset = (studentIds: number[], preset: Preset | 'none') =>
    setElectives((all) => {
      const next = { ...all };
      const picked = preset === 'none' ? [] : preset.subjects.filter((n) => !compulsory.has(n));
      for (const id of studentIds) next[id] = new Set(picked);
      return next;
    });

  const students = data?.students ?? [];
  const presetByKey = (key: string) => data?.presets.find((p) => p.key === key);

  return (
    <div className="space-y-6 pb-24">
      <Link
        href="/classes"
        className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} /> Classes
      </Link>
      <PageHeader
        eyebrow="Academics"
        title="Student subjects"
        description="Choose the subjects every student in a class takes, then each student's electives (for example by department). Score entry, broadsheets and report cards follow these choices."
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          Class
          <select
            value={classId}
            onChange={async (e) => {
              const next = e.target.value;
              if (
                dirty &&
                !(await confirm({
                  title: 'Leave without saving?',
                  description: 'Your subject changes for this class have not been saved.',
                  confirmLabel: 'Leave',
                }))
              )
                return;
              setChosenClass(next);
            }}
            className={control}
          >
            {classes.map((c: Types.Class) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {data && (
          <span className="text-sm text-gray-500">
            {students.length} student{students.length === 1 ? '' : 's'} · {data.subjects.length}{' '}
            subjects offered
          </span>
        )}
      </div>

      {isLoading || !data ? (
        <p className="text-sm text-gray-500">{classId ? 'Loading…' : 'No classes yet.'}</p>
      ) : data.subjects.length === 0 ? (
        <EmptyState
          icon={BookOpenCheck}
          title={`${data.class_name} has no subjects yet`}
          description="Add subjects to the class first (Classes → Configure)."
        />
      ) : (
        <>
          <section className="space-y-3 rounded-card border border-gray-100 bg-white p-5 shadow-card">
            <div>
              <h2 className="font-bold text-gray-900">Everyone in {data.class_name} takes</h2>
              <p className="text-sm text-gray-500">
                Ticked subjects are compulsory. Untick one to make it an elective that students
                choose.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.subjects.map((name) => {
                const on = compulsory.has(name);
                return (
                  <button
                    key={name}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => toggleCompulsory(name)}
                    aria-pressed={on}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-default ${
                      on
                        ? 'border-brand-200 bg-brand-50 text-brand-800'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {on && <Check size={14} />}
                    {name}
                  </button>
                );
              })}
            </div>
          </section>

          {optional.length === 0 ? (
            <p className="rounded-card border border-gray-100 bg-white p-5 text-sm text-gray-600 shadow-card">
              Every subject is compulsory, so all {students.length} students take all{' '}
              {data.subjects.length}. Untick a subject above to let students choose it.
            </p>
          ) : (
            <section className="overflow-hidden rounded-card border border-gray-100 bg-white shadow-card">
              <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
                <h2 className="font-bold text-gray-900">Electives</h2>
                {canEdit && data.presets.length > 0 && (
                  <label className="ml-auto flex items-center gap-2 text-sm text-gray-600">
                    Give everyone
                    <select
                      value=""
                      onChange={(e) => {
                        const preset =
                          e.target.value === 'none' ? 'none' : presetByKey(e.target.value);
                        if (preset)
                          applyPreset(
                            students.map((s) => s.id),
                            preset
                          );
                      }}
                      className={control}
                    >
                      <option value="">Choose…</option>
                      {data.presets.map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.label} subjects
                        </option>
                      ))}
                      <option value="none">No electives</option>
                    </select>
                  </label>
                )}
              </div>
              <div className="max-h-[60vh] overflow-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs font-semibold text-gray-500">
                    <tr>
                      <th className="sticky left-0 bg-gray-50 px-4 py-3">Student</th>
                      {data.presets.length > 0 && <th className="px-3 py-3">Department</th>}
                      {optional.map((name) => (
                        <th key={name} className="px-2 py-3 text-center font-semibold">
                          <span className="inline-block max-w-[96px] leading-tight">{name}</span>
                        </th>
                      ))}
                      <th className="px-3 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((s) => {
                      const mine = electives[s.id] ?? new Set<string>();
                      const total = compulsory.size + optional.filter((n) => mine.has(n)).length;
                      const matching = data.presets.find(
                        (p) =>
                          p.subjects.filter((n) => !compulsory.has(n)).length === mine.size &&
                          p.subjects.every((n) => compulsory.has(n) || mine.has(n))
                      );
                      return (
                        <tr key={s.id} className="hover:bg-gray-50/60">
                          <td className="sticky left-0 bg-white px-4 py-2.5">
                            <p className="max-w-[200px] truncate font-medium text-gray-900">
                              {s.names}
                            </p>
                            <p className="font-mono text-xs text-gray-400">{s.student_no}</p>
                          </td>
                          {data.presets.length > 0 && (
                            <td className="px-3 py-2.5">
                              <select
                                value={matching?.key ?? (mine.size ? 'custom' : '')}
                                disabled={!canEdit}
                                onChange={(e) => {
                                  const preset =
                                    e.target.value === '' ? 'none' : presetByKey(e.target.value);
                                  if (preset) applyPreset([s.id], preset);
                                }}
                                className="rounded-control border border-gray-200 bg-white px-2 py-1 text-xs"
                                aria-label={`Department for ${s.names}`}
                              >
                                <option value="">None</option>
                                {data.presets.map((p) => (
                                  <option key={p.key} value={p.key}>
                                    {p.label}
                                  </option>
                                ))}
                                {!matching && mine.size > 0 && (
                                  <option value="custom" disabled>
                                    Custom
                                  </option>
                                )}
                              </select>
                            </td>
                          )}
                          {optional.map((name) => (
                            <td key={name} className="px-2 py-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={mine.has(name)}
                                disabled={!canEdit}
                                onChange={() => toggleElective(s.id, name)}
                                className="h-4 w-4 accent-brand-600"
                                aria-label={`${s.names} takes ${name}`}
                              />
                            </td>
                          ))}
                          <td className="px-3 py-2.5 text-right font-semibold text-gray-700">
                            {total}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="flex items-center gap-1.5 border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
                <Lock size={12} /> Plus {compulsory.size} compulsory subject
                {compulsory.size === 1 ? '' : 's'} for everyone.
              </p>
            </section>
          )}

          {canEdit && (
            <div className="sticky bottom-4 flex justify-end">
              <button
                type="button"
                disabled={!dirty || save.isPending}
                onClick={() => save.mutate()}
                className="inline-flex items-center gap-2 rounded-control bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-card hover:bg-brand-700 disabled:opacity-50"
              >
                {save.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                {dirty ? 'Save subjects' : 'Saved'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
