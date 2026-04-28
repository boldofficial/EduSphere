import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Settings } from '@/lib/types';

import * as Utils from '@/lib/utils';

interface HeroSectionProps {
    settings: Settings;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ settings }) => {
    return (
        <section id="home" className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <div 
                    className="absolute inset-0 z-10" 
                    style={{ backgroundColor: `${settings.landing_primary_color || '#1A3A5C'}CC` }}
                ></div>
                <img
                    src={Utils.getMediaUrl(settings.landing_hero_image) || "/hero1.jpg"}
                    alt="School Campus"
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
                {/* School Logo */}
                <div className="mx-auto mb-8 w-28 h-28 bg-white rounded-2xl shadow-2xl p-3 flex items-center justify-center">
                    {settings.logo_media ? (
                        <img src={Utils.getMediaUrl(settings.logo_media) || ''} alt="School Logo" className="w-full h-full object-contain" />
                    ) : (
                        <img src="/full-logo.png" alt="Registra Logo" className="w-full h-full object-contain" />
                    )}
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
                    {settings.landing_hero_title || settings.school_name || "Registra"}
                </h1>

                {/* Tagline / Subtitle */}
                <p 
                    className="text-xl md:text-2xl font-semibold italic mb-6" 
                    style={{ color: settings.landing_primary_color === '#1A3A5C' ? '#FBBF24' : '#FFFFFF' }}
                >
                    {settings.landing_hero_subtitle || settings.school_tagline || "The operating system for modern schools."}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/admission"
                        className="px-8 py-4 text-lg font-bold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 group"
                        style={{ 
                            backgroundColor: settings.landing_primary_color === '#1A3A5C' ? '#FBBF24' : (settings.landing_primary_color || '#1A3A5C'), 
                            color: settings.landing_primary_color === '#1A3A5C' ? '#1A3A5C' : '#FFFFFF' 
                        }}
                    >
                        {settings.landing_cta_text || "Apply for Admission"}
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        href="/dashboard"
                        className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-lg font-bold rounded-lg transition-all border border-white/20"
                    >
                        Parent/Student Portal
                    </Link>
                </div>
            </div>

            {/* Decorative Curved Divider */}
            <div className="absolute bottom-0 w-full z-30">
                <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                    <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="white" />
                </svg>
            </div>
        </section>
    );
};
