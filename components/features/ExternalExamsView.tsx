'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Award, ClipboardPaste, Loader2, Plus, UserPlus } from 'lucide-react';
import apiClient from '@/lib/api-client';
import * as Types from '@/lib/types';
import { useClasses } from '@/lib/hooks/use-data';
import { useSchoolStore } from '@/lib/store';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/providers/toast-provider';

interface Exam {
  id: number;
  body: string;
  body_label: string;
  name: string;
  year: number;
  target_class: number | null;
  target_class_name: string;
  registration_deadline: string | null;
  max_subjects: number;
  candidate_count: number;
}

interface CandidateSummary {
  credits?: number;
  english_credit?: boolean;
  maths_credit?: boolean;
  five_credits_with_english_maths?: boolean;
  score?: number | null;
}

interface Candidate {
  id: number;
  exam: number;
  student_name: string;
  student_no: string;
  class_name: string;
  candidate_number: string;
  subjects: string[];
  results: Record<string, string>;
  status: string;
  summary: CandidateSummary | null;
}

interface ExamSummary {
  candidates: number;
  with_results: number;
  withheld: number;
  five_credits_with_english_maths?: number;
  five_credits_rate?: number | null;
  english_credit_rate?: number | null;
  maths_credit_rate?: number | null;
  average_score?: number | null;
  highest_score?: number | null;
  scored_200_plus?: number;
  subjects?: { subject: string; sat: number; credits: number; credit_rate: number }[];
}

const BODIES = [
  ['WAEC', 'WAEC (WASSCE)'],
  ['NECO', 'NECO (SSCE)'],
  ['NABTEB', 'NABTEB'],
  ['BECE', 'BECE (Junior WAEC)'],
  ['JAMB', 'JAMB (UTME)'],
  ['COMMON_ENTRANCE', 'Common Entrance'],
  ['OTHER', 'Other'],
];
const SCORE_BODIES = new Set(['JAMB', 'COMMON_ENTRANCE']);
const STATUS_TEXT: Record<string, string> = {
  registered: 'Registered',
  sat: 'Sat the exam',
  released: 'Results released',
  withheld: 'Withheld',
  absent: 'Absent',
};
const control =
  'w-full rounded-control border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none';

function detailOf(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || fallback
  );
}

const rows = <T,>(data: { results?: T[] } | T[] | undefined): T[] =>
  Array.isArray(data) ? data : (data?.results ?? []);

/** WAEC, NECO, BECE, JAMB…: enter candidates, record results, see how the school did. */
export function ExternalExamsView() {
  const { currentRole } = useSchoolStore();
  const isLearner = currentRole === 'student' || currentRole === 'parent';
  return isLearner ? <MyExamResults /> : <StaffExams />;
}

