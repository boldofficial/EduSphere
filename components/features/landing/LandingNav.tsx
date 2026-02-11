/**
 * Landing Navigation
 *
 * Fixed top navbar with mobile menu support and scroll-progress bar.
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import { ArrowRight, Menu, X, School } from 'lucide-react';

interface LandingNavProps {
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
}

const navItems = [
    { id: 'home', label: 'Home', href: '#home' },
    { id: 'features', label: 'Features', href: '#features' },
    { id: 'about', label: 'About Us', href: '#about' },
    { id: 'testimonials', label: 'Testimonials', href: '#testimonials' },
    { id: 'pricing', label: 'Pricing', href: '#pricing' },
    { id: 'faq', label: 'FAQ', href: '#faq' },
    { id: 'contact', label: 'Contact', href: '#contact' },
];

export const LandingNav: React.FC<LandingNavProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
    const { scrollYProgress } = useScroll();

    return (
        <>
            {/* Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-600 to-purple-600 z-50 origin-left"
                style={{ scaleX: scrollYProgress }}
            />

            {/* Navigation */}
            <motion.nav
                className="fixed w-full z-40 transition-all duration-500 bg-white shadow-xl border-b border-gray-100/50"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <motion.div
                            className="flex items-center gap-3"
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                            <div className="h-16">
                                <img src="/full-logo.png" alt="Registra" className="h-full w-auto object-contain" />
                            </div>
                        </motion.div>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center gap-8">
                            {navItems.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className="text-sm font-medium transition-all duration-300 hover:text-brand-600 relative group text-gray-700"
                                >
                                    {item.label}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-brand-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
                                </Link>
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="hidden md:flex items-center gap-4">
                            <Link
                                href="/login"
                                className="px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 text-gray-700 hover:text-brand-600 border border-gray-200 hover:border-brand-300"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/onboarding"
                                className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-purple-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-brand-600/30 transition-all duration-300 flex items-center gap-2 group"
                            >
                                Get Started Free
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 rounded-xl transition-colors text-gray-700 hover:bg-gray-100"
                            aria-label="Toggle mobile menu"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100/50 shadow-xl"
                        >
                            <div className="px-4 py-6 space-y-4">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-3 text-gray-700 hover:text-brand-600 font-medium transition-colors border-b border-gray-50 last:border-0"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                                <div className="pt-4 space-y-3">
                                    <Link
                                        href="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block w-full text-center py-3 text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/onboarding"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block w-full text-center py-3 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                                    >
                                        Get Started Free
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>
        </>
    );
};
