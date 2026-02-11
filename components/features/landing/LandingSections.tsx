/**
 * Landing Sections
 *
 * Features, How It Works, Testimonials, and FAQ sections for the landing page.
 */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen, Users, CreditCard, BarChart3, ShieldCheck,
    Target, Star, Heart, Sparkles, MessageCircle,
    UserCheck, Settings, Building2, Lightbulb, Rocket, Quote
} from 'lucide-react';

const features = [
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
];

const steps = [
    { step: "01", title: "Sign Up", desc: "Create your account and tell us about your school in our quick onboarding form.", icon: UserCheck },
    { step: "02", title: "Setup", desc: "Import your data or start fresh. We'll guide you through configuring your school settings.", icon: Settings },
    { step: "03", title: "Customize", desc: "Personalize your school's branding, add staff, and set up your academic structure.", icon: Sparkles },
    { step: "04", title: "Launch", desc: "Go live with your new school management system and start transforming education.", icon: Rocket }
];

const testimonials = [
    {
        quote: "Registra has revolutionized how we manage our school. The automation features have saved us countless hours, and our parents love the transparency.",
        author: "Mrs. Adebayo", role: "Principal", school: "Lagos International School", rating: 5
    },
    {
        quote: "The financial management module is incredible. We've eliminated billing errors and improved our cash flow significantly.",
        author: "Mr. Okon", role: "Business Manager", school: "Federal Government College", rating: 5
    },
    {
        quote: "Our teachers love the LMS features, and student performance has improved dramatically with the analytics tools.",
        author: "Dr. Ibrahim", role: "Academic Director", school: "Nigerian Turkish International School", rating: 5
    }
];

const faqs = [
    { question: "How long does it take to set up Registra for my school?", answer: "Most schools are up and running within 1-2 weeks. Our onboarding team provides personalized guidance throughout the process." },
    { question: "Can I import my existing student and staff data?", answer: "Yes! We support CSV imports and can help migrate data from most existing school management systems." },
    { question: "Is my school's data secure?", answer: "Absolutely. We use bank-level encryption, regular security audits, and comply with Nigerian data protection regulations." },
    { question: "What kind of support do you provide?", answer: "We offer 24/7 technical support, comprehensive documentation, video tutorials, and dedicated account managers for enterprise clients." },
    { question: "Can I try Registra before committing?", answer: "Yes! We offer a 30-day free trial with full access to all features. No credit card required to get started." }
];

export const FeaturesSection: React.FC = () => (
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
                {features.map((feature, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="group relative"
                    >
                        <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100/50 h-full relative overflow-hidden">
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
);

export const HowItWorksSection: React.FC = () => (
    <section id="about" className="py-24 bg-white">
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
                {steps.map((step, index) => (
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
);

export const TestimonialsSection: React.FC = () => (
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
                {testimonials.map((testimonial, index) => (
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
                            &quot;{testimonial.quote}&quot;
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
);

export const FAQSection: React.FC = () => (
    <section id="faq" className="py-24 bg-gray-50">
        <div id="demo" className="sr-only">Request Demo Anchor</div>
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
                {faqs.map((faq, index) => (
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
);
