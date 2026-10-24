'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Upload,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { queryKeys, useSettings } from '@/lib/hooks/use-data';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/components/providers/toast-provider';
import { type LoginSlip, SlipsActions } from './StudentLogins';

type Action = 'create' | 'update' | 'skip' | 'error';

interface PreviewRow {
  row: number;
  action: Action;
  student_no: string;
  names: string;
  class_name: string;
  errors: string[];
  warnings: string[];
}

interface Preview {
  rows: PreviewRow[];
  summary: {
    total: number;
    create: number;
    update: number;
    skip: number;
    errors: number;
    plan_room: number | null;
    over_limit: boolean;
  };
}

interface JobResult {
  status: string;
  created: number;
  updated: number;
  error_count: number;
  errors: { row: number; error: string }[];
  credentials_available: boolean;
}

const BASE = 'academic/data-migration';
const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

function detailOf(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || fallback
  );
}

const ACTION_STYLE: Record<Action, string> = {
  create: 'bg-success-50 text-success-700',
  update: 'bg-info-50 text-info-700',
  skip: 'bg-gray-100 text-gray-600',
  error: 'bg-danger-50 text-danger-700',
};
const ACTION_LABEL: Record<Action, string> = {
  create: 'New',
  update: 'Update',
  skip: 'Skip',
  error: 'Problem',
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell || row.length) rows.push([...row, cell]);
  return rows.filter((r) => r.some((c) => c.trim()));
}

