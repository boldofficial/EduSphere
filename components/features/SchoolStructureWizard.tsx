'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Baby,
  BookOpen,
  Check,
  GraduationCap,
  Loader2,
  Plus,
  School,
  X,
} from 'lucide-react';
import {
  type CatalogueSection,
  type NamingStyle,
  type SectionKey,
  type SetupPlan,
  type SetupRequest,
  useApplyStructure,
  usePreviewStructure,
  useSchoolStructure,
} from '@/lib/hooks/use-school-structure';
import { useToast } from '@/components/providers/toast-provider';
import { PageHeader } from '@/components/ui/page-header';

const ICONS: Record<SectionKey, typeof School> = {
  early_years: Baby,
  primary: BookOpen,
  junior: School,
  senior: GraduationCap,
};

const ARM_PRESETS: { label: string; arms: string[] }[] = [
  { label: 'One class per level', arms: [] },
  { label: 'A, B', arms: ['A', 'B'] },
  { label: 'A, B, C', arms: ['A', 'B', 'C'] },
];

interface SectionState {
  enabled: boolean;
  levels: string[];
  arms: string[];
  armsText: string;
  subjects: string[];
  extraSubject: string;
  head_name: string;
  departments: Record<string, { enabled: boolean; subjects: string[] }>;
}

