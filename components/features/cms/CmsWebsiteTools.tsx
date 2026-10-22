'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Loader2, RotateCcw, X } from 'lucide-react';
import apiClient from '@/lib/api-client';
import type { LandingSection, Settings } from '@/lib/types';
import { LandingPage } from '@/components/features/LandingPage';
import { Modal } from '@/components/ui/modal';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/providers/toast-provider';
import { useWebsiteMedia } from '@/lib/hooks/use-website-media';
import { queryKeys } from '@/lib/hooks/use-data';

// ------------------------------------------------------------------ setup checklist

export type CmsTabId =
  | 'branding'
  | 'hero'
  | 'about'
  | 'values'
  | 'programs'
  | 'extras'
  | 'media'
  | 'appearance'
  | 'sections'
  | 'enquiries';

interface CheckItem {
  label: string;
  done: boolean;
  tab: CmsTabId;
}

/** What a parent expects from a school website, in priority order. */
export function WebsiteChecklist({
  settings,
  onOpen,
}: {
  settings: Settings;
  onOpen: (tab: CmsTabId) => void;
}) {
  const { data: media } = useWebsiteMedia();
  const photos = media?.results.filter((m) => m.show_in_gallery).length ?? 0;
  const items: CheckItem[] = [
    { label: 'Upload your school logo', done: Boolean(settings.logo_media), tab: 'branding' },
    {
      label: 'Add contact phone, email and address',
      done: Boolean(settings.school_phone && settings.school_email && settings.school_address),
      tab: 'branding',
    },
    {
      label: 'Set a hero photo and headline',
      done: Boolean(settings.landing_hero_image && settings.landing_hero_title),
      tab: 'hero',
    },
    {
      label: 'Tell your story in About Us (with a photo)',
      done: Boolean(
        (settings.landing_about_text || settings.landing_about_html) &&
        settings.landing_about_primary_image
      ),
      tab: 'about',
    },
    {
      label: 'List your academic programmes',
      done: (settings.landing_academic_programs || []).length > 0,
      tab: 'programs',
    },
    { label: 'Upload at least 6 gallery photos', done: photos >= 6, tab: 'media' },
    {
      label: 'Add 3 parent testimonials',
      done: (settings.landing_testimonials || []).length >= 3,
      tab: 'extras',
    },
    {
      label: 'Answer common questions (FAQs)',
      done: (settings.landing_faqs || []).length >= 3,
      tab: 'extras',
    },
    {
      label: 'Choose your theme and colours',
      done: Boolean(settings.landing_theme?.preset),
      tab: 'appearance',
    },
  ];
  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);
  const [expanded, setExpanded] = useState(pct < 100);

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={expanded}
      >
        <span>
          <span className="block font-black text-gray-900">
            Website setup: {pct === 100 ? 'complete' : `${done} of ${items.length} done`}
          </span>
          <span className="block text-sm text-gray-500">
            {pct === 100
              ? 'Your website has everything parents look for.'
              : 'Complete these and your website will look professional and trustworthy.'}
          </span>
        </span>
        <span className="text-2xl font-black text-brand-600">{pct}%</span>
      </button>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-success-500' : 'bg-brand-600'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {expanded && (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => onOpen(item.tab)}
                className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-left text-sm hover:bg-gray-50"
              >
                {item.done ? (
                  <CheckCircle2 size={18} className="shrink-0 text-success-600" />
                ) : (
                  <Circle size={18} className="shrink-0 text-gray-300" />
                )}
                <span
                  className={item.done ? 'text-gray-500 line-through' : 'font-medium text-gray-800'}
                >
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ------------------------------------------------------------------ preview of unsaved changes

/**
 * Unsaved custom code is previewed in the admin's own browser before the server has cleaned it, so strip
 * anything executable (scripts, embeds, event handlers, javascript: links) the same way the server will.
 */
