'use client';

import { Code2, ShieldCheck } from 'lucide-react';
import { Settings } from '@/lib/types';

interface CmsAdvancedDesignTabProps {
  localSettings: Settings;
  updateField: (field: keyof Settings, value: unknown) => void;
}

export function CmsAdvancedDesignTab({ localSettings, updateField }: CmsAdvancedDesignTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="mb-2 flex items-center gap-2 text-xl font-black text-gray-900">
          <Code2 className="text-purple-600" size={24} />
          Advanced HTML & CSS
        </h2>
        <p className="text-sm text-gray-500">
          Add a custom public-page section without affecting the dashboard or login experience.
        </p>
      </div>

      <label className="flex items-center justify-between rounded-2xl border border-purple-100 bg-purple-50 p-5">
        <div>
          <p className="font-bold text-gray-900">Display custom section</p>
          <p className="mt-1 text-xs text-gray-500">
            Publish this block below the standard sections.
          </p>
        </div>
        <input
          type="checkbox"
          checked={localSettings.landing_custom_enabled}
          onChange={(event) => updateField('landing_custom_enabled', event.target.checked)}
          className="h-5 w-5 accent-purple-600"
        />
      </label>

      <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-900">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 shrink-0" size={20} />
          <p>
            HTML is sanitized before publishing. JavaScript, forms, iframes, event handlers, and
            unsafe CSS rules are blocked. CSS runs inside this section only.
          </p>
        </div>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-bold text-gray-700">HTML</span>
        <textarea
          value={localSettings.landing_custom_html}
          onChange={(event) => updateField('landing_custom_html', event.target.value)}
          rows={12}
          spellCheck={false}
          className="w-full rounded-2xl border border-gray-200 bg-gray-950 p-5 font-mono text-sm leading-6 text-gray-100 outline-none focus:border-purple-500"
          placeholder={'<section class="welcome">\n  <h2>Welcome to our school</h2>\n</section>'}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-bold text-gray-700">Scoped CSS</span>
        <textarea
          value={localSettings.landing_custom_css}
          onChange={(event) => updateField('landing_custom_css', event.target.value)}
          rows={10}
          spellCheck={false}
          className="w-full rounded-2xl border border-gray-200 bg-gray-950 p-5 font-mono text-sm leading-6 text-gray-100 outline-none focus:border-purple-500"
          placeholder={'.welcome {\n  padding: 4rem 1.5rem;\n  text-align: center;\n}'}
        />
      </label>
    </div>
  );
}
