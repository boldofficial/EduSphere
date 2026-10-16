'use client';

import React, { useState } from 'react';
import { Check, ImageOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/providers/toast-provider';
import { useReviewTransfer, useTransfers, type TransferPayment } from '@/lib/hooks/use-transfers';
import * as Utils from '@/lib/utils';

/** Bursar's queue of parent-reported bank transfers waiting to be matched to the bank statement. */
export function TransferReviewQueue() {
  const { addToast } = useToast();
  const { data, isLoading } = useTransfers({ status: 'pending' });
  const review = useReviewTransfer();
  const [rejecting, setRejecting] = useState<TransferPayment | null>(null);
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const transfers = data?.results ?? [];

  const approve = async (t: TransferPayment) => {
    try {
      await review.mutateAsync({ id: t.id, decision: 'approve' });
      addToast(
        `Confirmed ${Utils.formatCurrency(Number(t.amount))} from ${t.student_name}`,
        'success'
      );
    } catch {
      addToast('Could not confirm this transfer', 'error');
    }
  };

  const reject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejecting) return;
    try {
      await review.mutateAsync({ id: rejecting.id, decision: 'reject', note: reason.trim() });
      addToast('Transfer marked as not confirmed; the parent will see your reason.', 'info');
      setRejecting(null);
      setReason('');
    } catch {
      addToast('Could not update this transfer', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-card" />
        ))}
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <EmptyState
        icon={Check}
        title="No transfers waiting"
        description="When parents report a bank transfer, it appears here for you to match against the bank statement."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Check each transfer against the school&apos;s bank statement before confirming. Confirmed
        transfers count towards the student&apos;s balance; unconfirmed ones don&apos;t.
      </p>
      <ul className="space-y-3">
        {transfers.map((t) => {
          const proof = t.proof_url ? Utils.getMediaUrl(t.proof_url) : '';
          return (
            <li
              key={t.id}
              className="flex flex-col gap-4 rounded-card border border-gray-200 bg-white p-4 shadow-card sm:flex-row sm:items-center"
            >
              <button
                type="button"
                onClick={() => proof && setPreview(proof)}
                disabled={!proof}
                className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-control border border-gray-200 bg-gray-50"
                aria-label={proof ? 'View receipt' : 'No receipt attached'}
              >
                {proof ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={proof} alt="Transfer receipt" className="h-full w-full object-cover" />
                ) : (
                  <ImageOff className="h-5 w-5 text-gray-400" />
                )}
              </button>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-base font-semibold text-gray-900">
                  {Utils.formatCurrency(Number(t.amount))}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    {t.student_name}
                    {t.student_class ? ` · ${t.student_class}` : ''}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Sent {new Date(t.date).toLocaleDateString('en-NG')} by {t.recorded_by}
                  {t.remark ? ` · narration “${t.remark}”` : ''}
                </p>
                <p className="text-xs text-gray-500">
                  {t.reference} · {t.term} {t.session}
                </p>
              </div>
              <div className="flex gap-2 sm:flex-col">
                <Button size="sm" onClick={() => approve(t)} disabled={review.isPending}>
                  <Check className="mr-1.5 h-4 w-4" /> Confirm
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setRejecting(t)}
                  disabled={review.isPending}
                >
                  <X className="mr-1.5 h-4 w-4" /> Not received
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <Modal
        isOpen={!!rejecting}
        onClose={() => setRejecting(null)}
        title="Transfer not received"
        size="sm"
      >
        <form onSubmit={reject} className="space-y-4">
          <p className="text-sm text-gray-600">
            Tell the parent why — they will see this message next to the transfer.
          </p>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. No matching credit on our statement for this date. Please send the bank's teller."
            className="w-full rounded-control border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={!reason.trim() || review.isPending}>
              Mark as not received
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!preview} onClose={() => setPreview(null)} title="Transfer receipt" size="lg">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Transfer receipt"
            className="mx-auto max-h-[70vh] rounded-control"
          />
        )}
      </Modal>
    </div>
  );
}
