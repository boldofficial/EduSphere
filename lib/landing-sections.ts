import type { LandingSection, LandingSectionKey, Settings } from '@/lib/types';

/**
 * Sections of a school's public page, in default order. The header and footer are fixed and are not
 * sections. `anchor` keeps header links (/#about, /#contact…) working when a section uses custom code.
 */
export const BUILTIN_SECTIONS: {
  key: Exclude<LandingSectionKey, 'custom'>;
  label: string;
  anchor: string;
}[] = [
  { key: 'hero', label: 'Hero banner', anchor: 'home' },
  { key: 'about', label: 'About us', anchor: 'about' },
  { key: 'values', label: 'Core values', anchor: 'features' },
  { key: 'programs', label: 'Academic programs', anchor: 'programs' },
  { key: 'gallery', label: 'Photo gallery', anchor: 'gallery' },
  { key: 'cta', label: 'Admission call-to-action', anchor: 'apply' },
  { key: 'contact', label: 'Contact', anchor: 'contact' },
];

const builtin = (key: Exclude<LandingSectionKey, 'custom'>): LandingSection => ({
  id: key,
  key,
  title: '',
  enabled: true,
  use_custom: false,
  html: '',
  css: '',
});

export function sectionLabel(section: LandingSection) {
  if (section.key === 'custom') return section.title || 'Custom section';
  return BUILTIN_SECTIONS.find((b) => b.key === section.key)?.label || section.key;
}

export function sectionAnchor(section: LandingSection) {
  return BUILTIN_SECTIONS.find((b) => b.key === section.key)?.anchor || section.id;
}

/** The school's sections in display order. Every built-in section is always present exactly once. */
export function resolveSections(settings: Settings): LandingSection[] {
  const saved = Array.isArray(settings.landing_sections) ? settings.landing_sections : [];
  if (saved.length === 0) {
    const defaults = BUILTIN_SECTIONS.map((b) => builtin(b.key));
    // Schools that only used the older single custom block keep it, above Contact.
    if (settings.landing_custom_enabled && settings.landing_custom_html) {
      defaults.splice(defaults.length - 1, 0, {
        id: 'custom-1',
        key: 'custom',
        title: 'Custom section',
        enabled: true,
        use_custom: true,
        html: settings.landing_custom_html,
        css: settings.landing_custom_css || '',
      });
    }
    return defaults;
  }
  const present = new Set(saved.map((s) => s.key));
  const missing = BUILTIN_SECTIONS.filter((b) => !present.has(b.key)).map((b) => builtin(b.key));
  return [...saved, ...missing];
}

export function newCustomSection(existing: LandingSection[], html = '', css = ''): LandingSection {
  let n = existing.filter((s) => s.key === 'custom').length + 1;
  while (existing.some((s) => s.id === `custom-${n}`)) n++;
  return {
    id: `custom-${n}`,
    key: 'custom',
    title: `Custom section ${n}`,
    enabled: true,
    use_custom: true,
    html,
    css,
  };
}

/** Links a school can paste into any section's href. Relative, so they work on custom domains too. */
export const SITE_LINKS = [
  { label: 'Apply for admission', href: '/admission' },
  { label: 'Portal login', href: '/login' },
  { label: 'Photo gallery', href: '/gallery' },
  { label: 'Home (top)', href: '/#home' },
  { label: 'About', href: '/#about' },
  { label: 'Programs', href: '/#programs' },
  { label: 'Contact', href: '/#contact' },
];

/** Base styles every custom section gets. `--brand` is the school's theme colour. */
export const SECTION_BASE_CSS = `
  .section-root { display: block; color: #111827; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; line-height: 1.6; }
  .section-root *, .section-root *::before, .section-root *::after { box-sizing: border-box; }
  .section-root img { display: block; max-width: 100%; height: auto; }
  .section-root a { color: inherit; }
  .section-root h1, .section-root h2, .section-root h3, .section-root h4 { line-height: 1.2; margin: 0 0 0.5em; }
  .section-root p { margin: 0 0 1em; }
`;

/**
 * Starter layouts that already look finished. Inline styles only, `var(--brand)` for the school colour,
 * and auto-fit grids so they reflow on phones without media queries.
 */
