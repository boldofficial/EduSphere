'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
    Award,
    BookOpen,
    Shield,
    Heart,
    Phone,
    Mail,
    MapPin,
    ArrowRight,
    Star,
    CheckCircle,
    Building,
    ChevronDown,
    Sparkles,
    Target,
    Cross,
    Globe,
    Users,
    GraduationCap,
    Clock,
    Send,
    Loader2
} from 'lucide-react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

interface LandingPageProps {
    settings: {
        school_name: string;
        school_tagline: string;
        school_address: string;
        school_email: string;
        school_phone: string;
        logo_media: string | null;
        landing_hero_title: string;
        landing_hero_subtitle: string;
        landing_features: string;
        landing_hero_image: string | null;
        landing_about_text: string;
        landing_primary_color: string;
        landing_show_stats: boolean;
        landing_cta_text: string;
    };
    stats: {
        studentsCount: number;
        teachersCount: number;
        classesCount: number;
    };
}

// Animated Counter Component
const AnimatedCounter = ({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) => {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        let startTime: number;
        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [isVisible, target, duration]);

    return <div ref={ref} className="tabular-nums">{count}{suffix}</div>;
};

// Feature Icon Component Helper
const getFeatureIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('faith') || lowerName.includes('biblical')) return Cross;
    if (lowerName.includes('academic') || lowerName.includes('excellence')) return Award;
    if (lowerName.includes('teacher') || lowerName.includes('expert') || lowerName.includes('staff')) return Users;
    if (lowerName.includes('facilit') || lowerName.includes('modern')) return Building;
    if (lowerName.includes('safe') || lowerName.includes('secure')) return Shield;
    if (lowerName.includes('holistic') || lowerName.includes('develop')) return Heart;
    if (lowerName.includes('afford') || lowerName.includes('fee')) return CheckCircle;
    return Star;
};

