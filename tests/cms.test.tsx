import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CMSPage from '@/app/(dashboard)/cms/page';
import { INITIAL_SETTINGS } from '@/lib/utils';
import type { Settings } from '@/lib/types';

const { addToast } = vi.hoisted(() => ({ addToast: vi.fn() }));

vi.mock('@/lib/hooks/use-data', () => ({
  useSettings: () => ({ data: INITIAL_SETTINGS, isLoading: false }),
  queryKeys: { settings: ['settings'], publicSettings: ['public_settings'] },
}));

vi.mock('@/components/providers/toast-provider', () => ({
  useToast: () => ({ addToast }),
}));

// The identity tab stands in for any editor: it makes one change so there is something to publish.
vi.mock('@/components/features/cms/CmsIdentityTab', () => ({
  CmsIdentityTab: ({ updateField }: { updateField: (f: keyof Settings, v: unknown) => void }) => (
    <button type="button" onClick={() => updateField('school_tagline', 'Excellence in all things')}>
      Edit tagline
    </button>
  ),
}));
vi.mock('@/components/features/cms/CmsHeroTab', () => ({ CmsHeroTab: () => null }));
vi.mock('@/components/features/cms/CmsContentTabs', () => ({ CmsContentTabs: () => null }));
vi.mock('@/components/features/cms/CmsAppearanceTab', () => ({ CmsAppearanceTab: () => null }));
vi.mock('@/components/features/cms/CmsEnquiriesTab', () => ({
  CmsEnquiriesTab: () => null,
  useNewEnquiryCount: () => ({ data: 0 }),
}));
vi.mock('@/components/features/cms/CmsWebsiteTools', () => ({
  WebsiteChecklist: () => null,
  WebsiteHistory: () => null,
  WebsitePreview: () => null,
}));

function renderPage(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{children}</QueryClientProvider>);
}

describe('Website CMS', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    addToast.mockReset();
  });

  it('only allows publishing when something changed', () => {
    renderPage(<CMSPage />);
    expect(screen.getByRole('button', { name: 'Published' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Edit tagline' }));
    expect(screen.getByRole('button', { name: 'Publish Changes' })).toBeEnabled();
  });

  it('publishes settings through the mounted core settings endpoint', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ ...INITIAL_SETTINGS, school_tagline: 'Excellence in all things' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    renderPage(<CMSPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit tagline' }));
    fireEvent.click(screen.getByRole('button', { name: 'Publish Changes' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/proxy/core/settings',
        expect.objectContaining({ method: 'PUT' })
      );
    });
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Website published', 'success'));
  });

  it('shows field validation feedback returned by the backend', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ errors: { landing_custom_css: ['Custom CSS contains an unsafe rule.'] } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    );

    renderPage(<CMSPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit tagline' }));
    fireEvent.click(screen.getByRole('button', { name: 'Publish Changes' }));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Custom CSS contains an unsafe rule.', 'error');
    });
  });
});
