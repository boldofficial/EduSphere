import type { CSSProperties } from 'react';
import type { Settings } from '@/lib/types';

export type FontKey =
  | 'inter'
  | 'poppins'
  | 'montserrat'
  | 'playfair'
  | 'merriweather'
  | 'nunito'
  | 'lora'
  | 'raleway';

export const FONT_OPTIONS: { key: FontKey; label: string; style: 'sans' | 'serif' }[] = [
  { key: 'inter', label: 'Inter', style: 'sans' },
  { key: 'poppins', label: 'Poppins', style: 'sans' },
  { key: 'montserrat', label: 'Montserrat', style: 'sans' },
  { key: 'nunito', label: 'Nunito', style: 'sans' },
  { key: 'raleway', label: 'Raleway', style: 'sans' },
  { key: 'playfair', label: 'Playfair Display', style: 'serif' },
  { key: 'merriweather', label: 'Merriweather', style: 'serif' },
  { key: 'lora', label: 'Lora', style: 'serif' },
];

export interface ThemePreset {
  key: string;
  name: string;
  description: string;
  primary: string;
  accent: string;
  heading: FontKey;
  body: FontKey;
}

/** Curated looks. Choosing one sets colours and fonts; schools can then fine-tune either. */
export const THEME_PRESETS: ThemePreset[] = [
  {
    key: 'classic',
    name: 'Classic Heritage',
    description: 'Navy and gold with an elegant serif. Traditional and trusted.',
    primary: '#1A3A5C',
    accent: '#D4AF37',
    heading: 'playfair',
    body: 'inter',
  },
  {
    key: 'modern',
    name: 'Modern Bright',
    description: 'Confident blue with warm amber. Clean and contemporary.',
    primary: '#1D4ED8',
    accent: '#F59E0B',
    heading: 'poppins',
    body: 'inter',
  },
  {
    key: 'royal',
    name: 'Royal Academy',
    description: 'Deep purple and gold. Prestigious and distinctive.',
    primary: '#4C1D95',
    accent: '#EAB308',
    heading: 'montserrat',
    body: 'nunito',
  },
  {
    key: 'fresh',
    name: 'Fresh Green',
    description: 'Leafy green with orange. Friendly, ideal for nursery and primary.',
    primary: '#15803D',
    accent: '#F97316',
    heading: 'nunito',
    body: 'nunito',
  },
  {
    key: 'warm',
    name: 'Warm Maroon',
    description: 'Maroon and gold with classic serifs. Mature and academic.',
    primary: '#881337',
    accent: '#F59E0B',
    heading: 'merriweather',
    body: 'lora',
  },
  {
    key: 'bold',
    name: 'Bold Contrast',
    description: 'Charcoal with sunshine yellow. Striking and energetic.',
    primary: '#111827',
    accent: '#FACC15',
    heading: 'montserrat',
    body: 'raleway',
  },
];

const DEFAULT_PRESET = THEME_PRESETS[0];
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
// Lightness per step, matched to the platform's own brand scale so built-in sections keep their contrast.
const LIGHTNESS = [97, 94, 86, 75, 62, 50, 41, 33, 25, 17, 10];

function hexToHsl(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const n = parseInt(match[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}

/** A full 50–950 scale from one colour, keeping its hue and (bounded) saturation. */
export function colorScale(hex: string): Record<number, string> | null {
  const hsl = hexToHsl(hex);
  if (!hsl) return null;
  const [h, s] = hsl;
  const sat = Math.min(Math.max(s, 12), 90);
  return Object.fromEntries(
    STEPS.map((step, i) => [step, `hsl(${h.toFixed(1)} ${sat.toFixed(1)}% ${LIGHTNESS[i]}%)`])
  );
}

export function resolveTheme(settings: Pick<Settings, 'landing_primary_color' | 'landing_theme'>) {
  const theme = settings.landing_theme || {};
  const preset = THEME_PRESETS.find((p) => p.key === theme.preset) || DEFAULT_PRESET;
  return {
    preset,
    primary: settings.landing_primary_color || preset.primary,
    accent: theme.accent_color || preset.accent,
    heading: (theme.heading_font as FontKey) || preset.heading,
    body: (theme.body_font as FontKey) || preset.body,
  };
}

/**
 * CSS variables that re-theme the whole public site: Tailwind's brand/accent colours used by every
 * built-in section, plus the heading and body fonts.
 */
export function themeStyle(
  settings: Pick<Settings, 'landing_primary_color' | 'landing_theme'>
): CSSProperties {
  const { primary, accent, heading, body } = resolveTheme(settings);
  const vars: Record<string, string> = {
    '--site-font-heading': `var(--font-site-${heading})`,
    '--site-font-body': `var(--font-site-${body})`,
    '--brand': primary,
  };
  const brand = colorScale(primary);
  const accentScale = colorScale(accent);
  if (brand) STEPS.forEach((step) => (vars[`--color-brand-${step}`] = brand[step]));
  if (accentScale) STEPS.forEach((step) => (vars[`--color-accent-${step}`] = accentScale[step]));
  return vars as CSSProperties;
}
