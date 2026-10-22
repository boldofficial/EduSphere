'use client';

import { useEffect, useRef } from 'react';
import { Settings } from '@/lib/types';

const BASE_STYLES = `
  :host { display: block; color: #111827; font-family: ui-sans-serif, system-ui, sans-serif; }
  *, *::before, *::after { box-sizing: border-box; }
  img { display: block; max-width: 100%; height: auto; }
  a { color: inherit; }
`;

export function CustomCodeSection({ settings }: { settings: Settings }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const root = host.shadowRoot || host.attachShadow({ mode: 'open' });
    root.replaceChildren();

    const style = document.createElement('style');
    style.textContent = `${BASE_STYLES}\n${settings.landing_custom_css || ''}`;
    const content = document.createElement('div');
    content.innerHTML = settings.landing_custom_html || '';
    root.append(style, content);
  }, [settings.landing_custom_css, settings.landing_custom_html]);

  if (!settings.landing_custom_enabled || !settings.landing_custom_html) return null;
  return <div ref={hostRef} data-custom-school-section />;
}
