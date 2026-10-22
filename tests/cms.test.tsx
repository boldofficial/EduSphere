import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CMSPage from '@/app/(dashboard)/cms/page';
import { INITIAL_SETTINGS } from '@/lib/utils';

const { addToast } = vi.hoisted(() => ({ addToast: vi.fn() }));

vi.mock('@/lib/hooks/use-data', () => ({
  useSettings: () => ({ data: INITIAL_SETTINGS, isLoading: false }),
}));

vi.mock('@/components/providers/toast-provider', () => ({
  useToast: () => ({ addToast }),
}));

vi.mock('@/components/features/cms/CmsIdentityTab', () => ({
  CmsIdentityTab: () => <div>Identity settings</div>,
}));
vi.mock('@/components/features/cms/CmsHeroTab', () => ({ CmsHeroTab: () => null }));
vi.mock('@/components/features/cms/CmsContentTabs', () => ({ CmsContentTabs: () => null }));
vi.mock('@/components/features/cms/CmsAppearanceTab', () => ({ CmsAppearanceTab: () => null }));

describe('Website CMS', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    addToast.mockReset();
  });

  it('publishes settings through the mounted core settings endpoint', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(INITIAL_SETTINGS), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    render(<CMSPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Publish Changes' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/proxy/core/settings',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  it('shows field validation feedback returned by the backend', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ errors: { landing_custom_css: ['Custom CSS contains an unsafe rule.'] } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    );

    render(<CMSPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Publish Changes' }));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Custom CSS contains an unsafe rule.', 'error');
    });
  });
});
