'use client';

import React from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Plus, Share2, Trash2 } from 'lucide-react';
import type { Settings, WebsiteSocial } from '@/lib/types';
import * as Utils from '@/lib/utils';
import { useToast } from '@/components/providers/toast-provider';

interface CmsExtrasTabProps {
  localSettings: Settings;
  updateField: (field: keyof Settings, value: unknown) => void;
}

type Row = Record<string, string | null>;

interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  maxLength: number;
  image?: boolean;
}

const MAX_IMAGE_MB = 15;

function ListEditor({
  title,
  description,
  rows,
  fields,
  max,
  addLabel,
  onChange,
}: {
  title: string;
  description: string;
  rows: Row[];
  fields: FieldDef[];
  max: number;
  addLabel: string;
  onChange: (rows: Row[]) => void;
}) {
  const { addToast } = useToast();
  const blank = () => Object.fromEntries(fields.map((f) => [f.key, f.image ? null : ''])) as Row;
  const set = (index: number, key: string, value: string | null) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  const move = (index: number, delta: number) => {
    const next = [...rows];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };
  const readImage = (index: number, key: string, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return addToast('Choose an image file.', 'error');
    if (file.size > MAX_IMAGE_MB * 1024 * 1024)
      return addToast(`Images must be under ${MAX_IMAGE_MB} MB.`, 'error');
    const reader = new FileReader();
    reader.onloadend = () => set(index, key, reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5">
      <div>
        <h3 className="font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      {rows.map((row, index) => (
        <div key={index} className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-start gap-3">
            {fields
              .filter((f) => f.image)
              .map((f) => (
                <label
                  key={f.key}
                  className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-white text-gray-400 hover:border-brand-400"
                  title="Upload photo"
                >
                  {row[f.key] ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local preview
                    <img
                      src={Utils.getMediaUrl(row[f.key])}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImagePlus size={22} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => readImage(index, f.key, e.target.files?.[0])}
                  />
                </label>
              ))}
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              {fields
                .filter((f) => !f.image)
                .map((f) =>
                  f.multiline ? (
                    <textarea
                      key={f.key}
                      aria-label={f.label}
                      value={row[f.key] || ''}
                      maxLength={f.maxLength}
                      rows={3}
                      placeholder={f.placeholder || f.label}
                      onChange={(e) => set(index, f.key, e.target.value)}
                      className="rounded-control border border-gray-200 px-3 py-2 text-sm sm:col-span-2"
                    />
                  ) : (
                    <input
                      key={f.key}
                      aria-label={f.label}
                      value={row[f.key] || ''}
                      maxLength={f.maxLength}
                      placeholder={f.placeholder || f.label}
                      onChange={(e) => set(index, f.key, e.target.value)}
                      className="rounded-control border border-gray-200 px-3 py-2 text-sm"
                    />
                  )
                )}
            </div>
            <div className="flex flex-col gap-1">
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
                disabled={index === rows.length - 1}
                onClick={() => move(index, 1)}
                className="rounded p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30"
              >
                <ArrowDown size={16} />
              </button>
              <button
                type="button"
                aria-label="Remove"
                onClick={() => onChange(rows.filter((_, i) => i !== index))}
                className="rounded p-1 text-gray-400 hover:text-danger-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        disabled={rows.length >= max}
        onClick={() => onChange([...rows, blank()])}
        className="flex items-center gap-2 rounded-control border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:border-brand-400 disabled:opacity-50"
      >
        <Plus size={16} /> {addLabel}
      </button>
    </section>
  );
}

const SOCIAL_FIELDS: { key: keyof WebsiteSocial; label: string; placeholder: string }[] = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourschool' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourschool' },
  { key: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/yourschool' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourschool' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourschool' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourschool' },
];