function initialState(
  section: CatalogueSection,
  enabled: boolean,
  naming: NamingStyle,
  classNames: string[]
): SectionState {
  // A school whose senior classes are plain "SSS 1" (no department) keeps that layout by default.
  const existing = new Set(classNames.map((n) => n.toLowerCase()));
  const plainSenior =
    section.key === 'senior' &&
    Object.values(section.levels)
      .flat()
      .some((level) => existing.has(level.toLowerCase()));
  const levels = section.key === 'early_years' ? section.default_levels : section.levels[naming];
  return {
    enabled,
    levels,
    arms: [],
    armsText: '',
    subjects: section.subjects.filter((s) => s.default).map((s) => s.name),
    extraSubject: '',
    head_name: '',
    departments: Object.fromEntries(
      section.departments.map((d) => [
        d.key,
        { enabled: !plainSenior, subjects: d.subjects.filter((s) => s.default).map((s) => s.name) },
      ])
    ),
  };
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function errorText(error: unknown) {
  const data = (error as { response?: { data?: { detail?: string } } }).response?.data;
  return data?.detail || 'Something went wrong. Please check your choices.';
}

/**
 * The section's classes in promotion order. Names are the school's own (e.g. Reception, Preparatory,
 * Grade 1); the catalogue names are one-click suggestions.
 */
function LevelsEditor({
  value,
  suggestions,
  onChange,
}: {
  value: string[];
  suggestions: string[];
  onChange: (levels: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const move = (index: number, delta: number) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };
  const add = (name: string) => {
    const clean = name.trim().replace(/\s+/g, ' ');
    if (!clean || value.some((v) => v.toLowerCase() === clean.toLowerCase())) return;
    onChange([...value, clean]);
  };
  const unused = suggestions.filter((sug) => !value.includes(sug));

  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-gray-700">Classes, in promotion order</p>
      <p className="mb-2 text-xs text-gray-500">
        Use your school&apos;s own names. Students move down this list each session.
      </p>
      <ol className="space-y-2">
        {value.map((level, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="w-6 text-right text-xs font-semibold text-gray-400">{index + 1}.</span>
            <input
              value={level}
              maxLength={40}
              aria-label={`Class ${index + 1} name`}
              onChange={(e) => onChange(value.map((v, i) => (i === index ? e.target.value : v)))}
              className="w-56 rounded-control border border-gray-200 px-3 py-1.5 text-sm"
            />
            <button
              type="button"
              aria-label="Move up"
              disabled={index === 0}
              onClick={() => move(index, -1)}
              className="rounded p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30"
            >
              <ArrowUp size={16} />
            </button>
            <button
              type="button"
              aria-label="Move down"
              disabled={index === value.length - 1}
              onClick={() => move(index, 1)}
              className="rounded p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30"
            >
              <ArrowDown size={16} />
            </button>
            <button
              type="button"
              aria-label={`Remove ${level}`}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="rounded p-1 text-gray-400 hover:text-danger-600"
            >
              <X size={16} />
            </button>
          </li>
        ))}
      </ol>
      <form
        className="mt-2 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add(draft);
          setDraft('');
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={40}
          placeholder="Add a class, e.g. Grade 1"
          className="w-56 rounded-control border border-gray-200 px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          className="flex items-center gap-1 rounded-control border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:border-brand-400"
        >
          <Plus size={14} /> Add
        </button>
        {unused.map((sug) => (
          <button
            key={sug}
            type="button"
            onClick={() => add(sug)}
            className="rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-xs text-gray-600 hover:border-brand-400"
          >
            + {sug}
          </button>
        ))}
      </form>
    </div>
  );
}

/** Tell us what the school runs; we create its classes, arms, subjects and promotion chain. */
export function SchoolStructureWizard() {
  const { addToast } = useToast();
  const { data, isLoading } = useSchoolStructure();
  const preview = usePreviewStructure();
  const apply = useApplyStructure();
  const [naming, setNaming] = useState<NamingStyle>('classic');
  const [state, setState] = useState<Record<string, SectionState>>({});
  const [plan, setPlan] = useState<SetupPlan | null>(null);

  // Start from what the school already has (or what its classes suggest).
  useEffect(() => {
    if (!data || Object.keys(state).length) return;
    const active = new Set<string>(
      data.sections.length ? data.sections.map((s) => s.key) : data.suggested_sections
    );
    setState(
      Object.fromEntries(
        data.catalogue.map((section) => [
          section.key,
          initialState(section, active.has(section.key), naming, data.class_names),
        ])
      )
    );
  }, [data, state, naming]);

  const catalogue = data?.catalogue ?? [];
  const chosen = catalogue.filter((s) => state[s.key]?.enabled);
  const existingKeys = useMemo(() => new Set(data?.sections.map((s) => s.key)), [data]);

  const update = (key: string, changes: Partial<SectionState>) => {
    setPlan(null);
    setState((prev) => ({ ...prev, [key]: { ...prev[key], ...changes } }));
  };

  const changeNaming = (value: NamingStyle) => {
    setPlan(null);
    setNaming(value);
    // Level names differ between styles; reset the level choice for sections that depend on it.
    setState((prev) =>
      Object.fromEntries(
        catalogue.map((section) => [
          section.key,
          section.key === 'early_years'
            ? prev[section.key]
            : { ...prev[section.key], levels: section.levels[value] },
        ])
      )
    );
  };

  const request = (): SetupRequest => ({
    naming,
    sections: chosen.map((section) => {
      const s = state[section.key];
      return {
        key: section.key,
        levels: s.levels,
        arms: s.arms,
        subjects: s.subjects,
        head_name: s.head_name,
        ...(section.key === 'senior'
          ? {
              departments: Object.entries(s.departments)
                .filter(([, d]) => d.enabled)
                .map(([key, d]) => ({ key, subjects: d.subjects })),
            }
          : {}),
      };
    }),
  });

  const runPreview = () =>
    preview.mutate(request(), {
      onSuccess: (result) => {
        setPlan(result);
        setTimeout(
          () =>
            document.getElementById('structure-preview')?.scrollIntoView({ behavior: 'smooth' }),
          50
        );
      },
      onError: (error) => addToast(errorText(error), 'error'),
    });

  const runApply = () =>
    apply.mutate(request(), {
      onSuccess: (result: { new_classes: number }) => {
        addToast(
          `School structure saved. ${result.new_classes} class${result.new_classes === 1 ? '' : 'es'} created.`,
          'success'
        );
        setPlan(null);
      },
      onError: (error) => addToast(errorText(error), 'error'),
    });

  if (isLoading || !data || !Object.keys(state).length) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-brand-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        eyebrow="Academics"
        title="School Structure"
        description="Tell us what your school runs. We'll set up the classes, arms, subjects and promotion order for you. You can rename or change anything later."
      />

      {data.sections.length > 0 && (
        <div className="rounded-card border border-success-200 bg-success-50 p-4 text-sm text-success-800">
          Already set up: {data.sections.map((s) => s.name).join(', ')}. Run the wizard again to add
          a section; existing classes are kept as they are.
        </div>
      )}
      {data.sections.length === 0 && data.class_count > 0 && (
        <div className="rounded-card border border-info-200 bg-info-50 p-4 text-sm text-info-800">
          You already have {data.class_count} classes. We&apos;ve pre-selected the sections they
          belong to. Existing classes keep their names and subjects; they&apos;ll just be grouped
          into sections.
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">1. Which sections does your school run?</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {catalogue.map((section) => {
            const Icon = ICONS[section.key];
            const on = state[section.key]?.enabled;
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => update(section.key, { enabled: !on })}
                aria-pressed={on}
                className={`relative rounded-card border-2 bg-white p-5 text-left transition ${on ? 'border-brand-600 shadow-card' : 'border-gray-100 hover:border-gray-300'}`}
              >
                {on && (
                  <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white">
                    <Check size={14} />
                  </span>
                )}
                <Icon className="mb-3 text-brand-600" size={28} />
                <span className="block font-bold text-gray-900">{section.label}</span>
                <span className="mt-1 block text-xs text-gray-500">
                  {section.levels[naming].join(', ')}
                </span>
                {existingKeys.has(section.key) && (
                  <span className="mt-2 inline-block rounded-full bg-success-50 px-2 py-0.5 text-xs font-semibold text-success-700">
                    Set up
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">2. How do you name your classes?</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ['classic', 'Primary 1–6 · JSS 1–3 · SSS 1–3'],
              ['basic', 'Basic 1–6 · Basic 7–9 · SS 1–3'],
            ] as [NamingStyle, string][]
          ).map(([value, label]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-3 rounded-card border-2 bg-white p-4 ${naming === value ? 'border-brand-600' : 'border-gray-100'}`}
            >
              <input
                type="radio"
                name="naming"
                checked={naming === value}
                onChange={() => changeNaming(value)}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="font-semibold text-gray-900">{label}</span>
            </label>
          ))}
        </div>
      </section>

      {chosen.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">3. Classes and subjects</h2>
          {chosen.map((section) => {
            const s = state[section.key];
            const levels =
              section.key === 'early_years' ? section.levels.classic : section.levels[naming];
            const customSubjects = s.subjects.filter(
              (n) => !section.subjects.some((cs) => cs.name === n)
            );
            return (
              <div
                key={section.key}
                className="space-y-5 rounded-card border border-gray-100 bg-white p-5 shadow-card"
              >
                <h3 className="text-base font-bold text-gray-900">{section.label}</h3>

                <LevelsEditor
                  value={s.levels}
                  suggestions={levels}
                  onChange={(next) => update(section.key, { levels: next })}
                />

                {section.key !== 'senior' && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-gray-700">Arms</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {ARM_PRESETS.map((preset) => {
                        const active = s.arms.join(',') === preset.arms.join(',');
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => update(section.key, { arms: preset.arms, armsText: '' })}
                            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${active ? 'bg-brand-600 text-white' : 'border border-gray-200 text-gray-600'}`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                      <input
                        value={s.armsText}
                        placeholder="Custom, e.g. Gold, Diamond"
                        onChange={(e) =>
                          update(section.key, {
                            armsText: e.target.value,
                            arms: e.target.value
                              .split(',')
                              .map((a) => a.trim())
                              .filter(Boolean),
                          })
                        }
                        className="w-56 rounded-control border border-gray-200 px-3 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    {section.key === 'senior' ? 'Core subjects (every department)' : 'Subjects'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[...section.subjects.map((cs) => cs.name), ...customSubjects].map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => update(section.key, { subjects: toggle(s.subjects, name) })}
                        aria-pressed={s.subjects.includes(name)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${s.subjects.includes(name) ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-300' : 'border border-gray-200 text-gray-500'}`}
                      >
                        {s.subjects.includes(name) && <Check size={12} className="mr-1 inline" />}
                        {name}
                      </button>
                    ))}
                    <form
                      className="flex items-center gap-1"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const name = s.extraSubject.trim();
                        if (name && !s.subjects.includes(name))
                          update(section.key, {
                            subjects: [...s.subjects, name],
                            extraSubject: '',
                          });
                      }}
                    >
                      <input
                        value={s.extraSubject}
                        onChange={(e) => update(section.key, { extraSubject: e.target.value })}
                        placeholder="Add a subject"
                        maxLength={100}
                        className="w-40 rounded-control border border-gray-200 px-2 py-1 text-xs"
                      />
                      <button
                        type="submit"
                        aria-label="Add subject"
                        className="rounded-control border border-gray-200 p-1 text-gray-600 hover:border-brand-400"
                      >
                        <Plus size={14} />
                      </button>
                    </form>
                  </div>
                </div>

                {section.key === 'senior' && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Departments</p>
                    {section.departments.map((dept) => {
                      const d = s.departments[dept.key];
                      return (
                        <div key={dept.key} className="rounded-control border border-gray-100 p-3">
                          <label className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                            <input
                              type="checkbox"
                              checked={d.enabled}
                              onChange={() =>
                                update(section.key, {
                                  departments: {
                                    ...s.departments,
                                    [dept.key]: { ...d, enabled: !d.enabled },
                                  },
                                })
                              }
                              className="h-4 w-4 accent-brand-600"
                            />
                            {dept.label}
                          </label>
                          {d.enabled && (
                            <div className="flex flex-wrap gap-2">
                              {dept.subjects.map((sub) => (
                                <button
                                  key={sub.name}
                                  type="button"
                                  onClick={() =>
                                    update(section.key, {
                                      departments: {
                                        ...s.departments,
                                        [dept.key]: {
                                          ...d,
                                          subjects: toggle(d.subjects, sub.name),
                                        },
                                      },
                                    })
                                  }
                                  aria-pressed={d.subjects.includes(sub.name)}
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${d.subjects.includes(sub.name) ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-300' : 'border border-gray-200 text-gray-500'}`}
                                >
                                  {sub.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <p className="text-xs text-gray-500">
                      Each department becomes its own class at every level (e.g. SSS 1 Science).
                      Choosing individual subjects per student comes in a later update.
                    </p>
                  </div>
                )}

                <label className="block max-w-sm space-y-1">
                  <span className="text-sm font-semibold text-gray-700">
                    {section.head_title} (optional)
                  </span>
                  <input
                    value={s.head_name}
                    onChange={(e) => update(section.key, { head_name: e.target.value })}
                    placeholder="Name shown on report cards"
                    maxLength={120}
                    className="w-full rounded-control border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
            );
          })}
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={runPreview}
          disabled={chosen.length === 0 || preview.isPending}
          className="flex items-center gap-2 rounded-control bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {preview.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ArrowRight size={16} />
          )}
          Preview
        </button>
        <Link
          href="/classes"
          className="rounded-control border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Go to classes
        </Link>
      </div>

      {plan && (
        <section
          id="structure-preview"
          className="space-y-4 rounded-card border border-brand-200 bg-brand-50/40 p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">4. Check and create</h2>
              <p className="text-sm text-gray-600">
                {plan.summary.new_classes} new class{plan.summary.new_classes === 1 ? '' : 'es'}
                {plan.summary.existing_classes > 0 &&
                  `, ${plan.summary.existing_classes} existing kept as they are`}
                {plan.summary.new_subjects.length > 0 &&
                  `, ${plan.summary.new_subjects.length} new subjects`}
                .
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPlan(null)}
                className="flex items-center gap-1 rounded-control border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
              >
                <X size={16} /> Change
              </button>
              <button
                type="button"
                onClick={runApply}
                disabled={apply.isPending}
                className="flex items-center gap-2 rounded-control bg-brand-600 px-5 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {apply.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Create structure
              </button>
            </div>
          </div>
          {plan.sections.map((section) => (
            <div key={section.key}>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                {section.label}
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {section.classes.map((c) => (
                  <li
                    key={c.name}
                    className="rounded-control border border-gray-100 bg-white p-3 text-sm"
                  >
                    <p className="font-bold text-gray-900">
                      {c.name}
                      {c.exists && (
                        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          exists
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.graduation ? 'Final class: students graduate' : `Promotes to ${c.next}`}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {c.exists ? 'Keeps its current subjects' : `${c.subjects.length} subjects`}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
