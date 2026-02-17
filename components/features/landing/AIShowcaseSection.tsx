/**
 * AI Showcase Section
 *
 * Highlights the 6 AI-powered features of the platform on the landing page.
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Sparkles, Brain, GraduationCap, TrendingUp,
    CalendarCheck, BookOpen, ArrowRight, Zap, PenTool
} from 'lucide-react';

const aiFeatures = [
    {
        icon: PenTool,
        title: "AI Report Writer",
        desc: "Generate personalized, professional student remarks in seconds — saving teachers hours of manual work every term.",
        color: "from-blue-400 to-cyan-400",
        glow: "group-hover:shadow-blue-500/25"
    },
    {
        icon: TrendingUp,
        title: "Executive Insights",
        desc: "Data-driven strategic recommendations for school administrators. Identify trends, risks, and opportunities instantly.",
        color: "from-emerald-400 to-teal-400",
        glow: "group-hover:shadow-emerald-500/25"
    },
    {
        icon: GraduationCap,
        title: "AI Grading Assistant",
        desc: "Intelligent auto-grading for theory and subjective answers. Fair, consistent evaluations with constructive feedback.",
        color: "from-violet-400 to-purple-400",
        glow: "group-hover:shadow-violet-500/25"
    },
    {
        icon: Brain,
        title: "Predictive Analytics",
        desc: "Early warning system that identifies at-risk students before they fall behind. Actionable recommendations for every learner.",
        color: "from-rose-400 to-pink-400",
        glow: "group-hover:shadow-rose-500/25"
    },
    {
        icon: BookOpen,
        title: "Smart Lesson Planner",
        desc: "Curriculum-aligned lesson plans generated in one click. Complete with activities, assessments, and differentiation strategies.",
        color: "from-amber-400 to-orange-400",
        glow: "group-hover:shadow-amber-500/25"
    },
    {
        icon: CalendarCheck,
        title: "Magic Timetable",
        desc: "AI-powered conflict-free timetable generation for your entire school. No clashes, optimized scheduling, zero hassle.",
        color: "from-indigo-400 to-blue-400",
        glow: "group-hover:shadow-indigo-500/25"
    },
];

export const AIShowcaseSection: React.FC = () => (
    <section id="ai-features" className="py-28 bg-gradient-to-br from-gray-950 via-brand-950 to-purple-950 text-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-brand-600/5 to-purple-600/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Section Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-20"
            >
                <motion.div
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-brand-500/20 to-purple-500/20 border border-brand-400/30 text-brand-300 text-sm font-bold mb-8 backdrop-blur-sm"
                    initial={{ scale: 0.9 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.4 }}
                    viewport={{ once: true }}
                >
                    <Sparkles size={16} className="text-brand-400" />
                    Powered by AI
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-black mb-6">
                    Intelligence Built{' '}
                    <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Into Every Layer
                    </span>
                </h2>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                    Six powerful AI modules that automate tedious tasks, surface hidden insights, and give your school a competitive edge — all included at no extra cost.
                </p>
            </motion.div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {aiFeatures.map((feature, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="group"
                    >
                        <div className={`relative bg-white/[0.04] backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${feature.glow} h-full`}>
                            {/* Glow effect on hover */}
                            <div className={`absolute -inset-px rounded-3xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-sm`} />

                            <div className="relative z-10">
                                {/* Icon */}
                                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon size={28} className="text-white" />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-300 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-400 leading-relaxed text-[15px]">
                                    {feature.desc}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Bottom CTA */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-center"
            >
                <Link
                    href="/onboarding"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-brand-500 to-purple-500 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-brand-500/30 transition-all duration-300 group text-lg"
                >
                    <Zap size={20} />
                    Experience AI-Powered Education
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <p className="text-gray-500 text-sm mt-4">No credit card required  •  Free pilot program available</p>
            </motion.div>
        </div>
    </section>
);
