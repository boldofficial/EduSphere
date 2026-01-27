'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';

interface Plan {
    id: number;
    name: string;
    slug: string;
    price: string;
    description: string;
    features: string[];
    duration_days: number;
}

export const PricingSection = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await apiClient.get('/schools/plans/');
                setPlans(res.data);
            } catch (err) {
                console.error("Failed to fetch plans", err);
                setError("Could not load pricing at this time.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlans();
    }, []);

    if (isLoading) {
        return (
            <div className="py-20 flex justify-center">
                <Loader2 className="animate-spin text-brand-600" size={40} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-20 text-center text-gray-500">
                <p>{error}</p>
            </div>
        );
    }

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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div key={plan.id} className={`relative p-8 rounded-3xl border ${plan.slug === 'growth' ? 'border-brand-600 ring-4 ring-brand-100 shadow-2xl scale-105 z-10' : 'border-gray-200 shadow-lg hover:shadow-xl'} bg-white transition-all flex flex-col`}>
                            {plan.slug === 'growth' && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-brand-600 text-white text-xs font-bold uppercase tracking-wider rounded-full">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                <p className="text-gray-500 text-sm h-10">{plan.description}</p>
                            </div>

                            <div className="mb-8">
                                <span className="text-5xl font-black text-gray-900">₦{parseFloat(plan.price).toLocaleString()}</span>
                                <span className="text-gray-500 font-medium">/{plan.duration_days === 30 ? 'mo' : 'yr'}</span>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-gray-600 text-sm">
                                        <CheckCircle2 size={18} className="text-brand-600 shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={`/onboarding?plan=${plan.slug}`}
                                className={`w-full py-4 text-center font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${plan.slug === 'growth'
                                        ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/30'
                                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                    }`}
                            >
                                Choose {plan.name}
                                <ArrowRight size={18} />
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
