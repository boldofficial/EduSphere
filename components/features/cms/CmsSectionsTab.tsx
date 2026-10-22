'use client';

import { useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Code2,
  Copy,
  Eye,
  EyeOff,
  ImagePlus,
  LayoutTemplate,
  Link2,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import type { LandingSection, Settings } from '@/lib/types';
import {
  SECTION_BASE_CSS,
  SECTION_TEMPLATES,
  SITE_LINKS,
  newCustomSection,
  resolveSections,
  sectionLabel,
} from '@/lib/landing-sections';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Modal } from '@/components/ui/modal';
import { MediaPickerGrid } from './CmsMediaTab';

interface CmsSectionsTabProps {
  localSettings: Settings;
  updateField: (field: keyof Settings, value: unknown) => void;
}

const CODE_BOX =
  'w-full rounded-2xl border border-gray-200 bg-gray-950 p-4 font-mono text-sm leading-6 text-gray-100 outline-none focus:border-brand-500';

/** Live preview in a sandboxed frame: no scripts can run, whatever is pasted. */
function SectionPreview({ html, css, brand }: { html: string; css: string; brand: string }) {
  const doc = useMemo(
    () =>
      `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0}${SECTION_BASE_CSS}\n${css}</style></head>` +
      `<body><div class="section-root" style="--brand: ${brand}">${html}</div></body></html>`,
    [html, css, brand]
  );
  return (
    <iframe
      title="Section preview"
      sandbox=""
      srcDoc={doc}
      className="h-[420px] w-full rounded-2xl border border-gray-200 bg-white"
    />
  );
}

