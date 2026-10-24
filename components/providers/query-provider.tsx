'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useState } from 'react';
import {
  OFFLINE_MAX_AGE,
  OFFLINE_STORAGE_KEY,
  registerOfflineMutations,
  shouldKeepOffline,
} from '@/lib/offline';

function storage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined; // blocked storage: the app works, just not offline
  }
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          // Kept on the device for offline use, so keep it in memory as long as it is stored.
          gcTime: OFFLINE_MAX_AGE,
          refetchOnWindowFocus: false,
          retry: 3, // Retry failed requests up to 3 times
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        },
      },
    });
    registerOfflineMutations(client);
    return client;
  });
  const [persister] = useState(() => {
    const store = storage();
    return store
      ? createSyncStoragePersister({ storage: store, key: OFFLINE_STORAGE_KEY, throttleTime: 1000 })
      : null;
  });

  if (!persister) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: OFFLINE_MAX_AGE,
        buster: 'v1',
        dehydrateOptions: {
          shouldDehydrateQuery: shouldKeepOffline,
          // Saves still waiting for a connection are kept, so they survive closing the page.
          shouldDehydrateMutation: (mutation) => mutation.state.isPaused,
        },
      }}
      // Send any saves left from last time as soon as the stored copy is back.
      onSuccess={() => queryClient.resumePausedMutations()}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
