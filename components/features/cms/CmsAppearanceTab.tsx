'use client';

import React from 'react';
import { Check, Palette, Type } from 'lucide-react';
import type { Settings, WebsiteTheme } from '@/lib/types';
import { FONT_OPTIONS, THEME_PRESETS, resolveTheme } from '@/lib/site-theme';
import { SiteTheme } from '@/components/features/SiteTheme';

interface CmsAppearanceTabProps {
  localSettings: Settings;
  updateField: (field: keyof Settings, value: unknown) => void;
}

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 w-14 shrink-0 cursor-pointer rounded-xl border-2 border-white shadow"
      />
      <span>
        <span className="block text-sm font-bold text-gray-900">{label}</span>
        <span className="block font-mono text-xs text-gray-500">{value.toUpperCase()}</span>
        <span className="mt-1 block text-xs text-gray-500">{hint}</span>
      </span>
    </label>
  );
}

/** Theme presets, colours and fonts for the school's public website, with a live preview. */
export const CmsAppearanceTab: React.FC<CmsAppearanceTabProps> = ({
  localSettings,
  updateField,
}) => {
  const theme = localSettings.landing_theme || {};
  const resolved = resolveTheme(localSettings);
  const setTheme = (changes: WebsiteTheme) =>
    updateField('landing_theme', { ...theme, ...changes, preset: changes.preset ?? 'custom' });

  const applyPreset = (key: string) => {
    const preset = THEME_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    updateField('landing_primary_color', preset.primary);
    updateField('landing_theme', {
      preset: preset.key,
      accent_color: preset.accent,
      heading_font: preset.heading,
      body_font: preset.body,
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="mb-2 flex items-center gap-2 text-xl font-black text-gray-900">
          <Palette className="text-brand-600" size={24} />
          Branding &amp; Theme
        </h2>
        <p className="text-sm text-gray-500">
          Pick a look, then fine-tune it. Colours and fonts apply to every standard section, the
          header and the footer. Custom-code sections can use <code>var(--brand)</code>.
        </p>
      </div>

      <div>
        <p className="mb-3 text-sm font-bold text-gray-700">Start from a theme</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {THEME_PRESETS.map((preset) => {
            const active = theme.preset === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => applyPreset(preset.key)}
                className={`relative rounded-2xl border-2 bg-white p-4 text-left transition hover:shadow-card ${active ? 'border-brand-600' : 'border-gray-100'}`}
              >
                {active && (
                  <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white">
                    <Check size={14} />
                  </span>
                )}
                <span className="mb-3 flex gap-1.5">
                  <span
                    className="h-8 w-8 rounded-lg"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <span className="h-8 w-8 rounded-lg" style={{ backgroundColor: preset.accent }} />
                </span>
                <span className="block font-bold text-gray-900">{preset.name}</span>
                <span className="mt-1 block text-xs text-gray-500">{preset.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <ColorField
            label="Primary colour"
            hint="Buttons, dark backgrounds, headings accents"
            value={resolved.primary}
            onChange={(value) => {
              updateField('landing_primary_color', value);
              setTheme({});
            }}
          />
          <ColorField
            label="Accent colour"
            hint="Highlights, badges, icons"
            value={resolved.accent}
            onChange={(value) => setTheme({ accent_color: value })}
          />
          {(['heading_font', 'body_font'] as const).map((key) => (
            <label key={key} className="block rounded-2xl border border-gray-100 bg-white p-4">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
                <Type size={16} /> {key === 'heading_font' ? 'Heading font' : 'Body font'}
              </span>
              <select
                value={key === 'heading_font' ? resolved.heading : resolved.body}
                onChange={(e) => setTheme({ [key]: e.target.value })}
                className="w-full rounded-control border border-gray-200 px-3 py-2 text-sm"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.key} value={font.key}>
                    {font.label} ({font.style === 'serif' ? 'serif' : 'sans-serif'})
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div>
          <p className="mb-3 text-sm font-bold text-gray-700">Preview</p>
          <SiteTheme
            settings={localSettings}
            className="overflow-hidden rounded-2xl border border-gray-100 shadow-card"
          >
            <div className="bg-brand-900 p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-400">
                Admissions open
              </p>
              <h3 className="mt-2 text-2xl font-black">
                {localSettings.school_name || 'Your School'}
              </h3>
              <p className="mt-2 text-sm text-white/80">
                Nurturing minds, building values, creating leaders.
              </p>
              <span className="mt-4 inline-block rounded-full bg-accent-400 px-4 py-2 text-sm font-bold text-brand-950">
                Apply for admission
              </span>
            </div>
            <div className="bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
                About us
              </p>
              <h3 className="mt-2 text-xl font-black text-gray-900">A tradition of excellence</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Body text appears in this font. Parents read this to learn about your school.
              </p>
              <div className="mt-4 flex gap-2">
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                  Excellence
                </span>
                <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-bold text-accent-800">
                  Integrity
                </span>
              </div>
            </div>
          </SiteTheme>
        </div>
      </div>
    </div>
  );
};
