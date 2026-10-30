'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, ClipboardCopy, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';
import { useToast } from '@/components/providers/toast-provider';

interface TermLabel {
  id: number;
  session: string;
  term: string;
}

interface TermSetup {
  term: TermLabel | null;
  fee_items: number;
  fee_source: TermLabel | null;
  fees_to_copy: {
    id: number;
    name: string;
    class_name: string;
    amount: string;
    optional: boolean;
  }[];
  previous: TermLabel | null;
  debtors: {
    student_id: string;
    names: string;
    student_no: string;
    class_name: string;
    balance: string;
  }[];
  debt_total: string;
}

const label = (t: TermLabel | null) => (t ? `${t.term} ${t.session}` : '');

function detailOf(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || fallback
  );
}

/**
 * After the school moves to a new term: copy last term's fees and carry unpaid balances into the
 * new bill. Shown on the bursary dashboard while either is still to do; nothing runs until the
 * bursar confirms it.
 */
export function TermSetupPanel() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['term-setup'],
    queryFn: async () => (await apiClient.get('bursary/term-setup/')).data as TermSetup,
  });
  const [showFees, setShowFees] = useState(false);
  const [unticked, setUnticked] = useState<Set<string>>(new Set());

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['term-setup'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.fees });
    queryClient.invalidateQueries({ queryKey: queryKeys.students });
  };

  const copyFees = useMutation({
    mutationFn: async () =>
      (await apiClient.post('bursary/term-setup/', { action: 'copy_fees' })).data as {
        created: number;
      },
    onSuccess: ({ created }) => {
      refresh();
      addToast(
        `${created} fee item${created === 1 ? '' : 's'} added to ${label(data?.term ?? null)}. Adjust any amounts under Fee structure.`,
        'success'
      );
    },
    onError: (error) => addToast(detailOf(error, 'Could not copy the fees.'), 'error'),
  });

  const carry = useMutation({
    mutationFn: async (ids: string[]) =>
      (await apiClient.post('bursary/term-setup/', { action: 'carry_forward', student_ids: ids }))
        .data as { moved: number; total: string },
    onSuccess: ({ moved, total }) => {
      refresh();
      setUnticked(new Set());
      addToast(
        `${Utils.formatCurrency(Number(total))} from ${moved} student${moved === 1 ? '' : 's'} added to this term's bills.`,
        'success'
      );
    },
    onError: (error) => addToast(detailOf(error, 'Could not carry the balances forward.'), 'error'),
  });

  if (!data?.term || (data.fees_to_copy.length === 0 && data.debtors.length === 0)) return null;

  const chosen = data.debtors.filter((d) => !unticked.has(d.student_id));
  const chosenTotal = chosen.reduce((sum, d) => sum + Number(d.balance), 0);
  const toggle = (id: string) => {
    const next = new Set(unticked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setUnticked(next);
  };

  return (
    <section className="rounded-card border border-brand-100 bg-white">
      <header className="border-b border-gray-100 px-5 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-700">New term setup</p>
        <h2 className="text-base font-bold text-gray-900">{label(data.term)}</h2>
      </header>

      {data.fees_to_copy.length > 0 && (
        <div className="space-y-3 border-b border-gray-100 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-700">
              {data.fee_items === 0 ? 'This term has no fees yet. ' : ''}
              <strong>{data.fees_to_copy.length}</strong> fee item
              {data.fees_to_copy.length === 1 ? '' : 's'} from {label(data.fee_source)}{' '}
              {data.fee_items === 0 ? 'can be copied in.' : 'are not in this term yet.'}{' '}
              <button
                type="button"
                onClick={() => setShowFees(!showFees)}
                className="font-semibold text-brand-700 hover:underline"
              >
                {showFees ? 'Hide' : 'See them'}
              </button>
            </p>
            <button
              type="button"
              onClick={() => copyFees.mutate()}
              disabled={copyFees.isPending}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-control bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {copyFees.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <ClipboardCopy size={15} />
              )}
              Copy fees
            </button>
          </div>
          {showFees && (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {data.fees_to_copy.map((fee) => (
                  <tr key={fee.id}>
                    <td className="py-1.5 pr-3 font-medium text-gray-800">
                      {fee.name}
                      {fee.optional && (
                        <span className="ml-1 text-xs text-gray-500">(optional)</span>
                      )}
                    </td>
                    <td className="py-1.5 pr-3 text-gray-600">{fee.class_name}</td>
                    <td className="py-1.5 text-right font-semibold text-gray-900">
                      {Utils.formatCurrency(Number(fee.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {data.debtors.length > 0 && (
        <div className="space-y-3 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-700">
              <strong>{data.debtors.length}</strong> student{data.debtors.length === 1 ? '' : 's'}{' '}
              still owe{data.debtors.length === 1 ? 's' : ''}{' '}
              <strong>{Utils.formatCurrency(Number(data.debt_total))}</strong> from{' '}
              {label(data.previous)}. Carry it into their {data.term.term} bill?
            </p>
            <button
              type="button"
              onClick={() => carry.mutate(chosen.map((d) => d.student_id))}
              disabled={carry.isPending || chosen.length === 0}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-control bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {carry.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <ArrowRightLeft size={15} />
              )}
              Carry forward {chosen.length} ({Utils.formatCurrency(chosenTotal)})
            </button>
          </div>
          <ul className="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-control border border-gray-100">
            {data.debtors.map((d) => (
              <li key={d.student_id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={!unticked.has(d.student_id)}
                    onChange={() => toggle(d.student_id)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-gray-900">{d.names}</span>{' '}
                    <span className="text-xs text-gray-500">
                      {d.student_no} · {d.class_name}
                    </span>
                  </span>
                  <span className="font-semibold text-gray-900">
                    {Utils.formatCurrency(Number(d.balance))}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500">
            The amount moves to this term&apos;s bill as &ldquo;Balance from {label(data.previous)}
            &rdquo;, and {data.previous?.term} is marked settled so it is not counted twice. Untick
            anyone the school has agreed to handle differently.
          </p>
        </div>
      )}
    </section>
  );
}
