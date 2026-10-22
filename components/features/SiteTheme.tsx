import {
  Inter,
  Lora,
  Merriweather,
  Montserrat,
  Nunito,
  Playfair_Display,
  Poppins,
  Raleway,
} from 'next/font/google';
import type { ReactNode } from 'react';
import type { Settings } from '@/lib/types';
import { themeStyle } from '@/lib/site-theme';

// Self-hosted by Next.js. preload: false, so a font's files download only when a school's theme uses it.
const inter = Inter({ subsets: ['latin'], variable: '--font-site-inter', preload: false });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-site-poppins',
  preload: false,
});
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-site-montserrat',
  preload: false,
});
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-site-playfair',
  preload: false,
});
const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-site-merriweather',
  preload: false,
});
const nunito = Nunito({ subsets: ['latin'], variable: '--font-site-nunito', preload: false });
const lora = Lora({ subsets: ['latin'], variable: '--font-site-lora', preload: false });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-site-raleway', preload: false });

const FONT_VARIABLES = [inter, poppins, montserrat, playfair, merriweather, nunito, lora, raleway]
  .map((font) => font.variable)
  .join(' ');

/** Applies a school's colours and fonts to everything inside: built-in sections, header and footer. */
export function SiteTheme({
  settings,
  className = '',
  children,
}: {
  settings: Pick<Settings, 'landing_primary_color' | 'landing_theme'>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`site-theme ${FONT_VARIABLES} ${className}`} style={themeStyle(settings)}>
      {children}
    </div>
  );
}