/** Import students from Excel/CSV: check every row first, then create accounts and print login slips. */
export function StudentImportWizard() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings } = useSettings();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [autoNumber, setAutoNumber] = useState(true);
  const [prefix, setPrefix] = useState('');
  const [updateExisting, setUpdateExisting] = useState(true);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [busy, setBusy] = useState<'' | 'checking' | 'importing'>('');
  const [result, setResult] = useState<JobResult | null>(null);
  const [slips, setSlips] = useState<LoginSlip[]>([]);

  const form = () => {
    const data = new FormData();
    if (file) data.append('file', file);
    data.append('auto_number', String(autoNumber));
    data.append('number_prefix', prefix);
    data.append('update_existing', String(updateExisting));
    return data;
  };

  const downloadTemplate = async () => {
    try {
      const res = await apiClient.get('academic/data-migration/student-template/', {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'student_import_template.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      addToast('Could not download the template.', 'error');
    }
  };

  const check = async () => {
    if (!file) return;
    setBusy('checking');
    try {
      const body = (
        await apiClient.post<Preview>(`${BASE}/import-students/preview/`, form(), MULTIPART)
      ).data;
      setPreview(body);
      setOnlyProblems(body.summary.errors > 0);
    } catch (error) {
      addToast(detailOf(error, 'Something went wrong. Please try again.'), 'error');
    } finally {
      setBusy('');
    }
  };

  const runImport = async () => {
    setBusy('importing');
    try {
      const queued = (
        await apiClient.post<JobResult & { job_id: number }>(
          `${BASE}/import-students/`,
          form(),
          MULTIPART
        )
      ).data;
      let job: JobResult = { ...queued, created: 0, updated: 0, error_count: 0, errors: [] };
      for (let i = 0; i < 600 && !['completed', 'failed'].includes(job.status); i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        job = (await apiClient.get(`academic/data-migration/jobs/${queued.job_id}/`)).data;
      }
      setResult(job);
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      if (job.credentials_available) {
        const csv = await apiClient.get(
          `academic/data-migration/jobs/${queued.job_id}/credentials/`,
          {
            responseType: 'text',
          }
        );
        const [, ...lines] = parseCsv(String(csv.data));
        setSlips(
          lines.map(([student_no, names, class_name, password]) => ({
            student_no,
            names,
            class_name,
            password,
          }))
        );
      }
    } catch (error) {
      addToast(detailOf(error, 'Something went wrong. Please try again.'), 'error');
    } finally {
      setBusy('');
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setSlips([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const shown = preview
    ? preview.rows.filter((r) => !onlyProblems || r.action === 'error' || r.warnings.length)
    : [];
  const importable = preview ? preview.summary.create + preview.summary.update : 0;

  return (
    <div className="space-y-6 pb-20">
      <Link
        href="/students"
        className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} /> Students
      </Link>
      <PageHeader
        eyebrow="Students"
        title="Import students"
        description="Add or update many students at once from an Excel or CSV file. Each new student gets a login (admission number + temporary password)."
      />

      {result ? (
        <section className="space-y-5 rounded-card border border-gray-100 bg-white p-6 shadow-card">
          <div className="flex items-start gap-3">
            {result.status === 'completed' ? (
              <CheckCircle2 className="mt-0.5 shrink-0 text-success-600" size={24} />
            ) : (
              <AlertTriangle className="mt-0.5 shrink-0 text-warning-600" size={24} />
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {result.status === 'completed' ? 'Import finished' : 'Import stopped'}
              </h2>
              <p className="text-sm text-gray-600">
                {result.created} new student{result.created === 1 ? '' : 's'}, {result.updated}{' '}
                updated
                {result.error_count
                  ? `, ${result.error_count} row${result.error_count === 1 ? '' : 's'} skipped`
                  : ''}
                .
              </p>
            </div>
          </div>
          {slips.length > 0 && (
            <div className="space-y-3 rounded-control border border-brand-100 bg-brand-50/50 p-4">
              <p className="text-sm text-gray-700">
                <strong>Login slips for {slips.length} new students.</strong> Print or download them
                now; for security they are available for 24 hours only. Students choose their own
                password the first time they sign in.
              </p>
              <SlipsActions slips={slips} schoolName={settings?.school_name || 'School'} />
            </div>
          )}
          {result.errors.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Rows not imported</p>
              <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-danger-700">
                    {e.row ? `Row ${e.row}: ` : ''}
                    {e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-control border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw size={16} /> Import another file
            </button>
            <Link
              href="/students"
              className="inline-flex items-center gap-2 rounded-control bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
            >
              View students
            </Link>
          </div>
        </section>
      ) : !preview ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 rounded-card border border-gray-100 bg-white p-6 shadow-card lg:col-span-2">
            <h2 className="font-bold text-gray-900">1. Choose your file</h2>
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) setFile(dropped);
              }}
              className="flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center hover:border-brand-300"
            >
              <FileSpreadsheet className="mb-3 text-brand-600" size={36} />
              <span className="font-bold text-gray-900">
                {file ? file.name : 'Drop an Excel or CSV file here, or click to choose'}
              </span>
              <span className="mt-1 text-xs text-gray-500">
                .xlsx or .csv · up to 5,000 students
              </span>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.csv"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <div className="space-y-3 text-sm">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={autoNumber}
                  onChange={(e) => setAutoNumber(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-brand-600"
                />
                <span>
                  Give admission numbers to students who don&apos;t have one
                  {autoNumber && (
                    <span className="mt-2 flex items-center gap-2">
                      <span className="text-gray-500">Start with</span>
                      <input
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                        maxLength={20}
                        placeholder="e.g. HKS/2026/"
                        className="w-40 rounded-control border border-gray-200 px-2 py-1 font-mono text-sm"
                      />
                      <span className="font-mono text-xs text-gray-500">{prefix || ''}0001</span>
                    </span>
                  )}
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-brand-600"
                />
                <span>
                  Update students who already exist (matched by admission number)
                  <span className="block text-xs text-gray-500">
                    Only filled-in cells change; blank cells keep what&apos;s there.
                  </span>
                </span>
              </label>
            </div>
            <button
              type="button"
              disabled={!file || busy === 'checking'}
              onClick={check}
              className="inline-flex items-center gap-2 rounded-control bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy === 'checking' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              Check file
            </button>
          </div>
          <aside className="space-y-3 rounded-card border border-gray-100 bg-white p-6 text-sm shadow-card">
            <h2 className="font-bold text-gray-900">Your spreadsheet</h2>
            <p className="text-gray-600">
              One student per row, with headings in the first row. Common headings are understood
              automatically, for example:
            </p>
            <ul className="list-inside list-disc space-y-1 text-gray-600">
              <li>Admission No (optional with automatic numbers)</li>
              <li>Name, or Surname + First Name</li>
              <li>Gender (Male/Female or M/F)</li>
              <li>Class (must match a class name)</li>
              <li>Date of Birth (DD/MM/YYYY)</li>
              <li>Parent Name, Parent Email, Parent Phone, Address</li>
            </ul>
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 rounded-control border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Download size={16} /> Download template
            </button>
          </aside>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ['New', preview.summary.create, ACTION_STYLE.create],
                ['Update', preview.summary.update, ACTION_STYLE.update],
                ['Skip', preview.summary.skip, ACTION_STYLE.skip],
                ['Problems', preview.summary.errors, ACTION_STYLE.error],
              ] as [string, number, string][]
            ).map(([label, value, style]) => (
              <span key={label} className={`rounded-full px-3 py-1 text-sm font-semibold ${style}`}>
                {label}: {value}
              </span>
            ))}
            <label className="ml-auto flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={onlyProblems}
                onChange={(e) => setOnlyProblems(e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              Show only rows with problems
            </label>
          </div>

          {preview.summary.over_limit && (
            <div className="rounded-card border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800">
              Your plan has room for {preview.summary.plan_room} more students, but this file adds{' '}
              {preview.summary.create}. Only the first {preview.summary.plan_room} will be created;
              upgrade your plan to add the rest.
            </div>
          )}
          {preview.summary.errors > 0 && (
            <div className="rounded-card border border-danger-200 bg-danger-50 p-4 text-sm text-danger-800">
              Rows with problems are skipped. Fix them in your spreadsheet and import again, or
              continue with the rest.
            </div>
          )}

          <div className="overflow-hidden rounded-card border border-gray-100 bg-white shadow-card">
            <div className="max-h-[55vh] overflow-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="sticky top-0 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Row</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Admission No</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {shown.slice(0, 1000).map((r) => (
                    <tr key={r.row}>
                      <td className="px-4 py-2.5 text-gray-500">{r.row}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ACTION_STYLE[r.action]}`}
                        >
                          {ACTION_LABEL[r.action]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">{r.student_no || '-'}</td>
                      <td className="max-w-[220px] truncate px-4 py-2.5 font-medium text-gray-900">
                        {r.names || '-'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{r.class_name || '-'}</td>
                      <td className="px-4 py-2.5 text-xs">
                        {r.errors.map((e) => (
                          <span key={e} className="block text-danger-700">
                            {e}
                          </span>
                        ))}
                        {r.warnings.map((w) => (
                          <span key={w} className="block text-warning-700">
                            {w}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                  {shown.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                        No problems found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {shown.length > 1000 && (
              <p className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
                Showing the first 1,000 rows.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="rounded-control border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Change file or options
            </button>
            <button
              type="button"
              disabled={importable === 0 || busy === 'importing'}
              onClick={runImport}
              className="inline-flex items-center gap-2 rounded-control bg-brand-600 px-5 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy === 'importing' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {busy === 'importing'
                ? 'Importing…'
                : `Import ${importable} student${importable === 1 ? '' : 's'}`}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
