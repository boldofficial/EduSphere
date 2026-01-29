'use client';

import React from 'react';
import { Quote, TrendingUp, Users, Award } from 'lucide-react';
import SiteHeader from '@/components/features/SiteHeader';
import SiteFooter from '@/components/features/SiteFooter';
import * as Utils from '@/lib/utils';

export default function SuccessStoriesPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-primary">
            <SiteHeader settings={Utils.INITIAL_SETTINGS} />

            <main className="flex-grow pt-24">
                {/* Hero */}
                <div className="bg-brand-950 text-white py-24 px-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5">
                        <Award size={400} />
                    </div>
                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="max-w-3xl">
                            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                                Empowering Schools to <span className="text-accent-500">Exceed Expectations</span>
                            </h1>
                            <p className="text-xl text-brand-100 max-w-2xl leading-relaxed">
                                Discover how innovative schools across Africa are transforming their operations and academic results with Registra.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Case Study 1 */}
                <section className="py-24 px-4 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-16 items-center">
                            <div className="w-full md:w-1/2">
                                <div className="aspect-video bg-gray-200 rounded-3xl overflow-hidden shadow-2xl skew-x-1 hover:skew-x-0 transition-transform duration-500">
                                    <img
                                        src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                                        alt="University Campus"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-1/2 space-y-8">
                                <div className="bg-brand-50 p-6 rounded-3xl border border-brand-100 relative">
                                    <Quote className="absolute top-6 left-6 text-brand-200" size={48} />
                                    <p className="relative z-10 text-xl font-bold text-brand-900 leading-relaxed italic">
                                        "Registra completely automated our admissions process. We went from handling thousands of paper forms to a fully digital workflow in weeks."
                                    </p>
                                    <div className="mt-6 flex items-center gap-4">
                                        <div className="h-12 w-12 bg-brand-200 rounded-full"></div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">Dr. Amina Yusuf</h4>
                                            <p className="text-sm text-gray-500">Director, Vine Heritage College</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <StatBox label="Time Saved" value="85%" />
                                    <StatBox label="Revenue Increase" value="30%" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Case Study 2 */}
                <section className="py-24 px-4 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row-reverse gap-16 items-center">
                            <div className="w-full md:w-1/2">
                                <div className="aspect-video bg-gray-200 rounded-3xl overflow-hidden shadow-2xl -skew-x-1 hover:skew-x-0 transition-transform duration-500">
                                    <img
                                        src="https://images.unsplash.com/photo-1544531586-fde5298cdd40?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                                        alt="Happy Students"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-1/2 space-y-8">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 mb-4">Greenfield International</h2>
                                    <p className="text-gray-600 text-lg leading-relaxed">
                                        Facing challenges with fee collection and tracking, Greenfield turned to Registra's financial module. The result was improved cash flow and transparent reporting for parents.
                                    </p>
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm text-center">
                                        <TrendingUp className="mx-auto text-green-500 mb-2" />
                                        <p className="font-bold text-gray-900">99% Collections</p>
                                    </div>
                                    <div className="p-4 bg-white rounded-2xl shadow-sm text-center">
                                        <Users className="mx-auto text-blue-500 mb-2" />
                                        <p className="font-bold text-gray-900">Happy Parents</p>
                                    </div>
                                    <div className="p-4 bg-white rounded-2xl shadow-sm text-center">
                                        <Award className="mx-auto text-orange-500 mb-2" />
                                        <p className="font-bold text-gray-900">Zero Errors</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <div className="py-24 px-4 bg-white text-center">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl font-black text-gray-900 mb-6">Ready to write your success story?</h2>
                        <a href="/onboarding" className="inline-block px-10 py-5 bg-brand-600 text-white font-black text-lg rounded-2xl shadow-xl hover:scale-105 transition-transform">
                            Join Registra Today
                        </a>
                    </div>
                </div>
            </main>

            <SiteFooter settings={Utils.INITIAL_SETTINGS} />
        </div>
    );
}

function StatBox({ label, value }: any) {
    return (
        <div>
            <p className="text-4xl font-black text-brand-600 mb-1">{value}</p>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        </div>
    );
}
