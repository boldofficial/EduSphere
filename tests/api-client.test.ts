import { describe, it, expect, vi, beforeEach } from 'vitest';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/lib/api-client', () => ({ default: { get } }));

import { fetchAll, fetchPaginated } from '@/lib/hooks/use-data';

describe('fetchAll', () => {
  beforeEach(() => get.mockReset());

  it('follows DRF pagination until there is no next page', async () => {
    get
      .mockResolvedValueOnce({ data: { results: [1, 2], next: 'page=2' } })
      .mockResolvedValueOnce({ data: { results: [3], next: null } });

    await expect(fetchAll<number>('academic/students/', { class: 'c1' })).resolves.toEqual([
      1, 2, 3,
    ]);
    expect(get).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenLastCalledWith('academic/students/', {
      params: { page_size: 200, class: 'c1', page: 2 },
    });
  });

  it('returns plain array responses as-is', async () => {
    get.mockResolvedValueOnce({ data: ['a', 'b'] });
    await expect(fetchAll<string>('core/notifications/')).resolves.toEqual(['a', 'b']);
  });
});

describe('fetchPaginated', () => {
  it('requests a single page with page_size', async () => {
    get.mockResolvedValueOnce({ data: { count: 1, results: ['x'], next: null, previous: null } });
    const page = await fetchPaginated<string>('bursary/payments/', 3, 25, { term: 'First Term' });
    expect(page.count).toBe(1);
    expect(get).toHaveBeenLastCalledWith('bursary/payments/', {
      params: { term: 'First Term', page: 3, page_size: 25 },
    });
  });
});

describe('auth cookie options', () => {
  it('uses host-only lax cookies outside production', async () => {
    const { getCookieOptions } = await import('@/lib/auth-utils');
    const options = getCookieOptions('access');
    expect(options).toMatchObject({ httpOnly: true, secure: false, sameSite: 'lax', maxAge: 3600 });
    expect(options.domain).toBeUndefined();
  });

  it('scopes production cookies to the root domain', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_ROOT_DOMAIN', 'myregistra.net');
    const { getCookieOptions } = await import('@/lib/auth-utils');
    expect(getCookieOptions('refresh')).toMatchObject({
      secure: true,
      sameSite: 'strict',
      domain: '.myregistra.net',
      maxAge: 60 * 60 * 24 * 7,
    });
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('NEXT_PUBLIC_ROOT_DOMAIN', 'localhost');
  });
});
