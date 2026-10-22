'use client';

import { useEffect, useMemo, useRef } from 'react';
import { SECTION_BASE_CSS } from '@/lib/landing-sections';

interface CustomCodeSectionProps {
  html: string;
  css?: string;
  /** Kept on the outer element so header links like /#about still scroll here. */
  anchorId: string;
  brandColor?: string;
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * A school-coded section. HTML is sanitized by the server on save. It renders inside a shadow root so the
 * section's CSS cannot leak into the fixed header, footer or other sections (and vice versa).
 *
 * The server sends it as declarative shadow DOM (`<template shadowrootmode="open">`), so it is part of the
 * first paint and visible to search engines. Browsers without declarative shadow DOM, and later prop
 * changes, are handled by attaching the shadow root on the client.
 */
export function CustomCodeSection({ html, css, anchorId, brandColor }: CustomCodeSectionProps) {
  const hostRef = useRef<HTMLElement>(null);
  // The server rejects "<" in CSS; stripping it here too means CSS can never end the template early.
  const styleText = `:host { display: block; }\n${SECTION_BASE_CSS}\n${(css || '').replace(/</g, '')}`;
  const brandStyle = brandColor ? ` style="--brand: ${escapeAttribute(brandColor)}"` : '';
  const markup = useMemo(
    () =>
      `<template shadowrootmode="open"><style>${styleText}</style><div class="section-root"${brandStyle}>${html}</div></template>`,
    [styleText, brandStyle, html]
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    // Parsed declaratively by the browser on first load: the template is already gone.
    const leftover = host.querySelector(':scope > template');
    leftover?.remove();
    const root = host.shadowRoot || host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = styleText;
    const content = document.createElement('div');
    content.className = 'section-root';
    if (brandColor) content.style.setProperty('--brand', brandColor);
    content.innerHTML = html;
    root.replaceChildren(style, content);
  }, [html, styleText, brandColor]);

  if (!html) return null;
  return (
    <section
      id={anchorId}
      ref={hostRef}
      data-custom-school-section
      className="scroll-mt-20"
      // The shadow root replaces this markup in the browser, so the light DOM differs after hydration.
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
