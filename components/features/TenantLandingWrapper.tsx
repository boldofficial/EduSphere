'use client';

import { useEffect, useState } from 'react';
import { LandingPage } from '@/components/features/LandingPage';
import * as Utils from '@/lib/utils';
import { useSettings, usePublicStats } from '@/lib/hooks/use-data';
import Script from 'next/script';

// JSON-LD Structured Data for SEO (Dynamic based on settings in future)
const getStructuredData = (settings: any) => ({
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `https://${settings.school_name?.replace(/\s+/g, '').toLowerCase()}.edusphere.ng`,
    "name": settings.school_name || "School Name",
    "description": settings.school_tagline || "Quality Education",
    "url": `https://${settings.school_name?.replace(/\s+/g, '').toLowerCase()}.edusphere.ng`,
    "logo": settings.logo || "",
    "email": settings.school_email || "",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": settings.school_address || "",
        "addressCountry": "NG"
    }
});

export function TenantLandingWrapper() {
    // Use TanStack Query - renders immediately with defaults, updates when data loads
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();
    const { data: publicStats } = usePublicStats();

    const stats = {
        studentsCount: publicStats?.students_count || 0,
        teachersCount: publicStats?.teachers_count || 0,
        classesCount: publicStats?.classes_count || 0
    };

    if (settings.subscription_status === 'pending') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-4">Pending Approval</h1>
                    <p className="text-gray-500 mb-6">
                        Your school account <strong>{settings.school_name}</strong> has been created but is awaiting final approval from the administrator.
                    </p>
                    <p className="text-sm text-gray-400">Please check back later or contact support.</p>
                </div>
            </div>
        );
    }

    if (settings.subscription_status === 'cancelled') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                <h1 className="text-3xl font-black text-gray-900 mb-4">Account Suspended</h1>
                <p className="text-gray-500">This school instance is currently inactive.</p>
            </div>
        );
    }

    return (
        <>
            <Script
                id="structured-data"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(getStructuredData(settings)) }}
            />
            <LandingPage settings={settings} stats={stats} />
        </>
    );
}
