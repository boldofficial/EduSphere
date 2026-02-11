/**
 * SystemLandingPage
 *
 * Main landing page. Composes section components and manages shared state
 * (mobile menu, demo modal).
 */
'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    X, ShieldCheck, GraduationCap, Users, Zap
} from 'lucide-react';
import { PricingSection } from './PricingSection';
import { LandingNav } from './landing/LandingNav';
import { LandingHero } from './landing/LandingHero';
import { FeaturesSection, HowItWorksSection, TestimonialsSection, FAQSection } from './landing/LandingSections';
import { ContactSection, LandingFooter } from './landing/LandingContactFooter';

export const SystemLandingPage = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleDemoLogin = async (role: 'admin' | 'teacher' | 'student') => {
        setIsLoggingIn(true);
        try {
            const response = await fetch('/api/auth/demo-login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role })
            });

            if (!response.ok) throw new Error('Demo login failed');

            const data = await response.json();

            if (data.user) {
                localStorage.setItem('user_data', JSON.stringify(data.user));
            }

            window.location.href = '/dashboard';
        } catch (error) {
            console.error('Demo login error:', error);
            alert('Failed to enter demo mode. Please try again.');
        } finally {
            setIsLoggingIn(false);
        }
    };

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

            {/* Demo Access Modal */}
            <AnimatePresence>
                {isDemoModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDemoModalOpen(false)}
                            className="absolute inset-0 bg-brand-950/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-bl-full -z-1" />

                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 mb-2">Explore Registra</h2>
                                    <p className="text-gray-600">Choose a role to experience the platform as a professional.</p>
                                </div>
                                <button onClick={() => setIsDemoModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                    <X size={24} className="text-gray-400" />
                                </button>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-6">
                                {[
                                    { id: 'admin', role: 'School Admin', desc: 'Manage everything', icon: ShieldCheck, color: 'text-brand-600', bg: 'bg-brand-50' },
                                    { id: 'teacher', role: 'Teacher', desc: 'Manage classes & results', icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' },
                                    { id: 'student', role: 'Student / Parent', desc: 'View records & learning', icon: Users, color: 'text-green-600', bg: 'bg-green-50' }
                                ].map((role) => (
                                    <button
                                        key={role.id}
                                        disabled={isLoggingIn}
                                        onClick={() => handleDemoLogin(role.id as any)}
                                        className="group p-6 rounded-2xl border-2 border-gray-100 hover:border-brand-500 hover:bg-brand-50/30 transition-all duration-300 text-left flex flex-col items-start gap-4"
                                    >
                                        <div className={`w-12 h-12 ${role.bg} ${role.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            <role.icon size={24} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{role.role}</div>
                                            <div className="text-xs text-gray-500 mt-1">{role.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Zap size={14} className="text-amber-500" />
                                    No signup required for demo
                                </span>
                                <span className="text-brand-600 font-bold">Try Bold Ideas Innovations School</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
