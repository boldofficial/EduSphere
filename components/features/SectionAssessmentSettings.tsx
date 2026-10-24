'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, SlidersHorizontal } from 'lucide-react';
import apiClient from '@/lib/api-client';
import type { PartKey } from '@/lib/assessment';
import { queryKeys } from '@/lib/hooks/use-data';
import { useToast } from '@/components/providers/toast-provider';

type Part = { label: string; max: number; enabled: boolean };
type Assessment = Record<PartKey, Part>;

export interface SectionSettings {
  id: number;
  key: string;
  name: string;
  head_title: string;
  head_name: string;
  assessment: Assessment;
  grading_scheme: number | null;
  show_position: boolean;
}

const PART_KEYS: PartKey[] = ['ca1', 'ca2', 'exam'];

const PRESETS: { label: string; value: Assessment }[] = [
  {
    label: 'CA 20 + CA 20 + Exam 60',
    value: {
      ca1: { label: 'CA 1', max: 20, enabled: true },
      ca2: { label: 'CA 2', max: 20, enabled: true },
      exam: { label: 'Exam', max: 60, enabled: true },
    },
  },
  {
    label: 'CA 40 + Exam 60',
    value: {
      ca1: { label: 'CA', max: 40, enabled: true },
      ca2: { label: 'CA 2', max: 0, enabled: false },
      exam: { label: 'Exam', max: 60, enabled: true },
    },
  },
  {
    label: 'CA 30 + Exam 70',
    value: {
      ca1: { label: 'CA', max: 30, enabled: true },
      ca2: { label: 'CA 2', max: 0, enabled: false },
      exam: { label: 'Exam', max: 70, enabled: true },
    },
  },
  {
    label: 'No scores (observations only)',
    value: {
      ca1: { label: 'CA 1', max: 0, enabled: false },
      ca2: { label: 'CA 2', max: 0, enabled: false },
      exam: { label: 'Exam', max: 0, enabled: false },
    },
  },
];

function scaleLabel(key: string) {
  return key === 'senior'
    ? 'Built-in WAEC scale (A1, B2 … F9)'
    : 'Built-in scale (A 70+, B 60+, C 50+, D 45+, E 40+, F)';
}

