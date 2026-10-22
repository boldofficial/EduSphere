'use client';

import React from 'react';
import type { LandingSection, Settings } from '@/lib/types';
import { resolveSections, sectionAnchor } from '@/lib/landing-sections';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

// Decomposed Sections
import { HeroSection } from './landing-tenant/HeroSection';
import { AboutSection } from './landing-tenant/AboutSection';
import { CoreValuesSection } from './landing-tenant/CoreValuesSection';
import { ProgramsSection } from './landing-tenant/ProgramsSection';
import { CTASection } from './landing-tenant/CTASection';
import { ContactSection } from './landing-tenant/ContactSection';
import { CustomCodeSection } from './landing-tenant/CustomCodeSection';
import { GallerySection } from './landing-tenant/GallerySection';

interface LandingPageProps {
  settings: Settings;
}

function BuiltinSection({ section, settings }: { section: LandingSection; settings: Settings }) {
  switch (section.key) {
    case 'hero':
      return <HeroSection settings={settings} />;
    case 'about':
      return <AboutSection settings={settings} />;
    case 'values':
      return <CoreValuesSection settings={settings} />;
    case 'programs':
      return <ProgramsSection settings={settings} />;
    case 'gallery':
      return (
        <GallerySection
          images={settings.gallery || []}
          brandColor={settings.landing_primary_color || undefined}
        />
      );
    case 'cta':
      return <CTASection />;
    case 'contact':
      return <ContactSection settings={settings} />;
    default:
      return null;
  }
}

/** Fixed header and footer; everything between them follows the school's section list. */
export const LandingPage: React.FC<LandingPageProps> = ({ settings }) => {
  const sections = resolveSections(settings).filter((s) => s.enabled);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden font-sans">
      <SiteHeader settings={settings} />

      <main>
        {sections.map((section) =>
          // A built-in section switched to custom code but left empty keeps its standard design.
          section.key === 'custom' || (section.use_custom && section.html.trim()) ? (
            <CustomCodeSection
              key={section.id}
              html={section.html}
              css={section.css}
              anchorId={sectionAnchor(section)}
              brandColor={settings.landing_primary_color}
            />
          ) : (
            <BuiltinSection key={section.id} section={section} settings={settings} />
          )
        )}
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
};
