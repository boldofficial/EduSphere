'use client';

import { useSyncExternalStore } from 'react';
import { onlineManager, useMutationState } from '@tanstack/react-query';
import { CloudOff, RefreshCw } from 'lucide-react';
import { OFFLINE_SCOPE } from '@/lib/offline';

function useOnline() {
  return useSyncExternalStore(
    (notify) => onlineManager.subscribe(notify),
    () => onlineManager.isOnline(),
    () => true
  );
}

/** Score and attendance saves that have not reached the server yet. */
export function usePendingOfflineSaves() {
  return useMutationState({
    filters: {
      status: 'pending',
      predicate: (mutation) => mutation.options.scope?.id === OFFLINE_SCOPE.id,
    },
  }).length;
}

/** A small bar while offline or syncing, so teachers know their work is safe. */
export function OfflineStatus() {
  const online = useOnline();
  const pending = usePendingOfflineSaves();

  if (online && pending === 0) return null;

  const changes = `${pending} change${pending === 1 ? '' : 's'}`;
  const text = online
    ? `Syncing ${changes}…`
    : pending > 0
      ? `Offline · ${changes} saved on this device. They will sync when the connection returns.`
      : 'Offline · showing data saved on this device. Scores and attendance you enter will sync later.';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`no-print flex items-center gap-2 px-4 py-2 text-sm font-medium ${
        online ? 'bg-info-50 text-info-800' : 'bg-warning-50 text-warning-800'
      }`}
    >
      {online ? (
        <RefreshCw size={16} className="shrink-0 animate-spin" />
      ) : (
        <CloudOff size={16} className="shrink-0" />
      )}
      <span className="min-w-0">{text}</span>
    </div>
  );
}
