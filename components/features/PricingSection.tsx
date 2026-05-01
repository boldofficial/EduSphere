'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Plan {
    id: number;
    name: string;
    slug: string;
    price: string;
    description: string;
    features: string[];
    duration_days: number;
}

// Hardcoded default — the landing page is public and must render even when
// the backend is unreachable. This data is the source of truth for the pilot.
const DEFAULT_PLANS: Plan[] = [
    {
        id: 1,
        name: "Enterprise",
        slug: "enterprise",
        price: "FREE",
        description: "Full platform access to strengthen education together.",
        features: [
            "Student Information System",
            "Academic Management",
            "Bursary & Fee Collection",
            "Examination & Grading",
            "Attendance Tracking",
            "Library Management",
            "Transport Management",
            "Analytics & Reports",
            "Online Admissions",
            "Parent Portal",
        ],
        duration_days: 180,
    },
];

export const PricingSection = () => {
    // Initialise with defaults so the page renders instantly — no loading spinner
    const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);

    useEffect(() => {
        // Optionally try to fetch live overrides from the backend.
        // Uses a short 3-second timeout. If the backend is unreachable (e.g. 502,
        // network error, cold start), we silently stay with the hardcoded defaults.
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        fetch('/api/proxy/schools/plans', { signal: controller.signal, cache: 'no-store' })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setPlans(data);
                }
            })
            .catch(() => {
                // Backend unreachable — silently use defaults. No console error on public page.
            })
            .finally(() => clearTimeout(timeout));

        return () => {
            controller.abort();
            clearTimeout(timeout);
        };
    }, []);




    return (
        <section id="pricing" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <div className="inline-block px-4 py-1.5 bg-brand-50 text-brand-700 font-bold text-sm rounded-full mb-4">
                        Flexible Pricing
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Choose the perfect plan</h2>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                        Simple, transparent pricing. No hidden fees. Upgrade or cancel anytime.
                    </p>
                </div>

                <div className="max-w-xl mx-auto">
                    {plans.filter(p => p.slug === 'enterprise').map((plan) => (
                        <div key={plan.id} className="relative p-10 rounded-[2.5rem] border-2 border-brand-600 ring-8 ring-brand-100 shadow-2xl bg-white transition-all flex flex-col items-center text-center">
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-brand-600 to-purple-600 text-white text-sm font-black uppercase tracking-widest rounded-full shadow-lg">
                                2025/2026 PILOT PROGRAM
                            </div>

                            <div className="mb-8">
                                <h3 className="text-3xl font-black text-gray-900 mb-3">{plan.name} Plan</h3>
                                <p className="text-gray-600 font-medium">Full platform access to strengthen education together.</p>
                            </div>

                            <div className="mb-10 bg-brand-50 px-8 py-6 rounded-3xl border border-brand-100">
                                <span className="text-6xl font-black text-brand-600">FREE</span>
                                <div className="text-brand-900 font-bold mt-2 uppercase tracking-tight">For 2nd & 3rd Term 2025/26</div>
                                <p className="text-brand-700/70 text-sm mt-2 max-w-[200px] mx-auto leading-tight italic">
                                    *In exchange for your valuable review & feedback
                                </p>
                            </div>

                            <ul className="space-y-4 mb-10 w-full text-left">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-4 text-gray-700 font-medium">
                                        <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={14} className="text-brand-600" />
                                        </div>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={`/onboarding?plan=${plan.slug}`}
                                className="w-full py-5 bg-brand-600 text-white text-xl font-bold rounded-2xl hover:bg-brand-700 shadow-xl shadow-brand-600/30 transition-all flex items-center justify-center gap-3 group"
                            >
                                Get Enterprise for Free
                                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    ))}
                    {plans.filter(p => p.slug === 'enterprise').length === 0 && (
                        <div className="text-center p-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-500 font-bold text-lg">Coming Soon: The 2025/26 Pilot Program</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};
