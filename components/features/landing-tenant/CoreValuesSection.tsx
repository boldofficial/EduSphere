import React from 'react';
import { 
    Award, Users, Building, Shield, Heart, Star, CheckCircle, Cross, Sparkles 
} from 'lucide-react';
import { Settings } from '@/lib/types';

interface CoreValuesSectionProps {
    settings: Settings;
}

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

export const CoreValuesSection: React.FC<CoreValuesSectionProps> = ({ settings }) => {
    const coreValues = (settings.landing_core_values as any[])?.length > 0 ? settings.landing_core_values : [
        { title: 'CARE', description: 'We nurture every child with love, compassion, and individual attention, ensuring they feel valued and supported in their journey.', icon: 'Heart' },
        { title: 'RESPECT', description: 'We foster an environment of mutual respect, teaching children to honour themselves, others, and their community.', icon: 'Users' },
        { title: 'EXCELLENCE', description: 'We inspire a pursuit of excellence in academics, character, and all endeavours, helping every child reach their highest potential.', icon: 'Award' }
    ];

    return (
        <section id="features" className="py-24 bg-gradient-to-br from-brand-50 via-white to-accent-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-100 text-brand-700 rounded-full text-sm font-bold tracking-wide mb-4">
                        <Sparkles size={16} />
                        OUR CORE VALUES
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">What We Stand For</h2>
                    <p className="text-lg text-gray-600">
                        At {settings.school_name || 'Registra'}, these values guide everything we do — syncing success and inspiring excellence.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {coreValues.map((value, i) => {
                        const Icon = getFeatureIcon(value.icon || value.title);
                        const colors = [
                            'from-pink-500 to-rose-600',
                            'from-blue-500 to-indigo-600',
                            'from-amber-500 to-orange-600',
                            'from-emerald-500 to-teal-600',
                            'from-purple-500 to-violet-600'
                        ];
                        const colorClass = colors[i % colors.length];

                        return (
                            <div key={i} className={`group bg-gradient-to-br ${colorClass} rounded-3xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden`}>
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <Icon size={150} />
                                </div>
                                <div className="relative z-10">
                                    <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                                        <Icon size={32} className="text-white" />
                                    </div>
                                    <h3 className="text-3xl font-extrabold mb-4">{value.title}</h3>
                                    <p className="text-white/90 leading-relaxed">
                                        {value.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
