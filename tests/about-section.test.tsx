import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AboutSection } from '@/components/features/landing-tenant/AboutSection';
import { INITIAL_SETTINGS } from '@/lib/utils';

describe('AboutSection', () => {
  it('renders formatted CMS content and configured imagery', () => {
    render(
      <AboutSection
        settings={{
          ...INITIAL_SETTINGS,
          landing_about_eyebrow: 'Discover Heritage',
          landing_about_title: 'A place to thrive',
          landing_about_html: '<p>Learning with <strong>purpose</strong>.</p>',
          landing_about_primary_image: '/primary.jpg',
          landing_about_secondary_image: '/secondary.jpg',
          landing_about_image_position: 'right',
        }}
      />
    );

    expect(screen.getByText('Discover Heritage')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'A place to thrive' })).toBeInTheDocument();
    expect(screen.getByText('purpose')).toHaveProperty('tagName', 'STRONG');
    expect(screen.getByAltText('A place to thrive').getAttribute('src')).toContain('primary.jpg');
    expect(
      screen.getByAltText('A place to thrive — additional view').getAttribute('src')
    ).toContain('secondary.jpg');
  });
});
