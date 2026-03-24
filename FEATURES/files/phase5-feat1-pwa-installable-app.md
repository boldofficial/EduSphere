# feat: PWA — installable app (manifest + service worker)

## Summary
The portal can be installed on mobile and desktop devices as a Progressive Web App.

## Branch Name
`feature/pwa-installable-app`

## PR Title
`feat: add PWA manifest and service worker for installable app experience`

---

## What to Build

- `manifest.json` with app name, icons, theme color, display mode
- Service worker registration in Next.js
- Install prompt handling (beforeinstallprompt)
- Splash screen and standalone display on mobile

## manifest.json

```json
{
  "name": "myregistra",
  "short_name": "Registra",
  "description": "School Management Portal",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1E3A5F",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## next.config.js — PWA Setup (using next-pwa)

```javascript
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  // existing config
});
```

## Install Prompt Hook

```javascript
// hooks/useInstallPrompt.js
import { useState, useEffect } from "react";

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setPrompt(null);
    return outcome;
  };

  return { canInstall: !!prompt, install };
}
```

## _document.js — Meta Tags

```jsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#1E3A5F" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

## Acceptance Criteria
- [ ] Lighthouse PWA score ≥ 90
- [ ] Install prompt appears on supported browsers (Chrome, Edge, Safari iOS)
- [ ] App launches in standalone mode (no browser chrome)
- [ ] Correct icons shown on home screen for Android and iOS
- [ ] `start_url` resolves to the authenticated dashboard