function SectionCard({
  section,
  schemes,
}: {
  section: SectionSettings;
  schemes: { id: number; name: string }[];
}) {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<SectionSettings>(section);
  const enabled = PART_KEYS.filter((k) => draft.assessment[k].enabled);
  const total = enabled.reduce((sum, k) => sum + (Number(draft.assessment[k].max) || 0), 0);
  const valid = enabled.length === 0 || total === 100;
  const dirty = JSON.stringify(draft) !== JSON.stringify(section);

  const save = useMutation({
    mutationFn: async () =>
      (
        await apiClient.patch(`academic/school-structure/sections/${section.id}/`, {
          assessment: draft.assessment,
          grading_scheme: draft.grading_scheme,
          show_position: draft.show_position,
          head_name: draft.head_name,
          name: draft.name,
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-structure'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.classes });
      addToast(`${draft.name} settings saved`, 'success');
    },
    onError: (error: unknown) => {
      const detail = (error as { response?: { data?: { detail?: string } } }).response?.data
        ?.detail;
      addToast(detail || 'Could not save these settings.', 'error');
    },
  });

  const setPart = (key: PartKey, changes: Partial<Part>) =>
    setDraft((d) => ({
      ...d,
      assessment: { ...d.assessment, [key]: { ...d.assessment[key], ...changes } },
    }));

  return (
    <div className="space-y-4 rounded-card border border-gray-100 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-[220px] flex-1 space-y-1">
          <span className="text-xs font-semibold text-gray-500">
            Section name (shown on report cards)
          </span>
          <input
            value={draft.name}
            maxLength={120}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full rounded-control border border-gray-200 px-3 py-2 text-sm font-semibold"
          />
        </label>
        <label className="block min-w-[200px] space-y-1">
          <span className="text-xs font-semibold text-gray-500">{draft.head_title || 'Head'}</span>
          <input
            value={draft.head_name}
            maxLength={120}
            onChange={(e) => setDraft({ ...draft, head_name: e.target.value })}
            className="w-full rounded-control border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-gray-700">Score parts</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setDraft({ ...draft, assessment: preset.value })}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-brand-400"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {PART_KEYS.map((key) => {
            const part = draft.assessment[key];
            return (
              <div
                key={key}
                className={`rounded-control border p-3 ${part.enabled ? 'border-gray-200' : 'border-dashed border-gray-200 opacity-60'}`}
              >
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-600">
                  <input
                    type="checkbox"
                    checked={part.enabled}
                    onChange={(e) =>
                      setPart(key, { enabled: e.target.checked, max: e.target.checked ? 20 : 0 })
                    }
                    className="h-4 w-4 accent-brand-600"
                  />
                  Use this part
                </label>
                <div className="flex gap-2">
                  <input
                    value={part.label}
                    maxLength={20}
                    disabled={!part.enabled}
                    aria-label="Part name"
                    onChange={(e) => setPart(key, { label: e.target.value })}
                    className="min-w-0 flex-1 rounded-control border border-gray-200 px-2 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={part.enabled ? part.max : ''}
                    disabled={!part.enabled}
                    aria-label="Maximum mark"
                    onChange={(e) => setPart(key, { max: Number(e.target.value) })}
                    className="w-16 rounded-control border border-gray-200 px-2 py-1.5 text-center text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p
          className={`mt-2 text-xs font-semibold ${valid ? 'text-success-700' : 'text-danger-600'}`}
        >
          {enabled.length === 0
            ? 'No scores: pupils are assessed with observations and ratings only.'
            : `Total: ${total} / 100${valid ? '' : ' (parts must add up to 100)'}`}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-semibold text-gray-700">Grading scale</span>
          <select
            value={draft.grading_scheme ?? ''}
            onChange={(e) =>
              setDraft({
                ...draft,
                grading_scheme: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="w-full rounded-control border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">{scaleLabel(section.key)}</option>
            {schemes.map((scheme) => (
              <option key={scheme.id} value={scheme.id}>
                {scheme.name}
              </option>
            ))}
          </select>
          <span className="block text-xs text-gray-500">
            Make your own scale in{' '}
            <Link href="/grading" className="font-semibold text-brand-700 hover:underline">
              Grading → Schemes
            </Link>
            .
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-control border border-gray-200 p-3">
          <input
            type="checkbox"
            checked={draft.show_position}
            onChange={(e) => setDraft({ ...draft, show_position: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-brand-600"
          />
          <span>
            <span className="block text-sm font-semibold text-gray-900">
              Show class position on report cards
            </span>
            <span className="block text-xs text-gray-500">
              Turn off if your school doesn&apos;t rank pupils.
            </span>
          </span>
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!dirty || !valid || save.isPending}
          onClick={() => save.mutate()}
          className="flex items-center gap-2 rounded-control bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {save.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Save {section.name}
        </button>
      </div>
    </div>
  );
}

/** Assessment and grading for each section: score parts, grading scale, positions, head. */
export function SectionAssessmentSettings({ sections }: { sections: SectionSettings[] }) {
  const { data: schemes = [] } = useQuery({
    queryKey: ['grading-schemes'],
    queryFn: async () => {
      const res = await apiClient.get('academic/grading-schemes/');
      return (res.data?.results ?? res.data ?? []) as { id: number; name: string }[];
    },
  });

  if (sections.length === 0) return null;
  return (
    <section className="space-y-3">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <SlidersHorizontal size={20} className="text-brand-600" /> Assessment &amp; grading
        </h2>
        <p className="text-sm text-gray-500">
          How each section scores pupils. Score entry, report cards and grades follow these
          settings.
        </p>
      </div>
      {sections.map((section) => (
        <SectionCard
          key={`${section.id}-${JSON.stringify(section)}`}
          section={section}
          schemes={schemes}
        />
      ))}
    </section>
  );
}