export const SECTION_TEMPLATES: { name: string; html: string; css?: string }[] = [
  {
    name: 'Feature cards',
    html: `<section style="padding: 80px 24px; background: #f8fafc;">
  <div style="max-width: 1120px; margin: 0 auto;">
    <p style="text-transform: uppercase; letter-spacing: 0.12em; font-size: 13px; font-weight: 700; color: var(--brand); text-align: center;">Why families choose us</p>
    <h2 style="font-size: 36px; font-weight: 800; text-align: center; color: #0f172a;">Learning that prepares every child</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-top: 40px;">
      <div style="background: #ffffff; border-radius: 16px; padding: 28px; box-shadow: 0 1px 3px rgba(15,23,42,0.08);">
        <h3 style="font-size: 20px; color: #0f172a;">Qualified teachers</h3>
        <p style="color: #475569;">Experienced, caring staff who know every student by name.</p>
      </div>
      <div style="background: #ffffff; border-radius: 16px; padding: 28px; box-shadow: 0 1px 3px rgba(15,23,42,0.08);">
        <h3 style="font-size: 20px; color: #0f172a;">Modern facilities</h3>
        <p style="color: #475569;">Science labs, ICT centre and a well-stocked library.</p>
      </div>
      <div style="background: #ffffff; border-radius: 16px; padding: 28px; box-shadow: 0 1px 3px rgba(15,23,42,0.08);">
        <h3 style="font-size: 20px; color: #0f172a;">Holistic growth</h3>
        <p style="color: #475569;">Sports, arts and clubs that build confidence and character.</p>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    name: 'Image + text',
    html: `<section style="padding: 80px 24px; background: #ffffff;">
  <div style="max-width: 1120px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 48px; align-items: center;">
    <img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900" alt="Students in class" style="width: 100%; border-radius: 20px;">
    <div>
      <h2 style="font-size: 34px; font-weight: 800; color: #0f172a;">A tradition of excellence</h2>
      <p style="font-size: 17px; color: #475569;">Tell your story here: your history, your mission and what makes your school different.</p>
      <a href="/admission" style="display: inline-block; margin-top: 12px; background: var(--brand); color: #ffffff; padding: 14px 28px; border-radius: 999px; font-weight: 700; text-decoration: none;">Apply for admission</a>
    </div>
  </div>
</section>`,
  },
  {
    name: 'Admission banner',
    html: `<section style="padding: 72px 24px; background: var(--brand); color: #ffffff; text-align: center;">
  <h2 style="font-size: 36px; font-weight: 800;">Admissions are open</h2>
  <p style="font-size: 18px; opacity: 0.9; max-width: 640px; margin: 0 auto 28px;">Secure a place for your child for the coming session.</p>
  <a href="/admission" style="display: inline-block; background: #ffffff; color: var(--brand); padding: 14px 32px; border-radius: 999px; font-weight: 800; text-decoration: none;">Start application</a>
  <a href="/#contact" style="display: inline-block; margin-left: 12px; border: 2px solid rgba(255,255,255,0.7); color: #ffffff; padding: 12px 30px; border-radius: 999px; font-weight: 700; text-decoration: none;">Talk to us</a>
</section>`,
  },
  {
    name: 'Stats strip',
    html: `<section style="padding: 56px 24px; background: #0f172a; color: #ffffff;">
  <div style="max-width: 1120px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 24px; text-align: center;">
    <div><p style="font-size: 40px; font-weight: 800; margin: 0;">25+</p><p style="opacity: 0.7; margin: 0;">Years of excellence</p></div>
    <div><p style="font-size: 40px; font-weight: 800; margin: 0;">98%</p><p style="opacity: 0.7; margin: 0;">WAEC pass rate</p></div>
    <div><p style="font-size: 40px; font-weight: 800; margin: 0;">1:15</p><p style="opacity: 0.7; margin: 0;">Teacher to student</p></div>
    <div><p style="font-size: 40px; font-weight: 800; margin: 0;">30+</p><p style="opacity: 0.7; margin: 0;">Clubs &amp; activities</p></div>
  </div>
</section>`,
  },
  {
    name: 'Cards with hover (uses CSS box)',
    html: `<section style="padding: 80px 24px;">
  <div style="max-width: 1120px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px;">
    <a class="card" href="/admission"><h3>Creche &amp; Nursery</h3><p>Play-based early years learning.</p></a>
    <a class="card" href="/admission"><h3>Primary</h3><p>Strong foundations in literacy and numeracy.</p></a>
    <a class="card" href="/admission"><h3>Secondary</h3><p>JSS and SSS with science, arts and commercial tracks.</p></a>
  </div>
</section>`,
    css: `.card {
  display: block;
  padding: 28px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.card:hover {
  transform: translateY(-4px);
  border-color: var(--brand);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
}
.card h3 { color: var(--brand); }
@media (max-width: 640px) {
  .card { padding: 20px; }
}`,
  },
];
