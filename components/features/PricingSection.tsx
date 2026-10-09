'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Plan {
  id: number | string;
  name: string;
  slug: string;
  price: string | number;
  description: string;
  features: string[];
  max_students: number | null;
  is_custom_price: boolean;
}

// Fallback so the public page renders even when the backend is unreachable.
// Keep in sync with backend/schools/plans.py (annual price = 3 terms).
const DEFAULT_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    slug: 'free',
    price: 0,
    max_students: 30,
    is_custom_price: false,
    description: 'For very small schools getting started. Subdomain only.',
    features: [
      'Up to 30 students',
      'Student records & attendance',
      'Report cards & broadsheet',
      'Announcements & calendar',
      'yourschool.myregistra.net subdomain',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    slug: 'starter',
    price: 150000,
    max_students: 150,
    is_custom_price: false,
    description: 'Everything a growing school needs to run day to day.',
    features: [
      'Up to 150 students',
      'Everything in Free',
      'Fees, payments & expenses',
      'Admissions, ID cards & conduct',
      'School website & messaging',
      'Custom domain',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    slug: 'standard',
    price: 320000,
    max_students: 400,
    is_custom_price: false,
    description: 'For established schools running more operations.',
    features: [
      'Up to 400 students',
      'Everything in Starter',
      'Library, inventory & transport',
      'Custom domain',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    slug: 'premium',
    price: 520000,
    max_students: 800,
    is_custom_price: false,
    description: 'Digital learning and insights for larger schools.',
    features: [
      'Up to 800 students',
      'Everything in Standard',
      'CBT exams & question bank',
      'Learning centre (LMS)',
      'School analytics',
      'Custom domain',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    slug: 'elite',
    price: 825000,
    max_students: 1500,
    is_custom_price: false,
    description: 'The full platform for large schools.',
    features: [
      'Up to 1,500 students',
      'Everything in Premium',
      'Priority support',
      'Custom domain',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    price: 0,
    max_students: null,
    is_custom_price: true,
    description: 'Groups of schools and campuses above 1,500 students.',
    features: [
      '1,500+ students',
      'Everything in Elite',
      'Multi-campus setup',
      'Dedicated onboarding & support',
      'Custom domain',
    ],
  },
];

const POPULAR_SLUG = 'standard';

const naira = (value: number) => `₦${Math.round(value).toLocaleString('en-NG')}`;

export const PricingSection = () => {
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);

  useEffect(() => {
    // Prefer live plans (prices are managed in Super Admin); keep defaults if the API is slow or down.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    fetch('/api/proxy/schools/plans', { signal: controller.signal, cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setPlans(data);
      })
      .catch(() => {})
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
            Simple annual pricing
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            One price for the whole school year
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Priced per academic year (3 terms), based on your number of students. Pay once, or in
            three termly instalments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const price = Number(plan.price);
            const isPopular = plan.slug === POPULAR_SLUG;
            const isFree = !plan.is_custom_price && price === 0;
            return (
              <div
                key={plan.id}
                className={`relative p-8 rounded-3xl border-2 bg-white flex flex-col ${
                  isPopular ? 'border-brand-600 shadow-xl ring-4 ring-brand-100' : 'border-gray-100'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-600 text-white text-xs font-black uppercase tracking-widest rounded-full">
                    Most popular
                  </div>
                )}

                <h3 className="text-2xl font-black text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1 min-h-[40px]">{plan.description}</p>

                <div className="my-6">
                  {plan.is_custom_price ? (
                    <span className="text-4xl font-black text-gray-900">Custom</span>
                  ) : isFree ? (
                    <span className="text-4xl font-black text-gray-900">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-black text-gray-900">{naira(price)}</span>
                      <span className="text-gray-500 font-medium"> / year</span>
                      <div className="text-sm text-gray-500 mt-1">
                        or {naira(price / 3)} per term
                      </div>
                    </>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-brand-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.is_custom_price ? '/#contact' : `/onboarding?plan=${plan.slug}`}
                  className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors ${
                    isPopular
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.is_custom_price ? 'Contact sales' : isFree ? 'Start free' : 'Get started'}
                  <ArrowRight size={18} />
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-gray-500 mt-10">
          SMS and WhatsApp messages are billed separately as prepaid credits. Many schools cover
          their plan with a small termly ICT levy.
        </p>
      </div>
    </section>
  );
};
