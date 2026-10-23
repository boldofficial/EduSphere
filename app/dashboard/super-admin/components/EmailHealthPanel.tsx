'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Loader2, Send } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/providers/toast-provider';

interface EmailStatus {
  configured: boolean;
  problem: string;
  provider: string;
  from: string;
  smtp_host: string;
  last_24h: { sent: number; failed: number };
  recent_failures: { recipient: string; subject: string; error: string; at: string }[];
}

const when = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

/** Is email actually working? Shows the live configuration, recent failures and a test-send. */
export function EmailHealthPanel() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [recipient, setRecipient] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['email-status'],
    queryFn: async () => (await apiClient.get<EmailStatus>('emails/status/')).data,
  });
  const test = useMutation({
    mutationFn: async () =>
      (await apiClient.post<{ detail: string }>('emails/status/', { recipient })).data,
    onSuccess: (result) => addToast(result.detail, 'success'),
    onError: (error: unknown) => {
      const detail = (error as { response?: { data?: { detail?: string } } }).response?.data
        ?.detail;
      addToast(detail || 'Test email failed.', 'error');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['email-status'] }),
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="animate-spin text-brand-600" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-5">
      <div className="flex items-start gap-3">
        {data.configured ? (
          <CheckCircle2 className="mt-0.5 shrink-0 text-success-600" size={20} />
        ) : (
          <AlertTriangle className="mt-0.5 shrink-0 text-warning-600" size={20} />
        )}
        <div className="text-sm">
          <p className="font-bold text-gray-900">
            {data.configured ? `Email is set up (${data.provider})` : 'Email is not set up'}
          </p>
          <p className="text-gray-600">
            {data.configured
              ? `Sending as ${data.from}${data.smtp_host ? ` through ${data.smtp_host}` : ''}.`
              : data.problem}
          </p>
          <p className="mt-1 text-gray-500">
            Last 24 hours: {data.last_24h.sent} sent, {data.last_24h.failed} failed.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Send a test to (defaults to your email)"
          className="flex-1 rounded-control border border-gray-200 bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => test.mutate()}
          disabled={test.isPending}
          className="flex items-center justify-center gap-2 rounded-control bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {test.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Send test email
        </button>
      </div>
      <p className="text-xs text-gray-500">Save any changes above before sending a test.</p>

      {data.recent_failures.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-gray-700">
            Recent failures ({data.recent_failures.length})
          </summary>
          <ul className="mt-2 space-y-2">
            {data.recent_failures.map((f, i) => (
              <li key={i} className="rounded-control bg-white p-3 text-xs">
                <p className="font-semibold text-gray-900">
                  {f.subject || '(no subject)'} → {f.recipient}
                </p>
                <p className="text-gray-500">{when.format(new Date(f.at))}</p>
                <p className="mt-1 break-words text-danger-700">{f.error}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
