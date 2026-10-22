'use client';

import { useEffect, useRef } from 'react';
import { SECTION_BASE_CSS } from '@/lib/landing-sections';

interface CustomCodeSectionProps {
  html: string;
  css?: string;
  /** Kept on the outer element so header links like /#about still scroll here. */
  anchorId: string;
  brandColor?: string;
}

/**
 * A school-coded section. HTML is sanitized by the server on save; it renders inside a shadow root so
 * the section's CSS cannot leak into the fixed header, footer or other sections (and vice versa).
 */
export function CustomCodeSection({ html, css, anchorId, brandColor }: CustomCodeSectionProps) {
  const hostRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const root = host.shadowRoot || host.attachShadow({ mode: 'open' });
    root.replaceChildren();

    const style = document.createElement('style');
    style.textContent = `:host { display: block; }\n${SECTION_BASE_CSS}\n${css || ''}`;
    const content = document.createElement('div');
    content.className = 'section-root';
    if (brandColor) content.style.setProperty('--brand', brandColor);
    content.innerHTML = html;
    root.append(style, content);
  }, [html, css, brandColor]);

  if (!html) return null;
  return (
    <section id={anchorId} ref={hostRef} data-custom-school-section className="scroll-mt-20" />
  );
}
