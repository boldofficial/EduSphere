import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CustomCodeSection } from '@/components/features/landing-tenant/CustomCodeSection';
import { resolveSections } from '@/lib/landing-sections';
import { INITIAL_SETTINGS } from '@/lib/utils';
import type { LandingSection } from '@/lib/types';

describe('CustomCodeSection', () => {
  it('renders HTML and its own CSS inside an isolated shadow root, keeping the anchor', () => {
    const { container } = render(
      <CustomCodeSection
        anchorId="about"
        brandColor="#123456"
        html='<section class="welcome"><h2>Campus life</h2></section>'
        css=".welcome { color: navy; }"
      />
    );

    const host = container.querySelector('[data-custom-school-section]') as HTMLElement;
    expect(host.id).toBe('about');
    expect(host.shadowRoot?.textContent).toContain('Campus life');
    expect(host.shadowRoot?.querySelector('style')?.textContent).toContain(
      '.welcome { color: navy; }'
    );
    const root = host.shadowRoot?.querySelector('.section-root') as HTMLElement;
    expect(root.style.getPropertyValue('--brand')).toBe('#123456');
    // Nothing leaks into the page's own DOM.
    expect(container.querySelector('.welcome')).toBeNull();
  });

  it('renders nothing without HTML', () => {
    const { container } = render(<CustomCodeSection anchorId="x" html="" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('resolveSections', () => {
  const custom = (id: string): LandingSection => ({
    id,
    key: 'custom',
    title: id,
    enabled: true,
    use_custom: true,
    html: '<p>x</p>',
    css: '',
  });

  it('uses the default order when nothing is saved', () => {
    expect(resolveSections(INITIAL_SETTINGS).map((s) => s.key)).toEqual([
      'hero',
      'about',
      'values',
      'programs',
      'cta',
      'contact',
    ]);
  });

  it('keeps an older single custom block above Contact', () => {
    const keys = resolveSections({
      ...INITIAL_SETTINGS,
      landing_custom_enabled: true,
      landing_custom_html: '<p>legacy</p>',
    }).map((s) => s.key);
    expect(keys.slice(-2)).toEqual(['custom', 'contact']);
  });

  it('follows the saved order and adds back any missing built-in section', () => {
    const saved: LandingSection[] = [
      { ...custom('news') },
      {
        id: 'hero',
        key: 'hero',
        title: '',
        enabled: true,
        use_custom: false,
        html: '',
        css: '',
      },
    ];
    const ids = resolveSections({ ...INITIAL_SETTINGS, landing_sections: saved }).map((s) => s.id);
    expect(ids.slice(0, 2)).toEqual(['news', 'hero']);
    expect(ids).toContain('contact');
  });
});
