'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Download, KeyRound, Loader2, Printer } from 'lucide-react';
import apiClient from '@/lib/api-client';
import type { Class } from '@/lib/types';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/providers/toast-provider';

export interface LoginSlip {
  student_no: string;
  names: string;
  class_name: string;
  password: string;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}

/** Print-ready slips (8 per A4 page): what each student needs for their first sign-in. */
export function printLoginSlips(slips: LoginSlip[], schoolName: string) {
  const loginUrl = `${window.location.origin}/login`;
  const cards = slips
    .map(
      (s) => `<div class="slip">
  <div class="school">${escapeHtml(schoolName)}</div>
  <div class="name">${escapeHtml(s.names)}</div>
  <div class="class">${escapeHtml(s.class_name || '')}</div>
  <table>
    <tr><td>Sign in at</td><td>${escapeHtml(loginUrl)} (Student tab)</td></tr>
    <tr><td>Admission No</td><td class="mono">${escapeHtml(s.student_no)}</td></tr>
    <tr><td>Password</td><td class="mono">${escapeHtml(s.password)}</td></tr>
  </table>
  <div class="note">You will be asked to choose your own password the first time you sign in.</div>
</div>`
    )
    .join('');
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return false;
  win.document
    .write(`<!doctype html><html><head><meta charset="utf-8"><title>Student login slips</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;margin:16px;color:#111}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .slip{border:1px dashed #999;border-radius:8px;padding:12px;break-inside:avoid;font-size:12px}
  .school{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#555}
  .name{font-size:15px;font-weight:bold;margin-top:4px}.class{color:#555;margin-bottom:6px}
  table{border-collapse:collapse;width:100%}td{padding:2px 0;vertical-align:top}td:first-child{color:#555;width:92px}
  .mono{font-family:Consolas,Menlo,monospace;font-size:14px;font-weight:bold}
  .note{margin-top:6px;font-size:10px;color:#666}
  @media print{body{margin:8mm}}
</style></head><body><div class="grid">${cards}</div>
<script>window.onload=function(){window.print()}</script></body></html>`);
  win.document.close();
  return true;
}

export function downloadSlipsCsv(slips: LoginSlip[], filename = 'student_logins.csv') {
  const cell = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    ['Admission No (username)', 'Student', 'Class', 'Temporary password'],
    ...slips.map((s) => [s.student_no, s.names, s.class_name, s.password]),
  ].map((row) => row.map(cell).join(','));
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function SlipsActions({ slips, schoolName }: { slips: LoginSlip[]; schoolName: string }) {
  const { addToast } = useToast();
  if (!slips.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => {
          if (!printLoginSlips(slips, schoolName))
            addToast('Allow pop-ups for this site to print the slips.', 'warning');
        }}
        className="inline-flex items-center gap-2 rounded-control bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
      >
        <Printer size={16} /> Print login slips
      </button>
      <button
        type="button"
        onClick={() => downloadSlipsCsv(slips)}
        className="inline-flex items-center gap-2 rounded-control border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <Download size={16} /> Download (CSV)
      </button>
    </div>
  );
}

/** One student: new temporary password, shown once. */
export function useResetStudentPassword() {
  return useMutation({
    mutationFn: async (studentId: string | number) =>
      (await apiClient.post<LoginSlip>(`academic/students/${studentId}/reset-password/`)).data,
  });
}

function errorText(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || fallback
  );
}

export function ResetPasswordResult({
  slip,
  schoolName,
  onClose,
}: {
  slip: LoginSlip | null;
  schoolName: string;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={!!slip} onClose={onClose} title="New temporary password" size="sm">
      {slip && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Give these details to <strong>{slip.names}</strong>. The password is shown only now;
            they will choose their own when they next sign in.
          </p>
          <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 rounded-control bg-gray-50 p-4 text-sm">
            <dt className="text-gray-500">Admission No</dt>
            <dd className="font-mono font-bold text-gray-900">{slip.student_no}</dd>
            <dt className="text-gray-500">Password</dt>
            <dd className="font-mono text-lg font-bold text-gray-900">{slip.password}</dd>
          </dl>
          <SlipsActions slips={[slip]} schoolName={schoolName} />
        </div>
      )}
    </Modal>
  );
}

/** Give every student in a class a sign-in account (default: only those who don't have one). */
export function IssueLoginsModal({
  isOpen,
  onClose,
  classes,
  schoolName,
}: {
  isOpen: boolean;
  onClose: () => void;
  classes: Class[];
  schoolName: string;
}) {
  const { addToast } = useToast();
  const [classId, setClassId] = useState('');
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [slips, setSlips] = useState<LoginSlip[] | null>(null);
  const issue = useMutation({
    mutationFn: async () =>
      (
        await apiClient.post<{ count: number; slips: LoginSlip[] }>(
          'academic/students/issue-logins/',
          { class_id: classId, only_missing: onlyMissing }
        )
      ).data,
    onSuccess: (data) => setSlips(data.slips),
    onError: (error) => addToast(errorText(error, 'Could not issue logins.'), 'error'),
  });

  const close = () => {
    setSlips(null);
    setClassId('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Student logins for a class" size="md">
      {slips === null ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Students sign in with their admission number and a password. This creates accounts with
            temporary passwords and gives you slips to print.
          </p>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-gray-700">Class</span>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full rounded-control border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Choose a class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={onlyMissing}
              onChange={(e) => setOnlyMissing(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-brand-600"
            />
            <span>
              Only students without an account
              <span className="block text-xs text-gray-500">
                Untick to give every student in the class a new temporary password.
              </span>
            </span>
          </label>
          <button
            type="button"
            disabled={!classId || issue.isPending}
            onClick={() => issue.mutate()}
            className="inline-flex items-center gap-2 rounded-control bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {issue.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <KeyRound size={16} />
            )}
            Create logins
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {slips.length
              ? `${slips.length} login${slips.length === 1 ? '' : 's'} ready. Print or download them now: the passwords are not shown again.`
              : 'Every student in this class already has an account.'}
          </p>
          <SlipsActions slips={slips} schoolName={schoolName} />
        </div>
      )}
    </Modal>
  );
}
