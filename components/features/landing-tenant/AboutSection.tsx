import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Settings } from '@/lib/types';

interface AboutSectionProps {
    settings: Settings;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ settings }) => {
    return (
        <section id="about" className="py-24 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    {/* Image Composition */}
                    <div className="relative">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                            <img src="/fruitful1.jpg.jpg" alt="Students Learning" className="w-full h-80 object-cover" />
                        </div>
                        <div className="absolute -bottom-12 -right-8 w-2/3 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                            <img src="/fruitfulnew.jpg" alt="School Activities" className="w-full h-48 object-cover" />
                        </div>
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
                            {settings.landing_about_text || "Registra provides a comprehensive management and learning platform that balances academic rigour with administrative efficiency."}
                        </p>

                        <div className="grid sm:grid-cols-2 gap-8 mb-10">
                            {[
                                { title: 'Holistic Education', desc: 'Focusing on the total child: spirit, soul, and body.' },
                                { title: 'Expert Faculty', desc: 'Qualified & experienced teachers who mentor.' },
                                { title: 'Safe Environment', desc: 'Secure, conducive learning atmosphere.' },
                                { title: 'Modern Facilities', desc: 'Labs, ICT, Library, and Sports fields.' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="shrink-0 h-10 w-10 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 mt-1">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{item.title}</h4>
                                        <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
