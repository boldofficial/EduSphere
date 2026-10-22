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
      'stats',
      'about',
      'values',
      'programs',
      'gallery',
      'testimonials',
      'team',
      'events',
      'faqs',
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

describe('getMediaUrl', () => {
  it('keeps permanent website image addresses as they are', async () => {
    const { getMediaUrl } = await import('@/lib/utils');
    expect(getMediaUrl('/site-media/website/3/abc.webp')).toBe('/site-media/website/3/abc.webp');
    expect(getMediaUrl('https://school.example/site-media/website/3/abc.webp')).toBe(
      '/site-media/website/3/abc.webp'
    );
    // Private media still goes through the authenticated proxy.
    expect(getMediaUrl('/media/passports/x.jpg')).toBe('/api/proxy/media/passports/x.jpg');
  });
});

describe('resolveSections with a saved order', () => {
  it('slots newly added built-in sections into their natural place', () => {
    const saved = ['hero', 'about', 'cta', 'contact'].map((key) => ({
      id: key,
      key: key as LandingSection['key'],
      title: '',
      enabled: true,
      use_custom: false,
      html: '',
      css: '',
    }));
    const keys = resolveSections({ ...INITIAL_SETTINGS, landing_sections: saved }).map(
      (s) => s.key
    );
    expect(keys.indexOf('stats')).toBe(1); // between hero and about
    expect(keys.indexOf('faqs')).toBeLessThan(keys.indexOf('cta'));
    expect(keys[keys.length - 1]).toBe('contact');
  });
});
