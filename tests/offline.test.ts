import { describe, it, expect } from 'vitest';
import type { Query } from '@tanstack/react-query';
import { isLocalId, localId, shouldKeepOffline } from '@/lib/offline';

const query = (key: unknown[], status = 'success') =>
  ({ queryKey: key, state: { status } }) as unknown as Query;

describe('offline entry', () => {
  it('marks records created on this device with a local id', () => {
    const id = localId('score', 12, '2025/2026', 'First Term');
    expect(isLocalId(id)).toBe(true);
    expect(isLocalId('07cba2e6-7716-4804-aa51-82e7993f40ba')).toBe(false); // a screen's own id
    expect(isLocalId(42)).toBe(false);
  });

  it('keeps only what offline score and attendance entry needs', () => {
    expect(shouldKeepOffline(query(['scores', { class: '4' }]))).toBe(true);
    expect(shouldKeepOffline(query(['attendance']))).toBe(true);
    expect(shouldKeepOffline(query(['payments']))).toBe(false); // no finance on the device
    expect(shouldKeepOffline(query(['conversations']))).toBe(false); // no messages
    expect(shouldKeepOffline(query(['scores'], 'error'))).toBe(false);
  });
});
