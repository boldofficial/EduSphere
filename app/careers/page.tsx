'use client';

import React from 'react';
import { Briefcase, Heart, Globe, Rocket, CheckCircle2 } from 'lucide-react';
import { SystemPageLayout } from '@/components/features/SystemPageLayout';
import * as Utils from '@/lib/utils';

export default function CareersPage() {
    return (
        <SystemPageLayout>
            <main className="flex-grow pt-24">
                {/* Hero */}
                <div className="bg-brand-900 text-white py-24 px-4 text-center">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <span className="inline-block py-2 px-4 bg-white/10 rounded-full text-accent-400 font-bold text-sm tracking-widest uppercase mb-4">Join our team</span>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8">
                            Build the future of <br /><span className="text-accent-500">Education</span>
                        </h1>
                        <p className="text-xl text-brand-100 max-w-2xl mx-auto leading-relaxed">
                            We are on a mission to digitize every school in Africa. If you are passionate about impact, engineering, and education, you belong here.
                        </p>
                    </div>
                </div>

                {/* Values Section */}
                <div className="py-24 px-4 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-black text-gray-900 mb-4">Why Registra?</h2>
                            <p className="text-gray-500 max-w-2xl mx-auto">We offer more than just a job. We offer a chance to make a tangible difference in the lives of millions of students.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <ValueCard
                                icon={Globe}
                                title="Impact First"
                                description="Every line of code you write helps a student learn better or a school run smoother."
                            />
                            <ValueCard
                                icon={Rocket}
                                title="Growth Mindset"
                                description="We invest heavily in your professional development. Learn, fail, and grow with us."
                            />
                            <ValueCard
                                icon={Heart}
                                title="Inclusive Culture"
                                description="We value diversity of thought and background. Your unique perspective is your superpower."
                            />
                        </div>
                    </div>
                </div>

                {/* Open Positions */}
                <div className="py-24 px-4 bg-gray-50 border-t border-gray-200">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-3xl font-black text-gray-900 mb-12">Open Positions</h2>

                        <div className="space-y-4">
                            <JobCard
                                title="Senior Full Stack Engineer"
                                department="Engineering"
                                location="Remote (Lagos)"
                                type="Full-time"
                            />
                            <JobCard
                                title="Product Designer (UI/UX)"
                                department="Design"
                                location="Remote"
                                type="Full-time"
                            />
                            <JobCard
                                title="Customer Success Manager"
                                department="Operations"
                                location="Abuja"
                                type="Full-time"
                            />
                            <JobCard
                                title="Sales Representative"
                                department="Growth"
                                location="Lagos"
                                type="Contract"
                            />
                        </div>

                        <div className="mt-12 text-center text-gray-500">
                            <p>Don't see your role? <a href="mailto:careers@myregistra.net" className="text-brand-600 font-bold hover:underline">Email us your CV</a> anytime.</p>
                        </div>
                    </div>
                </div>
            </main>
        </SystemPageLayout>
    );
}

function ValueCard({ icon: Icon, title, description }: any) {
    return (
        <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="text-gray-500 leading-relaxed">{description}</p>
        </div>
    );
}

function JobCard({ title, department, location, type }: any) {
    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-200 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors mb-1">{title}</h3>
                <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Briefcase size={12} /> {department}</span>
                    <span>•</span>
                    <span>{location}</span>
                </div>
            </div>
            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase tracking-tight">
                    {type}
                </span>
                <span className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 group-hover:bg-brand-600 group-hover:text-white group-hover:border-brand-600 transition-all">
                    <ArrowRight size={16} />
                </span>
            </div>
        </div>
    );
}

import { ArrowRight } from 'lucide-react';
