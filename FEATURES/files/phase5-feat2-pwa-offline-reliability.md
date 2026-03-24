# feat: PWA offline reliability — caching and offline mode

## Summary
Assets cached for fast loading, with a "Working Offline" mode that protects data integrity during network drops.

## Branch Name
`feature/pwa-offline-reliability`

## PR Title
`feat: add offline asset caching and working-offline mode to PWA`

---

## What to Build

- Cache static assets and API responses using service worker strategies
- Detect network status in the app and show an offline banner
- Queue write actions (form submissions) while offline and sync when reconnected
- Dedicated offline fallback page for uncached routes

## Caching Strategy (next-pwa / Workbox)

```javascript
// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  runtimeCaching: [
    {
      // Static assets — cache first
      urlPattern: /\.(js|css|png|jpg|svg|woff2)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      // API reads — stale while revalidate
      urlPattern: /\/api\/(grades|attendance|finance)\//,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "api-reads",
        expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
      },
    },
    {
      // All pages — network first with offline fallback
      urlPattern: /\//,
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 5,
      },
    },
  ],
  fallbacks: { document: "/offline" },
});
```

## Offline Banner Component

```jsx
// components/OfflineBanner.jsx
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="offline-banner">
      ⚠️ You are working offline. Changes will sync when reconnected.
    </div>
  );
}
```

## Offline Write Queue (IndexedDB)

```javascript
// lib/offlineQueue.js
const DB_NAME = "registra-offline-queue";

export async function enqueueAction(action) {
  const db = await openDB(DB_NAME, 1);
  await db.add("actions", { ...action, queuedAt: Date.now() });
}

export async function flushQueue() {
  const db = await openDB(DB_NAME, 1);
  const actions = await db.getAll("actions");
  for (const action of actions) {
    try {
      await fetch(action.url, { method: action.method, body: action.body });
      await db.delete("actions", action.id);
    } catch {
      break; // Still offline, stop flushing
    }
  }
}

window.addEventListener("online", flushQueue);
```

## Offline Fallback Page

```jsx
// pages/offline.jsx
export default function OfflinePage() {
  return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <h1>You're Offline</h1>
      <p>Please check your connection. Your data is safe and will sync when you reconnect.</p>
    </div>
  );
}
```

## Acceptance Criteria
- [ ] Static assets load instantly on repeat visits (CacheFirst)
- [ ] API read data available from cache when offline (StaleWhileRevalidate)
- [ ] Offline banner appears within 1 second of losing connection
- [ ] Banner dismisses automatically on reconnect
- [ ] Write actions queued offline are flushed automatically on reconnect
- [ ] Uncached routes show the `/offline` fallback page, not a browser error
