import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CustomCodeSection } from '@/components/features/landing-tenant/CustomCodeSection';
import { INITIAL_SETTINGS } from '@/lib/utils';

describe('CustomCodeSection', () => {
  it('renders enabled HTML and CSS inside an isolated shadow root', () => {
    const { container } = render(
      <CustomCodeSection
        settings={{
          ...INITIAL_SETTINGS,
          landing_custom_enabled: true,
          landing_custom_html: '<section class="welcome"><h2>Campus life</h2></section>',
          landing_custom_css: '.welcome { color: navy; }',
        }}
      />
    );

    const host = container.querySelector('[data-custom-school-section]') as HTMLDivElement;
    expect(host.shadowRoot?.textContent).toContain('Campus life');
    expect(host.shadowRoot?.querySelector('style')?.textContent).toContain(
      '.welcome { color: navy; }'
    );
    expect(container.querySelector('.welcome')).toBeNull();
  });

  it('does not render disabled custom content', () => {
    const { container } = render(
      <CustomCodeSection
        settings={{
          ...INITIAL_SETTINGS,
          landing_custom_enabled: false,
          landing_custom_html: '<h2>Hidden</h2>',
        }}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