function StaffExams() {
  const { currentRole } = useSchoolStore();
  const canEdit = currentRole === 'admin' || currentRole === 'super_admin';
  const [openExam, setOpenExam] = useState<Exam | null>(null);
  const [creating, setCreating] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['external-exams'],
    queryFn: async () => rows<Exam>((await apiClient.get('academic/external-exams/')).data),
  });

  if (openExam)
    return <ExamDetail exam={openExam} canEdit={canEdit} onBack={() => setOpenExam(null)} />;

  const exams = data ?? [];
  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        eyebrow="Academics"
        title="WAEC, NECO & JAMB"
        description="Enter candidates for external exams, record their results and see how the school did: credits in English and Mathematics and the 5-credit pass rate."
        actions={
          canEdit ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 rounded-control bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
            >
              <Plus size={16} /> New exam
            </button>
          ) : undefined
        }
      />
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : exams.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No external exams yet"
          description="Add this year's WASSCE, NECO, BECE or UTME to start entering candidates."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {exams.map((exam) => (
            <li key={exam.id}>
              <button
                type="button"
                onClick={() => setOpenExam(exam)}
                className="flex h-full w-full flex-col gap-2 rounded-card border border-gray-100 bg-white p-5 text-left shadow-card transition hover:border-brand-200"
              >
                <span className="text-xs font-bold uppercase tracking-wide text-brand-600">
                  {exam.body_label} · {exam.year}
                </span>
                <span className="truncate font-bold text-gray-900">{exam.name}</span>
                <span className="text-sm text-gray-500">
                  {exam.candidate_count} candidate{exam.candidate_count === 1 ? '' : 's'}
                  {exam.target_class_name ? ` · ${exam.target_class_name}` : ''}
                </span>
                {exam.registration_deadline && (
                  <span className="text-xs text-gray-500">
                    Registration closes{' '}
                    {new Date(exam.registration_deadline).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      <CreateExamModal isOpen={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function CreateExamModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { data: classes = [] } = useClasses();
  const year = new Date().getFullYear();
  const [form, setForm] = useState({
    body: 'WAEC',
    name: `WASSCE May/June ${year}`,
    year: String(year),
    target_class: '',
    registration_deadline: '',
    max_subjects: '9',
  });
  const create = useMutation({
    mutationFn: async () =>
      (
        await apiClient.post('academic/external-exams/', {
          ...form,
          year: Number(form.year),
          max_subjects: Number(form.max_subjects),
          target_class: form.target_class || null,
          registration_deadline: form.registration_deadline || null,
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-exams'] });
      addToast('Exam added', 'success');
      onClose();
    },
    onError: (error) => addToast(detailOf(error, 'Could not add the exam.'), 'error'),
  });
  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New external exam" size="md">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <label className="space-y-1 text-sm font-semibold text-gray-700">
          Exam body
          <select value={form.body} onChange={set('body')} className={control}>
            {BODIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-semibold text-gray-700">
          Year
          <input
            type="number"
            value={form.year}
            onChange={set('year')}
            className={control}
            required
          />
        </label>
        <label className="space-y-1 text-sm font-semibold text-gray-700 sm:col-span-2">
          Name
          <input
            value={form.name}
            onChange={set('name')}
            maxLength={120}
            className={control}
            required
          />
        </label>
        <label className="space-y-1 text-sm font-semibold text-gray-700">
          Candidates from class
          <select value={form.target_class} onChange={set('target_class')} className={control}>
            <option value="">Choose later</option>
            {classes.map((c: Types.Class) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-semibold text-gray-700">
          Registration closes
          <input
            type="date"
            value={form.registration_deadline}
            onChange={set('registration_deadline')}
            className={control}
          />
        </label>
        <label className="space-y-1 text-sm font-semibold text-gray-700">
          Subjects per candidate (max)
          <input
            type="number"
            min={1}
            max={20}
            value={form.max_subjects}
            onChange={set('max_subjects')}
            className={control}
          />
        </label>
        <div className="flex items-end justify-end sm:col-span-2">
          <button
            type="submit"
            disabled={create.isPending}
            className="inline-flex items-center gap-2 rounded-control bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {create.isPending && <Loader2 size={16} className="animate-spin" />} Add exam
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-card border border-gray-100 bg-white p-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

const pct = (value: number | null | undefined) => (value == null ? '–' : `${value}%`);

function ExamDetail({
  exam,
  canEdit,
  onBack,
}: {
  exam: Exam;
  canEdit: boolean;
  onBack: () => void;
}) {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const scoreExam = SCORE_BODIES.has(exam.body);
  const [importing, setImporting] = useState(false);

  const { data: summary } = useQuery({
    queryKey: ['external-exams', exam.id, 'summary'],
    queryFn: async () =>
      (await apiClient.get<ExamSummary>(`academic/external-exams/${exam.id}/summary/`)).data,
  });
  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['external-exams', exam.id, 'candidates'],
    queryFn: async () =>
      rows<Candidate>(
        (
          await apiClient.get('academic/external-exam-candidates/', {
            params: { exam: exam.id, page_size: 500 },
          })
        ).data
      ),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['external-exams'] });

  const register = useMutation({
    mutationFn: async () =>
      (await apiClient.post(`academic/external-exams/${exam.id}/register/`, {})).data,
    onSuccess: (data: { registered: number; already_entered: number }) => {
      refresh();
      addToast(
        data.registered
          ? `${data.registered} student${data.registered === 1 ? '' : 's'} entered`
          : 'Everyone in the class is already entered',
        'success'
      );
    },
    onError: (error) => addToast(detailOf(error, 'Could not enter the class.'), 'error'),
  });
  const updateCandidate = useMutation({
    mutationFn: async ({ id, changes }: { id: number; changes: Partial<Candidate> }) =>
      (await apiClient.patch(`academic/external-exam-candidates/${id}/`, changes)).data,
    onSuccess: refresh,
    onError: (error) => addToast(detailOf(error, 'Could not save.'), 'error'),
  });

  return (
    <div className="space-y-6 pb-20">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} /> All exams
      </button>
      <PageHeader
        eyebrow={`${exam.body_label} · ${exam.year}`}
        title={exam.name}
        description={
          exam.target_class_name
            ? `Candidates from ${exam.target_class_name} · up to ${exam.max_subjects} subjects each`
            : `Up to ${exam.max_subjects} subjects each`
        }
        actions={
          canEdit ? (
            <div className="flex flex-wrap gap-2">
              {exam.target_class && (
                <button
                  type="button"
                  disabled={register.isPending}
                  onClick={() => register.mutate()}
                  className="inline-flex items-center gap-2 rounded-control border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <UserPlus size={16} /> Enter {exam.target_class_name}
                </button>
              )}
              <button
                type="button"
                onClick={() => setImporting(true)}
                className="inline-flex items-center gap-2 rounded-control bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
              >
                <ClipboardPaste size={16} /> Import results
              </button>
            </div>
          ) : undefined
        }
      />

      {summary && summary.with_results > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {scoreExam ? (
            <>
              <Stat label="Average score" value={String(summary.average_score ?? '–')} />
              <Stat label="Highest score" value={String(summary.highest_score ?? '–')} />
              <Stat label="Scored 200+" value={String(summary.scored_200_plus ?? 0)} />
              <Stat label="Results in" value={`${summary.with_results}/${summary.candidates}`} />
            </>
          ) : (
            <>
              <Stat
                label="5 credits incl. English & Maths"
                value={pct(summary.five_credits_rate)}
                hint={`${summary.five_credits_with_english_maths} of ${summary.with_results} candidates`}
              />
              <Stat label="Credit in English" value={pct(summary.english_credit_rate)} />
              <Stat label="Credit in Mathematics" value={pct(summary.maths_credit_rate)} />
              <Stat
                label="Results in"
                value={`${summary.with_results}/${summary.candidates}`}
                hint={summary.withheld ? `${summary.withheld} withheld` : undefined}
              />
            </>
          )}
        </section>
      )}

      {summary?.subjects && summary.subjects.length > 0 && (
        <section className="rounded-card border border-gray-100 bg-white p-5 shadow-card">
          <h2 className="mb-3 font-bold text-gray-900">Credits by subject</h2>
          <ul className="space-y-2">
            {summary.subjects.map((s) => (
              <li
                key={s.subject}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="flex justify-between gap-2">
                    <span className="truncate font-medium text-gray-800">{s.subject}</span>
                    <span className="shrink-0 text-gray-500">
                      {s.credits}/{s.sat}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${s.credit_rate}%` }}
                    />
                  </div>
                </div>
                <span className="w-12 text-right font-semibold text-gray-700">
                  {s.credit_rate}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="overflow-hidden rounded-card border border-gray-100 bg-white shadow-card">
        {isLoading ? (
          <p className="p-5 text-sm text-gray-500">Loading candidates…</p>
        ) : candidates.length === 0 ? (
          <p className="p-5 text-sm text-gray-600">
            No candidates yet.{' '}
            {exam.target_class_name
              ? `Use "Enter ${exam.target_class_name}" to enter the whole class.`
              : 'Set the class for this exam to enter its students.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Candidate no.</th>
                  <th className="px-4 py-3">Subjects</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {candidates.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2.5">
                      <p className="max-w-[200px] truncate font-medium text-gray-900">
                        {c.student_name}
                      </p>
                      <p className="font-mono text-xs text-gray-400">{c.student_no}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        defaultValue={c.candidate_number}
                        disabled={!canEdit}
                        maxLength={40}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          if (value !== c.candidate_number)
                            updateCandidate.mutate({
                              id: c.id,
                              changes: { candidate_number: value },
                            });
                        }}
                        placeholder="e.g. 4251234001"
                        className="w-36 rounded-control border border-gray-200 px-2 py-1 font-mono text-xs"
                        aria-label={`Candidate number for ${c.student_name}`}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-gray-600" title={c.subjects.join(', ')}>
                      {c.subjects.length}
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={c.status}
                        disabled={!canEdit}
                        onChange={(e) =>
                          updateCandidate.mutate({ id: c.id, changes: { status: e.target.value } })
                        }
                        className="rounded-control border border-gray-200 bg-white px-2 py-1 text-xs"
                        aria-label={`Status for ${c.student_name}`}
                      >
                        {Object.entries(STATUS_TEXT).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">
                      <ResultCell candidate={c} scoreExam={scoreExam} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ImportResultsModal
        examId={exam.id}
        isOpen={importing}
        onClose={() => setImporting(false)}
        onDone={refresh}
      />
    </div>
  );
}

function ResultCell({ candidate, scoreExam }: { candidate: Candidate; scoreExam: boolean }) {
  const s = candidate.summary;
  if (!s || Object.keys(candidate.results).length === 0)
    return <span className="text-gray-400">–</span>;
  if (scoreExam) return <span className="font-semibold text-gray-900">{s.score ?? '–'}</span>;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span
        className={`rounded-full px-2 py-0.5 font-semibold ${
          s.five_credits_with_english_maths
            ? 'bg-success-50 text-success-700'
            : 'bg-warning-50 text-warning-800'
        }`}
      >
        {s.credits} credit{s.credits === 1 ? '' : 's'}
      </span>
      {!s.english_credit && <span className="text-danger-700">no English credit</span>}
      {!s.maths_credit && <span className="text-danger-700">no Maths credit</span>}
    </span>
  );
}

/** Paste rows from the result sheet: candidate (or admission) number, subject, grade. */
function ImportResultsModal({
  examId,
  isOpen,
  onClose,
  onDone,
}: {
  examId: number;
  isOpen: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const { addToast } = useToast();
  const [text, setText] = useState('');
  const parsed = text
    .split(/\r?\n/)
    .map((line) => line.split(/\t|,|;/).map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 3 && cells[0] && cells[1] && cells[2])
    .map(([candidate, subject, grade]) => ({ candidate, subject, grade }));
  const save = useMutation({
    mutationFn: async () =>
      (await apiClient.post(`academic/external-exams/${examId}/import-results/`, { rows: parsed }))
        .data,
    onSuccess: (data: { updated: number; unknown_candidates: string[] }) => {
      onDone();
      addToast(
        `Results saved for ${data.updated} candidate${data.updated === 1 ? '' : 's'}` +
          (data.unknown_candidates.length
            ? `. Not found: ${data.unknown_candidates.slice(0, 5).join(', ')}`
            : ''),
        data.unknown_candidates.length ? 'warning' : 'success'
      );
      setText('');
      onClose();
    },
    onError: (error) => addToast(detailOf(error, 'Could not import the results.'), 'error'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import results" size="lg">
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Paste one result per line: <strong>candidate number</strong> (or admission number),{' '}
          <strong>subject</strong>, <strong>grade</strong>, separated by commas or tabs (copying
          three columns from a spreadsheet works). For JAMB, put the score in place of the grade.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={'4251234001, English Language, B3\n4251234001, Mathematics, C4'}
          className="w-full rounded-control border border-gray-200 p-3 font-mono text-xs"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500">{parsed.length} results ready</span>
          <button
            type="button"
            disabled={parsed.length === 0 || save.isPending}
            onClick={() => save.mutate()}
            className="inline-flex items-center gap-2 rounded-control bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {save.isPending && <Loader2 size={16} className="animate-spin" />} Save results
          </button>
        </div>
      </div>
    </Modal>
  );
}

function MyExamResults() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['external-exams', 'mine'],
    queryFn: async () =>
      rows<Candidate>((await apiClient.get('academic/external-exam-candidates/')).data),
  });
  const { data: exams = [] } = useQuery({
    queryKey: ['external-exams'],
    queryFn: async () => rows<Exam>((await apiClient.get('academic/external-exams/')).data),
  });
  const examFor = (id: number) => exams.find((e) => e.id === id);

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        eyebrow="Academics"
        title="External exam results"
        description="WAEC, NECO, BECE and JAMB entries and results, once the school releases them."
      />
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : data.length === 0 ? (
        <EmptyState icon={Award} title="No external exam entries yet" />
      ) : (
        <ul className="space-y-4">
          {data.map((c) => {
            const exam = examFor(c.exam);
            const results = Object.entries(c.results);
            return (
              <li
                key={c.id}
                className="rounded-card border border-gray-100 bg-white p-5 shadow-card"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-brand-600">
                  {exam ? `${exam.body_label} · ${exam.year}` : 'External exam'}
                </p>
                <h2 className="font-bold text-gray-900">{exam?.name ?? ''}</h2>
                <p className="text-sm text-gray-500">
                  {c.student_name}
                  {c.candidate_number ? ` · Candidate no. ${c.candidate_number}` : ''} ·{' '}
                  {STATUS_TEXT[c.status] ?? c.status}
                </p>
                {results.length > 0 ? (
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {results.map(([subject, grade]) => (
                      <li
                        key={subject}
                        className="flex items-center justify-between rounded-control bg-gray-50 px-3 py-2 text-sm"
                      >
                        <span className="truncate text-gray-700">{subject}</span>
                        <span className="font-bold text-gray-900">{grade}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">
                    Results will appear here when the school releases them.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
