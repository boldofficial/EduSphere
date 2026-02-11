'use client';

import React, { useState } from 'react';

import { Terminal, Code, Cpu, Lock, ChevronRight } from 'lucide-react';
import { LandingNav } from '@/components/features/landing/LandingNav';
import { LandingFooter } from '@/components/features/landing/LandingContactFooter';
import * as Utils from '@/lib/utils';

export default function DevelopersPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    return (
        <div className="min-h-screen bg-[#0f172a] text-white flex flex-col font-mono pt-20">
            <LandingNav mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

            <main className="flex-grow pt-10 px-4 pb-20">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center gap-16 mb-24">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full text-brand-400 text-xs font-bold uppercase tracking-widest">
                                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                                v1.0.4 Live
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight font-primary">
                                Build on the Operating System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-500">Education</span>
                            </h1>
                            <p className="text-xl text-slate-400 leading-relaxed max-w-xl font-primary">
                                Seamlessly integrate your applications with Registra's student data, grading systems, and payment infrastructure.
                            </p>
                            <div className="flex gap-4 pt-4">
                                <button className="px-6 py-3 bg-brand-600 hover:bg-brand-500 rounded-lg font-bold flex items-center gap-2 transition-all font-primary text-white">
                                    Read Definitions <ChevronRight size={18} />
                                </button>
                                <button className="px-6 py-3 border border-slate-700 hover:border-slate-500 rounded-lg font-bold transition-all font-primary text-white">
                                    Get API Key
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 w-full">
                            <div className="bg-[#1e293b] rounded-2xl border border-slate-700 p-6 shadow-2xl relative overflow-hidden group font-mono">
                                <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-4">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <div className="ml-auto text-xs text-slate-500 font-bold">bash</div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <p className="text-slate-400"># Fetch student details</p>
                                    <p className="text-purple-400">curl <span className="text-white">-X GET</span> \</p>
                                    <p className="pl-4 text-green-400">"https://api.myregistra.net/v1/students/ST-2024-001"</p>
                                    <p className="pl-4 text-white">-H <span className="text-yellow-300">"Authorization: Bearer sk_live_..."</span></p>

                                    <p className="text-slate-500 mt-4 animate-pulse"># Response...</p>
                                    <div className="bg-[#0f172a] p-4 rounded-lg border border-slate-800 text-xs leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                        <span className="text-purple-400">{"{"}</span><br />
                                        &nbsp;&nbsp;<span className="text-blue-400">"id"</span>: <span className="text-green-400">"ST-2024-001"</span>,<br />
                                        &nbsp;&nbsp;<span className="text-blue-400">"name"</span>: <span className="text-green-400">"John Doe"</span>,<br />
                                        &nbsp;&nbsp;<span className="text-blue-400">"grade"</span>: <span className="text-green-400">"12"</span>,<br />
                                        &nbsp;&nbsp;<span className="text-blue-400">"status"</span>: <span className="text-green-400">"active"</span><br />
                                        <span className="text-purple-400">{"}"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureBox
                            icon={Lock}
                            title="Secure by Default"
                            description="Bank-grade encryption and granular scopes ensure student data remains protected."
                        />
                        <FeatureBox
                            icon={Cpu}
                            title="Real-time Webhooks"
                            description="Subscribe to events like fees.paid or student.enrolled to trigger automated workflows."
                        />
                        <FeatureBox
                            icon={Code}
                            title="Typed SDKs"
                            description="Official libraries for Node.js, Python, and PHP help you ship faster with fewer errors."
                        />
                    </div>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
}

function FeatureBox({ icon: Icon, title, description }: any) {
    return (
        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mb-6">
                <Icon size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-primary">{title}</h3>
            <p className="text-slate-400 leading-relaxed font-primary">{description}</p>
        </div>
    );
}
