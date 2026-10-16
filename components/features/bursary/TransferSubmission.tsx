'use client';

import React, { useState } from 'react';
import { Banknote, Copy, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/components/providers/toast-provider';
import { usePublicPaymentOptions } from '@/lib/hooks/use-data';
import { useSubmitTransfer, useTransfers } from '@/lib/hooks/use-transfers';
import * as Utils from '@/lib/utils';
import type { Student } from '@/lib/types';

const MAX_PROOF_MB = 5;

const STATUS_LABEL: Record<string, string> = {
  pending: 'Awaiting check',
  completed: 'Confirmed',
  failed: 'Not confirmed',
};

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/** Parents and students report a bank transfer with proof; the bursar confirms it. */
export function TransferSubmission({ student }: { student: Student }) {
  const { addToast } = useToast();
  const { data: options } = usePublicPaymentOptions();
  const { data: transfers } = useTransfers({ student: student.id });
  const submit = useSubmitTransfer();

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [narration, setNarration] = useState('');
  const [proof, setProof] = useState<{ name: string; data: string } | null>(null);

  const bankReady = Boolean(options?.enable_bank_transfer && options?.bank_account_number);
  const proofRequired = options?.require_transfer_proof !== false;

  const reset = () => {
    setAmount('');
    setNarration('');
    setProof(null);
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('Upload a photo or screenshot of the receipt (JPG or PNG).', 'error');
      return;
    }
    if (file.size > MAX_PROOF_MB * 1024 * 1024) {
      addToast(`The image must be smaller than ${MAX_PROOF_MB}MB.`, 'error');
      return;
    }
    setProof({ name: file.name, data: await readAsDataUrl(file) });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (proofRequired && !proof) {
      addToast('Attach a photo or screenshot of the transfer receipt.', 'error');
      return;
    }
    try {
      await submit.mutateAsync({
        student: student.id,
        amount: Number(amount),
        date,
        narration,
        proof: proof?.data,
      });
      addToast('Transfer sent for confirmation. The school will check it shortly.', 'success');
      setOpen(false);
      reset();
    } catch (err) {
      const data = (err as { response?: { data?: Record<string, string> } }).response?.data;
      addToast(
        (data && (data.amount || data.proof || data.student || data.error)) ||
          'Could not send the transfer.',
        'error'
      );
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast('Copied', 'success');
    } catch {
      /* clipboard not available */
    }
  };

  const history = transfers?.results ?? [];

  return (
    <section className="rounded-card border border-gray-200 bg-white shadow-card print:hidden">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Pay by bank transfer</h2>
          <p className="text-sm text-gray-500">
            Transfer to the school&apos;s account, then send the receipt so the bursar can confirm
            it.
          </p>
        </div>
        {bankReady && (
          <Button onClick={() => setOpen(true)}>
            <Banknote className="mr-1.5 h-4 w-4" /> I&apos;ve made a transfer
          </Button>
        )}
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-2">
        {bankReady ? (
          <dl className="space-y-2 rounded-control bg-gray-50 p-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Bank</dt>
              <dd className="font-medium text-gray-900">{options?.bank_name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Account name</dt>
              <dd className="font-medium text-gray-900">{options?.bank_account_name}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-500">Account number</dt>
              <dd className="flex items-center gap-2 font-mono text-base font-semibold text-gray-900">
                {options?.bank_account_number}
                <button
                  type="button"
                  onClick={() => copy(String(options?.bank_account_number))}
                  className="rounded p-1 text-gray-500 hover:bg-gray-200"
                  aria-label="Copy account number"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </dd>
            </div>
            <p className="pt-1 text-xs text-gray-600">
              Use <span className="font-semibold">{student.names}</span> and{' '}
              <span className="font-semibold">{student.student_no}</span> as the transfer narration.
              {options?.transfer_instructions ? ` ${options.transfer_instructions}` : ''}
            </p>
          </dl>
        ) : (
          <p className="text-sm text-gray-500">
            The school hasn&apos;t added its bank details yet. Please contact the school office to
            pay.
          </p>
        )}

        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Your transfers</h3>
          {history.length === 0 ? (
            <p className="text-sm text-gray-500">No transfers reported yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {history.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {Utils.formatCurrency(Number(t.amount))}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(t.date).toLocaleDateString('en-NG')} · {t.term}
                    </p>
                    {t.status === 'failed' && t.review_note && (
                      <p className="mt-1 text-xs text-danger-700">{t.review_note}</p>
                    )}
                  </div>
                  <StatusBadge status={t.status}>{STATUS_LABEL[t.status] || t.status}</StatusBadge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Report a bank transfer" size="sm">
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Amount transferred (₦)
            </span>
            <input
              type="number"
              min="1"
              step="0.01"
              required
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10 w-full rounded-control border border-gray-300 px-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Date of transfer</span>
            <input
              type="date"
              required
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 w-full rounded-control border border-gray-300 px-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Narration or sender name (optional)
            </span>
            <input
              type="text"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="What you wrote on the transfer"
              className="h-10 w-full rounded-control border border-gray-300 px-3 text-sm"
            />
          </label>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-control border border-dashed border-gray-300 px-4 py-5 text-center hover:bg-gray-50">
            <Upload className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-700">
              {proof ? proof.name : 'Upload receipt screenshot or photo'}
            </span>
            <span className="text-xs text-gray-500">
              JPG or PNG, up to {MAX_PROOF_MB}MB{proofRequired ? ' · required' : ''}
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
          <Button type="submit" className="w-full" disabled={submit.isPending}>
            {submit.isPending ? 'Sending…' : 'Send for confirmation'}
          </Button>
        </form>
      </Modal>
    </section>
  );
}
