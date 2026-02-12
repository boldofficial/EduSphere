/**
 * Landing Hero Section
 *
 * Hero with animated background, CTA buttons, and dashboard mockup.
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowRight, School, Users, BarChart3, CheckCircle2,
    ChevronDown, Play, TrendingUp, Award, Sparkles, Rocket
} from 'lucide-react';

interface LandingHeroProps {
    onOpenDemoModal: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onOpenDemoModal }) => {
    return (
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
                                onClick={onOpenDemoModal}
                                className="px-8 py-4 bg-white border-2 border-brand-200 text-brand-700 text-lg font-bold rounded-2xl hover:border-brand-600 hover:bg-brand-50 transition-all duration-300 flex items-center justify-center gap-2 group"
                            >
                                <Rocket size={20} className="text-brand-600 group-hover:animate-bounce" />
                                Request Demo
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
    );
};