export function CmsSectionsTab({ localSettings, updateField }: CmsSectionsTabProps) {
  const confirm = useConfirm();
  const sections = resolveSections(localSettings);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showCss, setShowCss] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState('');
  const brand = localSettings.landing_primary_color || '#1A3A5C';
  const htmlRef = useRef<HTMLTextAreaElement>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const save = (next: LandingSection[]) => updateField('landing_sections', next);
  const patch = (id: string, changes: Partial<LandingSection>) =>
    save(sections.map((s) => (s.id === id ? { ...s, ...changes } : s)));
  const move = (index: number, delta: number) => {
    const next = [...sections];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    save(next);
  };
  const addSection = (template?: (typeof SECTION_TEMPLATES)[number]) => {
    const created = newCustomSection(sections, template?.html || '', template?.css || '');
    // New sections go just above Contact, so the page still ends with contact details.
    const contactIndex = sections.findIndex((s) => s.key === 'contact');
    const next = [...sections];
    next.splice(contactIndex === -1 ? next.length : contactIndex, 0, created);
    save(next);
    setOpenId(created.id);
    if (template?.css) setShowCss((prev) => ({ ...prev, [created.id]: true }));
  };
  const removeSection = async (section: LandingSection) => {
    const ok = await confirm({
      title: `Delete "${sectionLabel(section)}"?`,
      description: 'Its HTML and CSS will be removed when you publish.',
      confirmLabel: 'Delete section',
      tone: 'danger',
    });
    if (ok) save(sections.filter((s) => s.id !== section.id));
  };
  // Insert a library image at the cursor in the open section's HTML.
  const insertImage = (sectionId: string, url: string, alt: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const safeAlt = alt.replace(/"/g, '&quot;');
    const tag = `<img src="${url}" alt="${safeAlt}" style="width: 100%; height: auto; border-radius: 16px;">`;
    const el = htmlRef.current;
    const start = el ? el.selectionStart : section.html.length;
    const end = el ? el.selectionEnd : section.html.length;
    patch(sectionId, { html: section.html.slice(0, start) + tag + section.html.slice(end) });
    setPickerFor(null);
  };

  const copyLink = async (href: string) => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(href);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      setCopied('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="mb-2 flex items-center gap-2 text-xl font-black text-gray-900">
          <LayoutTemplate className="text-brand-600" size={24} />
          Page Sections
        </h2>
        <p className="text-sm text-gray-500">
          Reorder, hide or redesign any section with your own HTML and CSS, or add new ones. The
          header and footer stay fixed so every page keeps the same navigation.
        </p>
      </div>

      <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-900">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 shrink-0" size={20} />
          <p>
            Write HTML with inline <code>style=&quot;…&quot;</code>; the CSS box is optional and
            only affects its own section (use it for hover effects or phone layouts). Use{' '}
            <code>var(--brand)</code> for your theme colour. Scripts, forms, iframes and fixed
            positioning are removed when you publish.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">
          <Link2 size={16} /> Links you can use in any <code>href</code>
        </p>
        <div className="flex flex-wrap gap-2">
          {SITE_LINKS.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => copyLink(link.href)}
              className="flex items-center gap-2 rounded-control border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-brand-400 hover:text-brand-700"
              title={`Copy ${link.href}`}
            >
              {copied === link.href ? <Check size={14} /> : <Copy size={14} />}
              {link.label} <span className="font-mono text-gray-400">{link.href}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-500">
          <Lock size={16} /> Header (fixed)
        </div>

        {sections.map((section, index) => {
          const isCustom = section.key === 'custom';
          const usesCode = isCustom || section.use_custom;
          const isOpen = openId === section.id;
          return (
            <div
              key={section.id}
              className={`rounded-2xl border bg-white transition ${isOpen ? 'border-brand-300 shadow-card' : 'border-gray-100'} ${section.enabled ? '' : 'opacity-60'}`}
            >
              <div className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex flex-col">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="rounded p-0.5 text-gray-400 hover:text-gray-900 disabled:opacity-30"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={index === sections.length - 1}
                    onClick={() => move(index, 1)}
                    className="rounded p-0.5 text-gray-400 hover:text-gray-900 disabled:opacity-30"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-gray-900">{sectionLabel(section)}</p>
                  <p className="text-xs text-gray-500">
                    {isCustom
                      ? 'Your own section'
                      : usesCode
                        ? 'Standard section, replaced by your code'
                        : 'Standard design (edit its content in the tabs on the left)'}
                  </p>
                </div>

                {!isCustom && (
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                    <input
                      type="checkbox"
                      checked={section.use_custom}
                      onChange={(e) => {
                        patch(section.id, { use_custom: e.target.checked });
                        if (e.target.checked) setOpenId(section.id);
                      }}
                      className="h-4 w-4 accent-brand-600"
                    />
                    Custom code
                  </label>
                )}
                <button
                  type="button"
                  onClick={() => patch(section.id, { enabled: !section.enabled })}
                  className="flex items-center gap-1 rounded-control border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {section.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                  {section.enabled ? 'Shown' : 'Hidden'}
                </button>
                {usesCode && (
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : section.id)}
                    className="flex items-center gap-1 rounded-control bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100"
                  >
                    <Code2 size={14} /> {isOpen ? 'Close editor' : 'Edit code'}
                  </button>
                )}
                {isCustom && (
                  <button
                    type="button"
                    aria-label="Delete section"
                    onClick={() => removeSection(section)}
                    className="rounded-control p-1.5 text-gray-400 hover:bg-danger-50 hover:text-danger-600"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {isOpen && usesCode && (
                <div className="space-y-4 border-t border-gray-100 p-4">
                  {isCustom && (
                    <label className="block space-y-1">
                      <span className="text-sm font-bold text-gray-700">Section name</span>
                      <input
                        value={section.title}
                        maxLength={120}
                        onChange={(e) => patch(section.id, { title: e.target.value })}
                        className="w-full rounded-control border border-gray-200 px-3 py-2 text-sm"
                      />
                    </label>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">Start from a layout:</span>
                    {SECTION_TEMPLATES.map((t) => (
                      <button
                        key={t.name}
                        type="button"
                        onClick={async () => {
                          if (
                            section.html.trim() &&
                            !(await confirm({
                              title: `Replace this section's code with "${t.name}"?`,
                              confirmLabel: 'Replace',
                            }))
                          )
                            return;
                          patch(section.id, { html: t.html, css: t.css || '' });
                          if (t.css) setShowCss((prev) => ({ ...prev, [section.id]: true }));
                        }}
                        className="rounded-control border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:border-brand-400"
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-gray-700">
                            HTML (inline styles)
                          </span>
                          <button
                            type="button"
                            onClick={() => setPickerFor(section.id)}
                            className="flex items-center gap-1 rounded-control border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:border-brand-400"
                          >
                            <ImagePlus size={14} /> Insert image
                          </button>
                        </div>
                        <textarea
                          ref={htmlRef}
                          aria-label="Section HTML"
                          value={section.html}
                          onChange={(e) => patch(section.id, { html: e.target.value })}
                          rows={16}
                          spellCheck={false}
                          className={CODE_BOX}
                          placeholder={
                            '<section style="padding: 64px 24px; text-align: center;">\n  <h2 style="color: var(--brand);">Welcome</h2>\n  <a href="/admission">Apply now</a>\n</section>'
                          }
                        />
                      </div>
                      {showCss[section.id] || section.css ? (
                        <label className="block space-y-1">
                          <span className="text-sm font-bold text-gray-700">
                            CSS (optional, this section only)
                          </span>
                          <textarea
                            value={section.css}
                            onChange={(e) => patch(section.id, { css: e.target.value })}
                            rows={8}
                            spellCheck={false}
                            className={CODE_BOX}
                            placeholder={'.card:hover { transform: translateY(-4px); }'}
                          />
                        </label>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowCss((prev) => ({ ...prev, [section.id]: true }))}
                          className="text-sm font-semibold text-brand-700 hover:underline"
                        >
                          + Add CSS (optional)
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-gray-700">Preview</span>
                      <SectionPreview html={section.html} css={section.css} brand={brand} />
                      <p className="text-xs text-gray-500">
                        The published page uses the cleaned version saved by the server.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-500">
          <Lock size={16} /> Footer (fixed)
        </div>
      </div>

      <button
        type="button"
        onClick={() => addSection()}
        disabled={sections.length >= 30}
        className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        <Plus size={18} /> Add section
      </button>
      <Modal
        isOpen={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        title="Insert an image from your media library"
        size="lg"
      >
        <MediaPickerGrid
          onPick={(item) =>
            pickerFor && insertImage(pickerFor, item.url, item.alt_text || item.caption)
          }
        />
      </Modal>
    </div>
  );
}
