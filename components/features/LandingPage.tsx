'use client';

import React from 'react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

// Decomposed Sections
import { HeroSection } from './landing-tenant/HeroSection';
import { AboutSection } from './landing-tenant/AboutSection';
import { CoreValuesSection } from './landing-tenant/CoreValuesSection';
import { ProgramsSection } from './landing-tenant/ProgramsSection';
import { CTASection } from './landing-tenant/CTASection';
import { ContactSection } from './landing-tenant/ContactSection';

interface LandingPageProps {
    settings: import('@/lib/types').Settings;
    stats: {
        studentsCount: number;
        teachersCount: number;
        classesCount: number;
    };
}

export const LandingPage: React.FC<LandingPageProps> = ({ settings, stats }) => {
    return (
        <div className="min-h-screen bg-white overflow-x-hidden font-sans">
            <SiteHeader settings={settings} />

            <main>
                <HeroSection settings={settings} />
                <AboutSection settings={settings} />
                <CoreValuesSection settings={settings} />
                <ProgramsSection settings={settings} />
                <CTASection />
                <ContactSection settings={settings} />
            </main>

            <SiteFooter settings={settings} />
        </div>
    );
};
