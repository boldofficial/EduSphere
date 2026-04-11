import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Settings } from '@/lib/types';

interface ProgramsSectionProps {
    settings: Settings;
}

export const ProgramsSection: React.FC<ProgramsSectionProps> = ({ settings }) => {
    const academicPrograms = (settings.landing_academic_programs as any[])?.length > 0 ? settings.landing_academic_programs : [
        { title: "Crèche", image: "/fruitful2.jpg.jpg", age_range: "Ages 0 - 2", description: "A safe and nurturing environment for infants and toddlers." },
        { title: "Pre-School", image: "/fruitful5.jpg.jpg", age_range: "Ages 3 - 5", description: "Play-based learning building foundational skills." },
        { title: "Primary School", image: "/fruitful3.jpg.jpg", age_range: "Ages 6 - 11", description: "A robust curriculum developing critical thinking." }
    ];

    return (
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
                    {academicPrograms.map((prog, i) => (
                        <div key={i} className="group relative rounded-2xl overflow-hidden shadow-lg h-[400px]">
                            <img 
                                src={prog.image || "/fruitful2.jpg.jpg"} 
                                alt={prog.title} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/40 to-transparent flex flex-col justify-end p-8">
                                <span 
                                    className="inline-block px-3 py-1 text-xs font-bold rounded-lg mb-3 self-start" 
                                    style={{ 
                                        backgroundColor: settings.landing_primary_color === '#1A3A5C' ? '#FBBF24' : (settings.landing_primary_color || '#1A3A5C'), 
                                        color: settings.landing_primary_color === '#1A3A5C' ? '#1A3A5C' : '#FFFFFF' 
                                    }}
                                >
                                    {prog.age_range}
                                </span>
                                <h3 className="text-2xl font-bold text-white mb-2">{prog.title}</h3>
                                <p className="text-gray-300 text-sm mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                                    {prog.description}
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
    );
};
