'use client';

import React from 'react';
import { AlertCircle, Rocket, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const DemoBanner = () => {
    return (
        <div className="bg-gradient-to-r from-brand-600 via-purple-600 to-brand-700 text-white px-4 py-3 shadow-lg relative overflow-hidden group">
            {/* Animated background element */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
            <div className="absolute -right-4 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>

            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                        <Rocket size={20} className="text-white animate-pulse" />
                    </div>
                    <div>
                        <p className="font-black text-sm tracking-tight">DEMO MODE : BOLD IDEAS INNOVATIONS SCHOOL</p>
                        <p className="text-xs text-brand-100 font-medium italic">Data is reset daily. Experience the full power of Registra.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        href="/onboarding"
                        className="px-5 py-2 bg-white text-brand-700 text-sm font-bold rounded-xl hover:bg-brand-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        Create Your School
                        <ArrowRight size={16} />
                    </Link>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-brand-100"
                        title="Exit Demo"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
