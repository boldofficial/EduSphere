'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
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
    Zap,
    Menu,
    X,
    Star,
    Play,
    ChevronDown,
    Phone,
    Mail,
    MapPin,
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    Award,
    Target,
    Clock,
    TrendingUp,
    Heart,
    Sparkles,
    Check,
    MessageCircle,
    Calendar,
    FileText,
    PieChart,
    Settings,
    UserCheck,
    GraduationCap,
    Building2,
    Lightbulb,
    Rocket,
    Quote,
    ArrowUpRight
} from 'lucide-react';
import { PricingSection } from './PricingSection';

export const SystemLandingPage = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { scrollYProgress } = useScroll();
    const router = useRouter();

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

            // Optional: Store non-sensitive user profile data if needed by some legacy components
            if (data.user) {
                localStorage.setItem('user_data', JSON.stringify(data.user));
            }

            // Hard redirect to dashboard to trigger full state refresh.
            // The middleware will now see the cookies set by /api/auth/demo-login
            window.location.href = '/dashboard';
        } catch (error) {
            console.error('Demo login error:', error);
            alert('Failed to enter demo mode. Please try again.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { id: 'home', label: 'Home', href: '#home' },
        { id: 'features', label: 'Features', href: '#features' },
        { id: 'how-it-works', label: 'How It Works', href: '#how-it-works' },
        { id: 'testimonials', label: 'Testimonials', href: '#testimonials' },
        { id: 'pricing', label: 'Pricing', href: '#pricing' },
        { id: 'faq', label: 'FAQ', href: '#faq' },
        { id: 'contact', label: 'Contact', href: '#contact' },
    ];

    return (
        <div className="min-h-screen bg-white font-primary selection:bg-brand-100 selection:text-brand-900 overflow-x-hidden">
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

            {/* Hero Section */}
            <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-12 lg:pt-40 lg:pb-20">
                {/* Background Image with Cinematic Overlay */}
                <div className="absolute inset-0 z-0 scale-105">
                    <motion.div
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: "url('/hero-bg.png')" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-950/80 via-brand-950/60 to-brand-950/90" />
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-950/40 via-transparent to-brand-950/40" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-center lg:text-left"
                        >

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-brand-100 text-brand-900 text-sm font-bold mb-8 shadow-sm"
                            >
                                <Sparkles size={16} className="text-brand-600" />
                                The operating system for modern schools
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 1 }}
                                className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-8 leading-[1.05]"
                            >
                                All-in-One School Management System
                                <span className="block text-accent-500 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                                    for Modern Schools
                                </span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.8 }}
                                className="text-xl md:text-2xl text-brand-100/90 mb-12 max-w-2xl leading-relaxed font-medium"
                            >
                                Registra is the operating system that unifies academics, finance, communication, and administration on one powerful platform.
                            </motion.p>



                            {/* CTA Buttons */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.0, duration: 0.6 }}
                                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                            >
                                <Link
                                    href="/onboarding"
                                    className="px-8 py-4 bg-gradient-to-r from-brand-600 to-purple-600 text-white text-lg font-bold rounded-2xl hover:shadow-xl hover:shadow-brand-600/30 transition-all duration-300 flex items-center justify-center gap-2 group"
                                >
                                    Start Free Trial
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <button
                                    onClick={() => setIsDemoModalOpen(true)}
                                    className="px-8 py-4 bg-white border-2 border-brand-200 text-brand-700 text-lg font-bold rounded-2xl hover:border-brand-600 hover:bg-brand-50 transition-all duration-300 flex items-center justify-center gap-2 group"
                                >
                                    <Rocket size={20} className="text-brand-600 group-hover:animate-bounce" />
                                    Try Live Demo
                                </button>
                                <Link
                                    href="#demo"
                                    className="px-8 py-4 bg-gray-50 border border-gray-200 text-gray-700 text-lg font-bold rounded-2xl hover:border-gray-300 hover:bg-white transition-all duration-300 flex items-center justify-center gap-2 group"
                                >
                                    <Play size={20} />
                                    Watch Intro
                                </Link>
                            </motion.div>
                        </motion.div>

                        {/* Hero Visual */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="relative">
                                {/* Main Dashboard Mockup */}
                                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white">
                                                <School size={20} />
                                            </div>
                                            <span className="font-bold text-gray-900">Registra Dashboard</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                        </div>
                                    </div>

                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                                            <Users size={24} className="text-blue-600 mb-2" />
                                            <div className="text-2xl font-bold text-gray-900">1,247</div>
                                            <div className="text-sm text-gray-600">Students</div>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                                            <TrendingUp size={24} className="text-green-600 mb-2" />
                                            <div className="text-2xl font-bold text-gray-900">94.2%</div>
                                            <div className="text-sm text-gray-600">Attendance</div>
                                        </div>
                                    </div>

                                    {/* Chart Placeholder */}
                                    <div className="bg-gray-50 rounded-xl p-4 h-32 flex items-center justify-center">
                                        <BarChart3 size={48} className="text-gray-400" />
                                    </div>
                                </div>

                                {/* Floating Elements */}
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100"
                                >
                                    <CheckCircle2 size={32} className="text-green-500" />
                                </motion.div>

                                <motion.div
                                    animate={{ y: [0, 10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100"
                                >
                                    <Award size={32} className="text-purple-500" />
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                >
                    <ChevronDown size={32} className="text-gray-400" />
                </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-gradient-to-br from-gray-50 via-white to-brand-50/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-100 text-brand-700 text-sm font-bold mb-6">
                            <Target size={16} />
                            Powerful Features
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                            Everything Your School Needs
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Comprehensive modules designed to streamline every aspect of school management, from enrollment to graduation.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Users,
                                title: "Student Management",
                                desc: "Holistic 360° profiles tracking academic progress, health records, behavioral history, and extracurricular achievements in one unified view.",
                                color: "from-blue-500 to-blue-600",
                                bg: "bg-blue-50"
                            },
                            {
                                icon: CreditCard,
                                title: "Smart Finance",
                                desc: "Automated fee reconciliation, intelligent debt recovery tools, and seamless multi-channel payment gateway integration.",
                                color: "from-green-500 to-emerald-600",
                                bg: "bg-green-50"
                            },
                            {
                                icon: BarChart3,
                                title: "Academic Analytics",
                                desc: "High-speed Result Engine with psychometric analysis, comparative cohort tracking, and automated report card generation.",
                                color: "from-purple-500 to-purple-600",
                                bg: "bg-purple-50"
                            },
                            {
                                icon: BookOpen,
                                title: "Hybrid LMS & CBT",
                                desc: "Offline-first learning tools, extensive question bank support for CBT, and seamless hybrid classroom management.",
                                color: "from-amber-500 to-orange-600",
                                bg: "bg-amber-50"
                            },
                            {
                                icon: ShieldCheck,
                                title: "Bank-Grade Security",
                                desc: "Enterprise-level data protection with granular role-based access control, comprehensive audit logs, and 2FA support.",
                                color: "from-red-500 to-rose-600",
                                bg: "bg-red-50"
                            },
                            {
                                icon: Building2,
                                title: "Multi-School Support",
                                desc: "Centralized franchise management for school chains, allowing headquarters to monitor performance across all branches.",
                                color: "from-indigo-500 to-blue-600",
                                bg: "bg-indigo-50"
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="group relative"
                            >
                                <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100/50 h-full relative overflow-hidden">
                                    {/* Decorative Gradient Blob */}
                                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-5 rounded-bl-full group-hover:scale-125 transition-transform duration-700`} />

                                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                                        <feature.icon size={32} />
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-brand-600 transition-colors relative z-10">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed relative z-10">
                                        {feature.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-bold mb-6">
                            <Lightbulb size={16} />
                            Simple Process
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                            Get Started in Minutes
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Our streamlined onboarding process gets your school up and running quickly, with expert support every step of the way.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            {
                                step: "01",
                                title: "Sign Up",
                                desc: "Create your account and tell us about your school in our quick onboarding form.",
                                icon: UserCheck
                            },
                            {
                                step: "02",
                                title: "Setup",
                                desc: "Import your data or start fresh. We'll guide you through configuring your school settings.",
                                icon: Settings
                            },
                            {
                                step: "03",
                                title: "Customize",
                                desc: "Personalize your school's branding, add staff, and set up your academic structure.",
                                icon: Sparkles
                            },
                            {
                                step: "04",
                                title: "Launch",
                                desc: "Go live with your new school management system and start transforming education.",
                                icon: Rocket
                            }
                        ].map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                viewport={{ once: true }}
                                className="text-center relative"
                            >
                                <div className="relative mb-8">
                                    <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black mx-auto shadow-lg">
                                        {step.step}
                                    </div>
                                    {index < 3 && (
                                        <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-brand-200 to-purple-200 -translate-y-1/2" style={{ width: 'calc(100vw / 4 - 5rem)' }}></div>
                                    )}
                                </div>
                                <div className="w-16 h-16 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 mx-auto mb-6">
                                    <step.icon size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-24 bg-gradient-to-br from-brand-900 via-purple-900 to-brand-800 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-bold mb-6">
                            <Heart size={16} />
                            Success Stories
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black mb-6">
                            Trusted by Leading Schools
                        </h2>
                        <p className="text-xl text-brand-100 max-w-3xl mx-auto">
                            See how schools across Nigeria are transforming their operations with Registra.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                quote: "Registra has revolutionized how we manage our school. The automation features have saved us countless hours, and our parents love the transparency.",
                                author: "Mrs. Adebayo",
                                role: "Principal",
                                school: "Lagos International School",
                                rating: 5
                            },
                            {
                                quote: "The financial management module is incredible. We've eliminated billing errors and improved our cash flow significantly.",
                                author: "Mr. Okon",
                                role: "Business Manager",
                                school: "Federal Government College",
                                rating: 5
                            },
                            {
                                quote: "Our teachers love the LMS features, and student performance has improved dramatically with the analytics tools.",
                                author: "Dr. Ibrahim",
                                role: "Academic Director",
                                school: "Nigerian Turkish International School",
                                rating: 5
                            }
                        ].map((testimonial, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                viewport={{ once: true }}
                                className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20"
                            >
                                <Quote size={32} className="text-brand-300 mb-4" />
                                <p className="text-white/90 text-lg leading-relaxed mb-6">
                                    "{testimonial.quote}"
                                </p>
                                <div className="flex items-center gap-1 mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <div>
                                    <div className="font-bold text-white">{testimonial.author}</div>
                                    <div className="text-brand-200 text-sm">{testimonial.role}</div>
                                    <div className="text-brand-300 text-sm">{testimonial.school}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <PricingSection />

            {/* FAQ Section */}
            <section id="faq" className="py-24 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-6">
                            <MessageCircle size={16} />
                            Frequently Asked Questions
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                            Got Questions?
                        </h2>
                        <p className="text-xl text-gray-600">
                            Find answers to common questions about Registra.
                        </p>
                    </motion.div>

                    <div className="space-y-6">
                        {[
                            {
                                question: "How long does it take to set up Registra for my school?",
                                answer: "Most schools are up and running within 1-2 weeks. Our onboarding team provides personalized guidance throughout the process."
                            },
                            {
                                question: "Can I import my existing student and staff data?",
                                answer: "Yes! We support CSV imports and can help migrate data from most existing school management systems."
                            },
                            {
                                question: "Is my school's data secure?",
                                answer: "Absolutely. We use bank-level encryption, regular security audits, and comply with Nigerian data protection regulations."
                            },
                            {
                                question: "What kind of support do you provide?",
                                answer: "We offer 24/7 technical support, comprehensive documentation, video tutorials, and dedicated account managers for enterprise clients."
                            },
                            {
                                question: "Can I try Registra before committing?",
                                answer: "Yes! We offer a 30-day free trial with full access to all features. No credit card required to get started."
                            }
                        ].map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
                            >
                                <h3 className="text-xl font-bold text-gray-900 mb-4">{faq.question}</h3>
                                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-bold mb-6">
                            <Phone size={16} />
                            Get In Touch
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                            Ready to Transform Your School?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Join hundreds of schools already using Registra. Let's discuss how we can help your institution thrive.
                        </p>
                    </motion.div>

                    <div className="grid lg:grid-cols-2 gap-16">
                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100"
                        >
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h3>
                            <form className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                                        placeholder="john@school.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                                        placeholder="Your School Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all resize-none"
                                        placeholder="Tell us about your school and how we can help..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-4 bg-gradient-to-r from-brand-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-brand-600/30 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    Send Message
                                    <ArrowRight size={20} />
                                </button>
                            </form>
                        </motion.div>

                        {/* Contact Info */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 flex-shrink-0">
                                            <Phone size={24} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">Phone</div>
                                            <div className="text-gray-600">+234 800 REGISTRA</div>
                                            <div className="text-sm text-gray-500">Mon-Fri 9AM-6PM WAT</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 flex-shrink-0">
                                            <Mail size={24} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">Email</div>
                                            <div className="text-gray-600">hello@myregistra.net</div>
                                            <div className="text-sm text-gray-500">We'll respond within 24 hours</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 flex-shrink-0">
                                            <MapPin size={24} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">Office</div>
                                            <div className="text-gray-600">Lagos, Nigeria</div>
                                            <div className="text-sm text-gray-500">Serving schools nationwide</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Social Links */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-4">Follow Us</h4>
                                <div className="flex gap-4">
                                    {[
                                        { icon: Facebook, href: '#' },
                                        { icon: Twitter, href: '#' },
                                        { icon: Instagram, href: '#' },
                                        { icon: Youtube, href: '#' }
                                    ].map((social, index) => (
                                        <a
                                            key={index}
                                            href={social.href}
                                            className="w-12 h-12 bg-gray-100 hover:bg-brand-100 rounded-xl flex items-center justify-center text-gray-600 hover:text-brand-600 transition-colors"
                                        >
                                            <social.icon size={20} />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                        {/* Brand Column */}
                        <div className="space-y-6">
                            <div className="h-20 mb-6">
                                <img src="/footer-logo.png" alt="Registra" className="h-full w-auto object-contain" />
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                The complete school management platform for modern Nigerian educational institutions. Streamlining administration, enhancing learning, and driving academic excellence.
                            </p>
                            <div className="flex gap-4">
                                {[
                                    { icon: Facebook, href: '#' },
                                    { icon: Twitter, href: '#' },
                                    { icon: Instagram, href: '#' },
                                    { icon: Youtube, href: '#' }
                                ].map((social, index) => (
                                    <a
                                        key={index}
                                        href={social.href}
                                        className="w-10 h-10 bg-gray-800 hover:bg-brand-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                    >
                                        <social.icon size={18} />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Product Column */}
                        <div>
                            <h4 className="font-bold text-white mb-6">Product</h4>
                            <ul className="space-y-4 text-sm text-gray-400">
                                <li><Link href="#features" className="hover:text-brand-400 transition-colors">Features</Link></li>
                                <li><Link href="#pricing" className="hover:text-brand-400 transition-colors">Pricing</Link></li>
                                <li><Link href="#demo" className="hover:text-brand-400 transition-colors">Request Demo</Link></li>
                                <li><Link href="/onboarding" className="hover:text-brand-400 transition-colors">Get Started</Link></li>
                                <li><Link href="/login" className="hover:text-brand-400 transition-colors">Sign In</Link></li>
                            </ul>
                        </div>

                        {/* Resources Column */}
                        <div>
                            <h4 className="font-bold text-white mb-6">Resources</h4>
                            <ul className="space-y-4 text-sm text-gray-400">
                                <li><Link href="/help" className="hover:text-brand-400 transition-colors">Help Center</Link></li>
                                <li><Link href="/success-stories" className="hover:text-brand-400 transition-colors">School Success Stories</Link></li>
                                <li><Link href="/blog" className="hover:text-brand-400 transition-colors">Blog</Link></li>
                                <li><Link href="/resources" className="hover:text-brand-400 transition-colors">Video Tutorials</Link></li>
                                <li><Link href="/developers" className="hover:text-brand-400 transition-colors">API Documentation</Link></li>
                            </ul>
                        </div>

                        {/* Company Column */}
                        <div>
                            <h4 className="font-bold text-white mb-6">Company</h4>
                            <ul className="space-y-4 text-sm text-gray-400">
                                <li><Link href="/#about" className="hover:text-brand-400 transition-colors">About Us</Link></li>
                                <li><Link href="/careers" className="hover:text-brand-400 transition-colors">Careers</Link></li>
                                <li><Link href="/#contact" className="hover:text-brand-400 transition-colors">Contact</Link></li>
                                <li><Link href="/privacy-policy" className="hover:text-brand-400 transition-colors">Privacy Policy</Link></li>
                                <li><Link href="/terms-of-service" className="hover:text-brand-400 transition-colors">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-400">
                            &copy; {new Date().getFullYear()} Registra. All rights reserved.
                        </p>
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                            <span>Powered by</span>
                            <a
                                href="https://getboldideas.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
                            >
                                Bold Ideas Innovations Ltd.
                                <Zap size={12} className="fill-current" />
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
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
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-bl-full -z-1" />

                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 mb-2">Explore Registra</h2>
                                    <p className="text-gray-600">Choose a role to experience the platform as a professional.</p>
                                </div>
                                <button
                                    onClick={() => setIsDemoModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <X size={24} className="text-gray-400" />
                                </button>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-6">
                                {[
                                    {
                                        id: 'admin',
                                        role: 'School Admin',
                                        desc: 'Manage everything',
                                        icon: ShieldCheck,
                                        color: 'text-brand-600',
                                        bg: 'bg-brand-50'
                                    },
                                    {
                                        id: 'teacher',
                                        role: 'Teacher',
                                        desc: 'Manage classes & results',
                                        icon: GraduationCap,
                                        color: 'text-purple-600',
                                        bg: 'bg-purple-50'
                                    },
                                    {
                                        id: 'student',
                                        role: 'Student / Parent',
                                        desc: 'View records & learning',
                                        icon: Users,
                                        color: 'text-green-600',
                                        bg: 'bg-green-50'
                                    }
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
