'use client';

import React, { useState } from 'react';

import { Play, Download, FileText, Video } from 'lucide-react';
import { LandingNav } from '@/components/features/landing/LandingNav';
import { LandingFooter } from '@/components/features/landing/LandingContactFooter';
import * as Utils from '@/lib/utils';

export default function ResourcesPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-primary pt-20">
            <LandingNav mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

            <main className="flex-grow pt-10 px-4 pb-20">
                <div className="text-center py-16 max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Resources & Tutorials</h1>
                    <p className="text-xl text-gray-500 leading-relaxed">
                        Everything you need to master Registra. Watch step-by-step video guides, download manuals, and explore best practices.
                    </p>
                </div>

                <div className="max-w-7xl mx-auto space-y-20">

                    {/* Video Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <Video className="text-brand-600" size={28} />
                            <h2 className="text-2xl font-bold text-gray-900">Video Tutorials</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <VideoCard
                                title="Getting Started with Registra"
                                duration="5:30"
                                thumbnail="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                            />
                            <VideoCard
                                title="Managing Student Records"
                                duration="8:15"
                                thumbnail="https://images.unsplash.com/photo-1531403009284-440f080d1e12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                            />
                            <VideoCard
                                title="Setting up Online Payments"
                                duration="4:45"
                                thumbnail="https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                            />
                        </div>
                    </section>

                    {/* Downloads Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <Download className="text-brand-600" size={28} />
                            <h2 className="text-2xl font-bold text-gray-900">Downloads & Guides</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DownloadCard
                                title="Admin User Manual (PDF)"
                                size="12.5 MB"
                                description="Comprehensive guide for super admins and school administrators."
                            />
                            <DownloadCard
                                title="Teacher's Handbook (PDF)"
                                size="5.2 MB"
                                description="Quick start guide for grading, attendance, and assignments."
                            />
                            <DownloadCard
                                title="Parent Portal Guide (PDF)"
                                size="2.1 MB"
                                description="Instructions for parents on checking results and paying fees."
                            />
                            <DownloadCard
                                title="Bulk Import Template (CSV)"
                                size="15 KB"
                                description="Spreadsheet template for batch uploading student data."
                            />
                        </div>
                    </section>

                </div>
            </main>

            <LandingFooter />
        </div>
    );
}

function VideoCard({ title, duration, thumbnail }: any) {
    return (
        <div className="group cursor-pointer">
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-gray-900 mb-4 shadow-lg group-hover:shadow-xl transition-all">
                <img src={thumbnail} alt={title} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play fill="white" className="text-white ml-1" size={24} />
                    </div>
                </div>
                <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                    {duration}
                </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{title}</h3>
        </div>
    );
}

function DownloadCard({ title, size, description }: any) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4 hover:border-brand-300 transition-colors cursor-pointer">
            <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="text-gray-400" size={24} />
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900">{title}</h3>
                    <span className="text-xs font-bold text-gray-400 uppercase">{size}</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">{description}</p>
                <button className="text-brand-600 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                    Downlaod Now <Download size={14} />
                </button>
            </div>
        </div>
    );
}
