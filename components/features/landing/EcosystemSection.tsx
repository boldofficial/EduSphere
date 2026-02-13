/**
 * EcosystemSection
 * 
 * Showcase of the 4 key portals within the Registra ecosystem.
 */
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, GraduationCap, ClipboardCheck,
    BookOpen, CreditCard, LayoutDashboard,
    MessageCircle, Users, BarChart3, Presentation
} from 'lucide-react';

const portals = [
    {
        id: 'admin',
        title: 'School Administrator',
        icon: ShieldCheck,
        desc: 'Central command for entire school operations. Manage finance, staff, and system-wide settings.',
        features: ['Fee Management', 'Payroll & Expenses', 'Strategic Analytics', 'Staff Oversight'],
        color: 'blue'
    },
    {
        id: 'teacher',
        title: 'Academic Staff',
        icon: Presentation,
        desc: 'Productivity tools for modern educators. Handle grading, attendance, and lesson planning seamlessly.',
        features: ['Auto-Grading', 'Attendance Tracking', 'CBT Support', 'Report Generation'],
        color: 'green'
    },
    {
        id: 'student',
        title: 'Student Portal',
        icon: GraduationCap,
        desc: 'A personalized learning environment for every student to track progress and access resources.',
        features: ['Performance Cards', 'Learning Materials', 'Homework Feed', 'Attendance Logs'],
        color: 'purple'
    },
    {
        id: 'parent',
        title: 'Parent Interface',
        icon: Users,
        desc: 'Keep parents engaged and informed with real-time updates on their child’s academic journey.',
        features: ['Real-time Results', 'School Fee Payments', 'Direct Communication', 'Attendance Alerts'],
        color: 'amber'
    }
];

export const EcosystemSection: React.FC = () => {
    const [activePortal, setActivePortal] = useState(portals[0]);

    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                            One Platform. <span className="text-brand-600">Infinite Portals.</span>
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
                            A unified ecosystem designed to connect every stakeholder in the educational journey.
                        </p>
                    </motion.div>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Portal Menu */}
                    <div className="space-y-4">
                        {portals.map((portal) => (
                            <button
                                key={portal.id}
                                onClick={() => setActivePortal(portal)}
                                className={`w-full p-6 rounded-3xl text-left transition-all duration-300 flex items-center gap-6 border-2 ${activePortal.id === portal.id
                                        ? 'bg-brand-50 border-brand-600 shadow-lg'
                                        : 'bg-white border-gray-100 hover:border-brand-200'
                                    }`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${activePortal.id === portal.id
                                        ? 'bg-brand-600 text-white'
                                        : 'bg-gray-100 text-gray-400'
                                    } transition-colors duration-300`}>
                                    <portal.icon size={28} />
                                </div>
                                <div>
                                    <h3 className={`text-xl font-bold ${activePortal.id === portal.id ? 'text-brand-900' : 'text-gray-500'
                                        }`}>
                                        {portal.title}
                                    </h3>
                                    <p className={`text-sm mt-1 leading-tight ${activePortal.id === portal.id ? 'text-brand-700' : 'text-gray-400'
                                        }`}>
                                        {portal.desc}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Active Portal Detail View */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activePortal.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-gray-50 rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-sm relative overflow-hidden"
                        >
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-200/20 rounded-bl-full -mr-20 -mt-20 blur-3xl" />

                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white font-bold text-xs uppercase tracking-widest text-brand-600 border border-brand-100 mb-8">
                                    <LayoutDashboard size={14} />
                                    Portal Features
                                </div>

                                <h3 className="text-3xl font-black text-gray-900 mb-6">
                                    Tools for the <span className="text-brand-600">{activePortal.title.split(' ')[1] || activePortal.title}</span>
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {activePortal.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-brand-50 hover:border-brand-100 transition-colors group">
                                            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center group-hover:bg-brand-600 transition-colors">
                                                <ClipboardCheck size={16} className="text-brand-600 group-hover:text-white" />
                                            </div>
                                            <span className="font-bold text-gray-700 text-sm">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-12 p-6 bg-white rounded-3xl border border-brand-100 shadow-sm">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                                            <BarChart3 size={20} />
                                        </div>
                                        <h4 className="font-black text-gray-900">Immediate Impact</h4>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Designed with user experience at the core, this portal ensures that tasks which used to take hours now happen in clicks. Fully optimized for mobile and desktop access.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
};
