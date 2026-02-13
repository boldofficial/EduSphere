'use client';

import React from 'react';
import { useStudentAchievements } from '@/lib/hooks/use-data';
import { Medal, Trophy, Star, Target, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import * as Utils from '@/lib/utils';

export const AchievementShowcase: React.FC<{ studentId: string }> = ({ studentId }) => {
    const { data: achievements = [], isLoading } = useStudentAchievements(studentId);

    if (isLoading) return <div className="h-48 animate-pulse bg-gray-50 rounded-3xl" />;
    if (!achievements.length) return null;

    const getCategoryIcon = (category: string) => {
        const c = category.toLowerCase();
        if (c.includes('sport')) return <Target className="text-rose-500" />;
        if (c.includes('academic')) return <Medal className="text-amber-500" />;
        if (c.includes('leader')) return <Trophy className="text-indigo-500" />;
        return <Star className="text-emerald-500" />;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((item: any) => (
                <Card key={item.id} className="p-5 border-none bg-gradient-to-br from-white to-gray-50/30 rounded-[24px] shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                        {getCategoryIcon(item.category)}
                    </div>

                    <div className="flex items-start gap-4 relative z-10">
                        <div className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center shrink-0">
                            {getCategoryIcon(item.category)}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">{item.category}</span>
                                <span className="text-[10px] font-bold text-gray-400 capitalize">{Utils.formatDate(item.date_achieved, 'MMM yyyy')}</span>
                            </div>
                            <h4 className="font-black text-gray-900 leading-tight mb-2 pr-6">{item.title}</h4>
                            <p className="text-xs text-gray-500 font-medium line-clamp-2 mb-3">{item.description}</p>

                            {item.evidence_url && (
                                <a
                                    href={item.evidence_url}
                                    target="_blank"
                                    className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wider"
                                >
                                    View Evidence
                                    <ExternalLink size={12} />
                                </a>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};
