'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Inbox, Loader2, Mail, Phone, Reply, Trash2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/providers/toast-provider';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface Enquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  created_at: string;
}

const ENDPOINT = 'schools/website-enquiries/';
export const ENQUIRY_KEY = ['website-enquiries'] as const;
const FILTERS = [
  { key: 'open', label: 'Inbox' },
  { key: 'new', label: 'New' },
  { key: 'replied', label: 'Replied' },
  { key: 'archived', label: 'Archived' },
] as const;
const STATUS_STYLE: Record<Enquiry['status'], string> = {
  new: 'bg-brand-600 text-white',
  read: 'bg-gray-100 text-gray-700',
  replied: 'bg-success-50 text-success-700',
  archived: 'bg-gray-100 text-gray-500',
};

/** Number of unread website enquiries, for the CMS navigation badge. */
export function useNewEnquiryCount() {
  return useQuery({
    queryKey: [...ENQUIRY_KEY, 'summary'],
    queryFn: async () => (await apiClient.get<{ new: number }>(`${ENDPOINT}summary/`)).data.new,
    staleTime: 60_000,
  });
}

const when = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export function CmsEnquiriesTab() {
  const { addToast } = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('open');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: [...ENQUIRY_KEY, filter, page],
    queryFn: async () =>
      (
        await apiClient.get<{ results: Enquiry[]; count: number; next: string | null }>(ENDPOINT, {
          params: { status: filter, page, page_size: 20 },
        })
      ).data,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ENQUIRY_KEY });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: Enquiry['status'] }) =>
      apiClient.patch(`${ENDPOINT}${id}/`, { status }),
    onSuccess: refresh,
    onError: () => addToast('Could not update the message.', 'error'),
  });
  const remove = useMutation({
    mutationFn: async (id: number) => apiClient.delete(`${ENDPOINT}${id}/`),
    onSuccess: () => {
      refresh();
      addToast('Message deleted', 'success');
    },
    onError: () => addToast('Could not delete the message.', 'error'),
  });

  const rows = data?.results ?? [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="mb-2 flex items-center gap-2 text-xl font-black text-gray-900">
          <Inbox className="text-brand-600" size={24} />
          Website Enquiries
        </h2>
        <p className="text-sm text-gray-500">
          Messages sent through your website&apos;s contact form. Each one is also emailed to your
          school email address.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              setFilter(f.key);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === f.key ? 'bg-brand-600 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-600" size={32} />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
          <Inbox className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="font-bold text-gray-900">No messages here</p>
          <p className="text-sm text-gray-500">New enquiries from your website will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((e) => (
            <li
              key={e.id}
              className={`rounded-2xl border bg-white p-5 ${e.status === 'new' ? 'border-brand-200 shadow-card' : 'border-gray-100'}`}
              onMouseEnter={() =>
                e.status === 'new' && setStatus.mutate({ id: e.id, status: 'read' })
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900">
                    {e.name}{' '}
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[e.status]}`}
                    >
                      {e.status}
                    </span>
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <a
                      href={`mailto:${e.email}`}
                      className="flex items-center gap-1 hover:text-brand-700"
                    >
                      <Mail size={14} /> {e.email}
                    </a>
                    {e.phone && (
                      <a
                        href={`tel:${e.phone.replace(/\s/g, '')}`}
                        className="flex items-center gap-1 hover:text-brand-700"
                      >
                        <Phone size={14} /> {e.phone}
                      </a>
                    )}
                    <span>{when.format(new Date(e.created_at))}</span>
                  </p>
                </div>
                <div className="flex gap-1">
                  <a
                    href={`mailto:${e.email}?subject=${encodeURIComponent(`Re: ${e.subject || 'Your enquiry'}`)}`}
                    onClick={() => setStatus.mutate({ id: e.id, status: 'replied' })}
                    className="flex items-center gap-1 rounded-control bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100"
                  >
                    <Reply size={14} /> Reply
                  </a>
                  {e.status !== 'archived' && (
                    <button
                      type="button"
                      aria-label="Archive"
                      title="Archive"
                      onClick={() => setStatus.mutate({ id: e.id, status: 'archived' })}
                      className="rounded-control p-1.5 text-gray-500 hover:bg-gray-100"
                    >
                      <Archive size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Delete"
                    title="Delete"
                    onClick={async () => {
                      if (
                        await confirm({
                          title: `Delete the message from ${e.name}?`,
                          tone: 'danger',
                          confirmLabel: 'Delete',
                        })
                      )
                        remove.mutate(e.id);
                    }}
                    className="rounded-control p-1.5 text-gray-500 hover:bg-danger-50 hover:text-danger-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {e.subject && <p className="mt-3 text-sm font-semibold text-gray-800">{e.subject}</p>}
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">
                {e.message}
              </p>
            </li>
          ))}
        </ul>
      )}

      {data && (data.next || page > 1) && (
        <div className="flex justify-center gap-3">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="rounded-control border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!data.next}
            onClick={() => setPage(page + 1)}
            className="rounded-control border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