export function cleanPreviewHtml(html: string) {
  if (!html || typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  doc
    .querySelectorAll('script, style, iframe, object, embed, form, input, button, link, meta, base')
    .forEach((n) => n.remove());
  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (
        name.startsWith('on') ||
        ((name === 'href' || name === 'src') && /^(javascript|vbscript|data):/.test(value))
      ) {
        el.removeAttribute(attr.name);
      }
    }
  });
  return doc.body.firstElementChild?.innerHTML ?? '';
}

export function WebsitePreview({ settings, onClose }: { settings: Settings; onClose: () => void }) {
  const safe = useMemo<Settings>(
    () => ({
      ...settings,
      landing_sections: (settings.landing_sections || []).map((s: LandingSection) => ({
        ...s,
        html: cleanPreviewHtml(s.html),
        css: (s.css || '').replace(/</g, ''),
      })),
    }),
    [settings]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Website preview"
      className="fixed inset-0 z-[90] flex flex-col bg-gray-900/90"
    >
      <div className="flex items-center justify-between gap-3 bg-gray-900 px-4 py-3 text-white">
        <p className="text-sm">
          <span className="font-bold">Preview</span>
          <span className="ml-2 text-white/60">
            Unsaved changes are shown. Visitors see them after you publish.
          </span>
        </p>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-white/60 sm:inline">
            To check phones, publish and open your site on a phone.
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="rounded-control p-1.5 hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div
          className="mx-auto w-full max-w-[1400px] overflow-hidden rounded-xl bg-white shadow-2xl"
          // Contain the fixed site header inside the preview frame.
          style={{ transform: 'translateZ(0)' }}
        >
          <LandingPage settings={safe} />
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ version history

interface Revision {
  id: number;
  note: string;
  created_at: string;
  created_by: string;
}

const stamp = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export function WebsiteHistory({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const confirm = useConfirm();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['website-revisions'],
    queryFn: async () => (await apiClient.get<Revision[]>('schools/website-revisions/')).data,
    enabled: isOpen,
  });
  const restore = useMutation({
    mutationFn: async (id: number) => apiClient.post(`schools/website-revisions/${id}/restore/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
      queryClient.invalidateQueries({ queryKey: queryKeys.publicSettings });
      queryClient.invalidateQueries({ queryKey: ['website-revisions'] });
      addToast('Website restored to that version', 'success');
      onClose();
    },
    onError: () => addToast('Could not restore that version.', 'error'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Version history" size="md">
      <p className="mb-4 text-sm text-gray-500">
        Every time you publish, a copy of your website is saved. Restore any of the last 30
        versions. Your current version is kept, so you can undo a restore too.
      </p>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-brand-600" size={28} />
        </div>
      ) : data.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          No versions yet. They appear after you publish.
        </p>
      ) : (
        <ul className="max-h-[55vh] divide-y divide-gray-100 overflow-y-auto">
          {data.map((rev, index) => (
            <li key={rev.id} className="flex items-center justify-between gap-3 py-3">
              <span>
                <span className="block text-sm font-semibold text-gray-900">
                  {stamp.format(new Date(rev.created_at))}
                  {index === 0 && (
                    <span className="ml-2 rounded-full bg-success-50 px-2 py-0.5 text-xs text-success-700">
                      Current
                    </span>
                  )}
                </span>
                <span className="block text-xs text-gray-500">
                  {rev.note}
                  {rev.created_by && ` · ${rev.created_by}`}
                </span>
              </span>
              {index > 0 && (
                <button
                  type="button"
                  disabled={restore.isPending}
                  onClick={async () => {
                    const ok = await confirm({
                      title: 'Restore this version?',
                      description:
                        'Your website content, sections and theme go back to how they were. Unpublished edits are lost.',
                      confirmLabel: 'Restore',
                    });
                    if (ok) restore.mutate(rev.id);
                  }}
                  className="flex items-center gap-1 rounded-control border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-brand-400"
                >
                  <RotateCcw size={14} /> Restore
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
