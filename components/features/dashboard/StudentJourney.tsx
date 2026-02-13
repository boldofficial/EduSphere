'use client';

import React from 'react';
import { useStudentHistory } from '@/lib/hooks/use-data';
import { Card } from '@/components/ui/card';
import { History, CheckCircle2, Trophy, ArrowUpCircle } from 'lucide-react';
import * as Utils from '@/lib/utils';

export const StudentJourney: React.FC<{ studentId: string }> = ({ studentId }) => {
    const { data: history = [], isLoading } = useStudentHistory(studentId);

    if (isLoading) return <div className="h-48 animate-pulse bg-gray-50 rounded-3xl" />;
    if (!history.length) return null;

    const getIcon = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes('promote')) return <ArrowUpCircle className="text-blue-500" />;
        if (a.includes('graduat')) return <Trophy className="text-amber-500" />;
        if (a.includes('status')) return <CheckCircle2 className="text-emerald-500" />;
        return <History className="text-gray-400" />;
    };

    return (
        <Card className="p-6 border-none shadow-sm bg-white rounded-[32px]">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <History size={18} strokeWidth={3} />
                </div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Academic Journey</h3>
            </div>

            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-100 before:via-indigo-50 before:to-transparent">
                {history.map((item: any) => (
                    <div key={item.id} className="relative flex items-start gap-6 group">
                        <div className="absolute left-0 mt-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-indigo-50 shadow-sm z-10 group-hover:scale-110 transition-transform">
                            {getIcon(item.action)}
                        </div>
                        <div className="flex-1 ml-12">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-bold text-gray-900 leading-none">{item.action}</h4>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{Utils.formatDate(item.created_at, 'MMM d, yyyy')}</span>
                            </div>
                            <p className="text-sm text-gray-500 font-medium">
                                {item.from_value && item.to_value ? (
                                    <>Changed from <span className="text-gray-900 font-bold">{item.from_value}</span> to <span className="text-indigo-600 font-black">{item.to_value}</span></>
                                ) : item.to_value || ''}
                            </p>
                            {item.session && (
                                <div className="mt-2 text-[10px] font-black text-indigo-400 uppercase tracking-tighter">
                                    {item.session} • {item.term}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};