/** Structured content for the ready-made sections: no code needed. */
export function CmsExtrasTab({ localSettings, updateField }: CmsExtrasTabProps) {
  const social = localSettings.landing_social || {};
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="mb-2 flex items-center gap-2 text-xl font-black text-gray-900">
          <Share2 className="text-brand-600" size={24} />
          More Content
        </h2>
        <p className="text-sm text-gray-500">
          Fill these in and the matching sections appear on your website automatically. Empty
          sections stay hidden. Arrange them in <strong>Page Sections &amp; Code</strong>.
        </p>
      </div>

      <ListEditor
        title="Key numbers"
        description='Up to 4 short facts shown in a band, e.g. "25+" / "Years of excellence".'
        rows={localSettings.landing_stats as unknown as Row[]}
        max={4}
        addLabel="Add a number"
        fields={[
          { key: 'value', label: 'Number', placeholder: 'e.g. 98%', maxLength: 20 },
          { key: 'label', label: 'Label', placeholder: 'e.g. WAEC pass rate', maxLength: 60 },
        ]}
        onChange={(rows) => updateField('landing_stats', rows)}
      />

      <ListEditor
        title="Testimonials"
        description="Short quotes from parents or alumni. Three to six work best."
        rows={localSettings.landing_testimonials as unknown as Row[]}
        max={6}
        addLabel="Add a testimonial"
        fields={[
          { key: 'image', label: 'Photo', image: true, maxLength: 0 },
          { key: 'name', label: 'Name', placeholder: 'e.g. Mrs. Adaeze Okafor', maxLength: 100 },
          { key: 'role', label: 'Role', placeholder: 'e.g. Parent, JSS 2', maxLength: 100 },
          { key: 'quote', label: 'Quote', multiline: true, maxLength: 500 },
        ]}
        onChange={(rows) => updateField('landing_testimonials', rows)}
      />

      <ListEditor
        title="Leadership team"
        description="Proprietor, principal, head teachers. A friendly photo builds trust."
        rows={localSettings.landing_team as unknown as Row[]}
        max={24}
        addLabel="Add a person"
        fields={[
          { key: 'image', label: 'Photo', image: true, maxLength: 0 },
          { key: 'name', label: 'Name', maxLength: 100 },
          { key: 'role', label: 'Role', placeholder: 'e.g. Principal', maxLength: 100 },
          { key: 'bio', label: 'Short bio (optional)', multiline: true, maxLength: 500 },
        ]}
        onChange={(rows) => updateField('landing_team', rows)}
      />

      <ListEditor
        title="Frequently asked questions"
        description="Answer what parents ask most: fees, transport, school hours, uniforms."
        rows={localSettings.landing_faqs as unknown as Row[]}
        max={30}
        addLabel="Add a question"
        fields={[
          { key: 'question', label: 'Question', maxLength: 200 },
          { key: 'answer', label: 'Answer', multiline: true, maxLength: 2000 },
        ]}
        onChange={(rows) => updateField('landing_faqs', rows)}
      />

      <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5">
        <div>
          <h3 className="font-bold text-gray-900">Social media, WhatsApp &amp; opening hours</h3>
          <p className="text-sm text-gray-500">
            Shown in the footer. A WhatsApp number also adds a &quot;Chat with us&quot; button.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {SOCIAL_FIELDS.map((f) => (
            <label key={f.key} className="block space-y-1">
              <span className="text-xs font-bold text-gray-600">{f.label}</span>
              <input
                type="url"
                value={social[f.key] || ''}
                placeholder={f.placeholder}
                maxLength={300}
                onChange={(e) =>
                  updateField('landing_social', { ...social, [f.key]: e.target.value.trim() })
                }
                className="w-full rounded-control border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
          ))}
          <label className="block space-y-1">
            <span className="text-xs font-bold text-gray-600">WhatsApp number</span>
            <input
              type="tel"
              value={social.whatsapp || ''}
              placeholder="+234 801 234 5678"
              maxLength={20}
              onChange={(e) =>
                updateField('landing_social', { ...social, whatsapp: e.target.value })
              }
              className="w-full rounded-control border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-gray-600">Opening hours</span>
            <input
              value={localSettings.landing_opening_hours || ''}
              placeholder="Mon–Fri, 7:30am – 4:00pm"
              maxLength={200}
              onChange={(e) => updateField('landing_opening_hours', e.target.value)}
              className="w-full rounded-control border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>
    </div>
  );
}