// Core Value Card Component
const CoreValueCard = ({ icon: Icon, title, description, delay }: { icon: React.ElementType; title: string; description: string; delay: string }) => (
    <div
        className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 relative overflow-hidden"
        style={{ animationDelay: delay }}
    >
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon size={120} />
        </div>
        <div className="h-14 w-14 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 mb-6 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300">
            <Icon size={28} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-brand-600 transition-colors">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ settings, stats }) => {
    const features = (settings.landing_features || '').split(',').map(f => f.trim()).filter(f => f);

    // Contact form state
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [formMessage, setFormMessage] = useState('');

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus('loading');
        setFormMessage('');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactForm)
            });

            const data = await response.json();

            if (response.ok) {
                setFormStatus('success');
                setFormMessage(data.message || 'Message sent successfully!');
                setContactForm({ name: '', email: '', phone: '', subject: '', message: '' });
            } else {
                setFormStatus('error');
                setFormMessage(data.error || 'Failed to send message. Please try again.');
            }
        } catch {
            setFormStatus('error');
            setFormMessage('Network error. Please check your connection and try again.');
        }
    };

    return (
        <div className="min-h-screen bg-white overflow-x-hidden font-sans">
            <SiteHeader settings={settings} />

            {/* ===================== HERO SECTION ===================== */}
            <section id="home" className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-brand-950/80 z-10"></div>
                    <img
                        src="/hero1.jpg"
                        alt="School Campus"
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
                    {/* School Logo */}
                    <div className="mx-auto mb-8 w-28 h-28 bg-white rounded-2xl shadow-2xl p-3 flex items-center justify-center">
                        {settings.logo_media ? (
                            <img src={settings.logo_media} alt="School Logo" className="w-full h-full object-contain" />
                        ) : (
                            <GraduationCap size={48} className="text-brand-600" />
                        )}
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
                        {settings.school_name || "Fruitful Vine Heritage Schools"}
                    </h1>

                    {/* Tagline */}
                    <p className="text-xl md:text-2xl text-accent-400 font-semibold italic mb-6">
                        {settings.school_tagline || "...reaching the highest height"}
                    </p>

                    {/* Description */}
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                        A faith-based school dedicated to nurturing academic excellence, moral integrity, and godly character in every child.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/admission"
                            className="px-8 py-4 bg-accent-500 hover:bg-accent-400 text-brand-950 text-lg font-bold rounded-lg transition-all shadow-lg hover:shadow-accent-500/30 flex items-center justify-center gap-2 group"
                        >
                            Apply for Admission
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/dashboard"
                            className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-lg font-bold rounded-lg transition-all border border-white/20"
                        >
                            Parent/Student Portal
                        </Link>
                    </div>
                </div>
            </section>

            {/* Decorative Curved Divider */}
            <div className="relative -mt-16 z-30">
                <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                    <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="white" />
                </svg>
            </div>

            {/* ===================== SECTION 3: ABOUT (Split) ===================== */}
            <section id="about" className="py-24 bg-white relative overflow-hidden -mt-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        {/* Image Composition - Two Images */}
                        <div className="relative">
                            {/* Main Image */}
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                                <img src="/fruitful1.jpg.jpg" alt="Students Learning" className="w-full h-80 object-cover" />
                            </div>
                            {/* Secondary Image - Overlapping */}
                            <div className="absolute -bottom-12 -right-8 w-2/3 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                                <img src="/fruitfulnew.jpg" alt="School Activities" className="w-full h-48 object-cover" />
                            </div>
                            {/* Decorative Background */}
                            <div className="absolute top-8 left-8 w-full h-full bg-brand-100 rounded-3xl -z-10"></div>
                        </div>

                        {/* Content */}
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-sm font-bold tracking-wide mb-6">
                                <span className="w-2 h-2 rounded-full bg-brand-600"></span>
                                WHO WE ARE
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                                A Tradition of Excellence & <span className="text-brand-600">Godly Values</span>
                            </h2>
                            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                {settings.landing_about_text || "Fruitful Vine Heritage Schools provides a comprehensive education that balances academic rigour with spiritual growth. We are dedicated to raising children who are not only intellectually sound but also morally upright."}
                            </p>

                            <div className="grid sm:grid-cols-2 gap-8 mb-10">
                                <div className="flex gap-4">
                                    <div className="shrink-0 h-10 w-10 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 mt-1">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Holistic Education</h4>
                                        <p className="text-sm text-gray-500 mt-1">Focusing on the total child: spirit, soul, and body.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="shrink-0 h-10 w-10 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 mt-1">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Expert Faculty</h4>
                                        <p className="text-sm text-gray-500 mt-1">Qualified & experienced teachers who mentor.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="shrink-0 h-10 w-10 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 mt-1">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Safe Environment</h4>
                                        <p className="text-sm text-gray-500 mt-1">Secure, conducive learning atmosphere.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="shrink-0 h-10 w-10 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 mt-1">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Modern Facilities</h4>
                                        <p className="text-sm text-gray-500 mt-1">Labs, ICT, Library, and Sports fields.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== SECTION 4: CORE VALUES ===================== */}
            <section id="features" className="py-24 bg-gradient-to-br from-brand-50 via-white to-accent-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-100 text-brand-700 rounded-full text-sm font-bold tracking-wide mb-4">
                            <Sparkles size={16} />
                            OUR CORE VALUES
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">What We Stand For</h2>
                        <p className="text-lg text-gray-600">
                            At Fruitful Vine, these values guide everything we do — shaping character and inspiring excellence.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* CARE */}
                        <div className="group bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <Heart size={150} />
                            </div>
                            <div className="relative z-10">
                                <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                                    <Heart size={32} className="text-white" />
                                </div>
                                <h3 className="text-3xl font-extrabold mb-4">CARE</h3>
                                <p className="text-white/90 leading-relaxed">
                                    We nurture every child with love, compassion, and individual attention, ensuring they feel valued and supported in their journey.
                                </p>
                            </div>
                        </div>

                        {/* RESPECT */}
                        <div className="group bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <Users size={150} />
                            </div>
                            <div className="relative z-10">
                                <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                                    <Users size={32} className="text-white" />
                                </div>
                                <h3 className="text-3xl font-extrabold mb-4">RESPECT</h3>
                                <p className="text-white/90 leading-relaxed">
                                    We foster an environment of mutual respect, teaching children to honour themselves, others, and their community.
                                </p>
                            </div>
                        </div>

                        {/* EXCELLENCE */}
                        <div className="group bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <Award size={150} />
                            </div>
                            <div className="relative z-10">
                                <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                                    <Award size={32} className="text-white" />
                                </div>
                                <h3 className="text-3xl font-extrabold mb-4">EXCELLENCE</h3>
                                <p className="text-white/90 leading-relaxed">
                                    We inspire a pursuit of excellence in academics, character, and all endeavours, helping every child reach their highest potential.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== SECTION 6: ACADEMIC PROGRAMS ===================== */}
            <section id="programs" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                        <div className="max-w-xl">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Academic Divisions</h2>
                            <p className="text-lg text-gray-600">Tailored learning stages designed to meet the developmental needs of every child.</p>
                        </div>
                        <Link href="/programs" className="px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                            View Curriculum
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: "Crèche", image: "/fruitful2.jpg.jpg", age: "Ages 0 - 2", desc: "A safe and nurturing environment for infants and toddlers to explore and grow." },
                            { title: "Pre-School", image: "/fruitful5.jpg.jpg", age: "Ages 3 - 5", desc: "Play-based learning that builds foundational skills in literacy, numeracy, and social interaction." },
                            { title: "Primary School", image: "/fruitful3.jpg.jpg", age: "Ages 6 - 11", desc: "A robust curriculum developing critical thinking, creativity, and strong moral values." }
                        ].map((prog, i) => (
                            <div key={i} className="group relative rounded-2xl overflow-hidden shadow-lg h-[400px]">
                                <img src={prog.image} alt={prog.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/40 to-transparent flex flex-col justify-end p-8">
                                    <span className="inline-block px-3 py-1 bg-accent-500 text-brand-950 text-xs font-bold rounded-lg mb-3 self-start">
                                        {prog.age}
                                    </span>
                                    <h3 className="text-2xl font-bold text-white mb-2">{prog.title}</h3>
                                    <p className="text-gray-300 text-sm mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                                        {prog.desc}
                                    </p>
                                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white group-hover:bg-accent-500 group-hover:text-brand-950 transition-colors">
                                        <ArrowRight size={20} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-900">
                </div>
                <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to Join the Family?</h2>
                    <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                        Admission for the next academic session is ongoing. Give your child the gift of a quality foundation.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/admission" className="px-10 py-4 bg-white text-brand-900 text-lg font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-xl">
                            Start Application
                        </Link>
                        <Link href="#contact" className="px-10 py-4 bg-transparent border-2 border-white/20 text-white text-lg font-bold rounded-xl hover:bg-white/10 transition-colors">
                            Contact Us
                        </Link>
                    </div>
                </div>
            </section>

            {/* ===================== SECTION 8: CONTACT ===================== */}
            <section id="contact" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-5 gap-12 bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                        {/* Contact Info */}
                        <div className="lg:col-span-2 bg-brand-900 p-10 text-white flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute bottom-0 right-0 p-8 opacity-10">
                                <GraduationCap size={200} />
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold mb-2">Get in Touch</h3>
                                <p className="text-brand-100 mb-10">Visit us or send a message.</p>

                                <div className="space-y-8 relative z-10">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                            <Phone className="text-accent-400" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-brand-200">Phone</p>
                                            <p className="font-semibold text-lg">{settings.school_phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                            <Mail className="text-accent-400" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-brand-200">Email</p>
                                            <p className="font-semibold text-lg break-all">info@fruitfulvineheritageschools.org.ng</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                            <MapPin className="text-accent-400" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-brand-200">Address</p>
                                            <p className="font-semibold text-lg">{settings.school_address}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-3 p-8 md:p-10">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Send us a Message</h3>
                            <p className="text-gray-500 mb-6">We&apos;d love to hear from you. Fill out the form below.</p>

                            {formStatus === 'success' ? (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                    <h4 className="text-lg font-bold text-green-800 mb-2">Message Sent!</h4>
                                    <p className="text-green-700 text-sm">{formMessage}</p>
                                    <button
                                        onClick={() => setFormStatus('idle')}
                                        className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
                                    >
                                        Send another message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleContactSubmit} className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={contactForm.name}
                                                onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email Address <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={contactForm.email}
                                                onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={contactForm.phone}
                                                onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm"
                                                placeholder="+234 800 000 0000"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Subject
                                            </label>
                                            <input
                                                type="text"
                                                value={contactForm.subject}
                                                onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm"
                                                placeholder="Admission Inquiry"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Message <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={contactForm.message}
                                            onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm resize-none"
                                            placeholder="How can we help you?"
                                        />
                                    </div>

                                    {formStatus === 'error' && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                                            {formMessage}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={formStatus === 'loading'}
                                        className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-200"
                                    >
                                        {formStatus === 'loading' ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={18} />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <SiteFooter settings={settings} />
        </div>
    );
};
