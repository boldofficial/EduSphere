/**
 * SystemLandingPage
 *
 * Main landing page. Composes section components and manages shared state
 * (mobile menu, demo modal).
 */
'use client';

import React, { useState } from 'react';
import { PricingSection } from './PricingSection';
import { LandingNav } from './landing/LandingNav';
import { LandingHero } from './landing/LandingHero';
import { FeaturesSection, HowItWorksSection, TestimonialsSection, FAQSection } from './landing/LandingSections';
import { ContactSection, LandingFooter } from './landing/LandingContactFooter';
import { DemoRequestModal } from './landing/DemoRequestModal';

export const SystemLandingPage = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white font-primary selection:bg-brand-100 selection:text-brand-900 overflow-x-hidden">
            <LandingNav mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <LandingHero onOpenDemoModal={() => setIsDemoModalOpen(true)} />
            <FeaturesSection />
            <HowItWorksSection />
            <TestimonialsSection />
            <PricingSection />
            <FAQSection />
            <ContactSection />
            <LandingFooter />

            {/* Demo Request Modal */}
            <DemoRequestModal
                isOpen={isDemoModalOpen}
                onClose={() => setIsDemoModalOpen(false)}
            />
        </div>
    );
};
