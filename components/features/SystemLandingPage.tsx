'use client';

import React from 'react';
import Link from 'next/link';
import {
    BookOpen,
    Users,
    CreditCard,
    BarChart3,
    ShieldCheck,
    CheckCircle2,
    ArrowRight,
    School,
    Globe,
    Zap
} from 'lucide-react';
import { PricingSection } from './PricingSection';

export const SystemLandingPage = () => {
    return (
        <div className="min-h-screen bg-white font-primary selection:bg-brand-100 selection:text-brand-900">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-600/20">
                                <Globe size={24} />
                            </div>
                            <span className="text-2xl font-black text-gray-900 tracking-tight">EduSphere<span className="text-brand-600">.ng</span></span>
                        </div>

                        <div className="hidden md:flex items-center gap-8">
                            <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">Features</Link>
                            <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">Pricing</Link>
                            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">Log In</Link>
                            <Link href="/onboarding" className="px-5 py-2.5 bg-brand-900 text-white text-sm font-bold rounded-full hover:bg-brand-800 transition-all shadow-lg hover:shadow-brand-900/20 flex items-center gap-2">
                                Get Started <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden relative">
                <div className="absolute inset-0 z-0 opacity-30">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-bold uppercase tracking-wider mb-8 animate-in fade-in slide-in-from-bottom-4">
                        <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse"></span>
                        The #1 School Operating System in Nigeria
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-700">
                        Manage your school <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-purple-600">with ease & precision.</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                        EduSphere gives you everything you need to run a modern educational institution.
                        From admissions to alumni, we've got you covered.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        <Link href="/onboarding" className="w-full sm:w-auto px-8 py-4 bg-brand-600 text-white text-lg font-bold rounded-2xl hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/30 flex items-center justify-center gap-2">
                            Create Your School
                            <ArrowRight size={20} />
                        </Link>
                        <Link href="/demo" className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 border border-gray-200 text-lg font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                            View Demo
                            <Zap size={20} className="text-amber-500" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Everything you need</h2>
                        <p className="text-lg text-gray-500">Powerful modules integrated into one seamless platform.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Users}
                            title="Student Management"
                            desc="Comprehensive profiles, attendance tracking, and disciplinary records at your fingertips."
                            color="text-blue-600" bg="bg-blue-50"
                        />
                        <FeatureCard
                            icon={CreditCard}
                            title="Smart Finance"
                            desc="Automated fee collection, receipt generation, and expense tracking with financial reports."
                            color="text-green-600" bg="bg-green-50"
                        />
                        <FeatureCard
                            icon={BarChart3}
                            title="Academic Results"
                            desc="Automated grading, report card generation, and performance analytics for students."
                            color="text-purple-600" bg="bg-purple-50"
                        />
                        <FeatureCard
                            icon={BookOpen}
                            title="LMS & CBT"
                            desc="Computer Based Tests and Learning Management System for modern e-learning."
                            color="text-amber-600" bg="bg-amber-50"
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Role-Based Access"
                            desc="Secure portals for Admins, Teachers, Students, and Parents with specific permissions."
                            color="text-red-600" bg="bg-red-50"
                        />
                        <FeatureCard
                            icon={School}
                            title="Multi-School Support"
                            desc="Manage multiple campuses or branches from a single Super Admin dashboard."
                            color="text-brand-600" bg="bg-brand-50"
                        />
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <PricingSection />

            {/* CTA Section */}
            <section className="py-20 bg-brand-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-black mb-8">Ready to transform your school?</h2>
                    <p className="text-xl text-brand-100 mb-10 max-w-2xl mx-auto">
                        Join hundreds of forward-thinking schools using EduSphere to deliver world-class education.
                    </p>
                    <Link href="/onboarding" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-brand-900 text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-2xl">
                        Get Started for Free
                        <ArrowRight size={24} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-50 pt-20 pb-10 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        {/* Column 1: Brand */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                                    <Globe size={18} />
                                </div>
                                <span className="text-xl font-black text-gray-900 tracking-tight">EduSphere<span className="text-brand-600">.ng</span></span>
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                The complete operating system for modern schools in Nigeria. Simplify administration, enhance learning, and drive growth.
                            </p>
                        </div>

                        {/* Column 2: Product */}
                        <div>
                            <h4 className="font-bold text-gray-900 mb-6">Product</h4>
                            <ul className="space-y-4 text-sm text-gray-600">
                                <li><Link href="#features" className="hover:text-brand-600 transition-colors">Features</Link></li>
                                <li><Link href="#pricing" className="hover:text-brand-600 transition-colors">Pricing</Link></li>
                                <li><Link href="/demo" className="hover:text-brand-600 transition-colors">Request Demo</Link></li>
                                <li><Link href="/onboarding" className="hover:text-brand-600 transition-colors">Start for Free</Link></li>
                            </ul>
                        </div>

                        {/* Column 3: Resources */}
                        <div>
                            <h4 className="font-bold text-gray-900 mb-6">Resources</h4>
                            <ul className="space-y-4 text-sm text-gray-600">
                                <li><Link href="#" className="hover:text-brand-600 transition-colors">Help Center</Link></li>
                                <li><Link href="#" className="hover:text-brand-600 transition-colors">School Success Stories</Link></li>
                                <li><Link href="#" className="hover:text-brand-600 transition-colors">Blog</Link></li>
                                <li><Link href="#" className="hover:text-brand-600 transition-colors">Community</Link></li>
                            </ul>
                        </div>

                        {/* Column 4: Legal */}
                        <div>
                            <h4 className="font-bold text-gray-900 mb-6">Legal</h4>
                            <ul className="space-y-4 text-sm text-gray-600">
                                <li><Link href="#" className="hover:text-brand-600 transition-colors">Privacy Policy</Link></li>
                                <li><Link href="#" className="hover:text-brand-600 transition-colors">Terms of Service</Link></li>
                                <li><Link href="#" className="hover:text-brand-600 transition-colors">Cookie Policy</Link></li>
                                <li><Link href="#" className="hover:text-brand-600 transition-colors">Security</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-500">
                            &copy; {new Date().getFullYear()} EduSphere.ng. All rights reserved.
                        </p>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                            <span>Designed and developed by</span>
                            <a
                                href="https://getboldideas.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-brand-700 hover:text-brand-900 transition-colors flex items-center gap-1"
                            >
                                Bold Ideas Innovations Ltd.
                                <Zap size={12} className="fill-current" />
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

function FeatureCard({ icon: Icon, title, desc, color, bg }: any) {
    return (
        <div className="group p-8 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-brand-900/5 hover:-translate-y-1 transition-all">
            <div className={`w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <Icon size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-500 leading-relaxed">{desc}</p>
        </div>
    );
}
