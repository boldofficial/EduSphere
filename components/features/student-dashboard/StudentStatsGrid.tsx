'use client';

import React from 'react';
import { ArrowUp, ArrowDown, LucideIcon } from 'lucide-react';

interface Stat {
    label: string;
    value: string;
    icon: LucideIcon;
    color: string;
    trend: number | null;
    trendSuffix: string;
    invertTrend?: boolean;
}

interface StudentStatsGridProps {
    stats: Stat[];
}

export const StudentStatsGrid: React.FC<StudentStatsGridProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {stats.map((stat, i) => (
                <div key={i} className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl lg:rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 lg:gap-4">
                    <div className={`${stat.color} p-2 sm:p-3 rounded-lg lg:rounded-xl text-white shrink-0`}>
                        <stat.icon size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate">{stat.label}</p>
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <p className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900">{stat.value}</p>
                            {stat.trend !== null && stat.trend !== 0 && (
                                <span className={`flex items-center gap-0.5 text-[10px] sm:text-xs font-bold px-1 sm:px-1.5 py-0.5 rounded-full ${stat.trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {stat.trend > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                                    {Math.abs(stat.trend).toFixed(stat.label === 'Rank' ? 0 : 1)}{stat.trendSuffix}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
