'use client';

import React, { useMemo } from 'react';
import { BookOpen, Clock, MapPin, ArrowRight, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLessons, useClasses } from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';

export const NextLessonWidget: React.FC<{ teacherId: string }> = ({ teacherId }) => {
    const { data: lessons = [] } = useLessons();
    const { data: classes = [] } = useClasses();

    const nextLesson = useMemo(() => {
        if (!lessons.length) return null;

        const myLessons = lessons.filter(l => l.teacher === teacherId || l.teacher?.id === teacherId);
        if (!myLessons.length) return null;

        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[now.getDay()];
        const currentTime = now.getHours() * 60 + now.getMinutes();

        // Filter for today's future lessons or any lesson if today is weekend
        const todayLessons = myLessons.filter(l => l.day_of_week === currentDay);

        const upcoming = todayLessons
            .map(l => {
                const [hours, minutes] = l.start_time.split(':').map(Number);
                return { ...l, startMinutes: hours * 60 + minutes };
            })
            .filter(l => l.startMinutes > currentTime)
            .sort((a, b) => a.startMinutes - b.startMinutes);

        return upcoming[0] || null;
    }, [lessons, teacherId]);

    const targetClass = useMemo(() => {
        if (!nextLesson) return null;
        return classes.find(c => c.id === nextLesson.student_class || c.id === nextLesson.student_class?.id);
    }, [nextLesson, classes]);

    if (!nextLesson) {
        return (
            <Card className="bg-brand-900 border-none overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                    <BookOpen size={120} />
                </div>
                <div className="p-8 relative z-10">
                    <p className="text-brand-300 font-bold uppercase text-[10px] tracking-widest mb-2">Schedule</p>
                    <h3 className="text-2xl font-black text-white mb-2">No more lessons today</h3>
                    <p className="text-brand-100/70 text-sm font-medium max-w-[200px]">You've completed your schedule for the day. Enjoy your break!</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="bg-white border-2 border-brand-100 overflow-hidden relative group hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-500">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <BookOpen size={80} />
            </div>

            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <span className="px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-brand-100">
                        Up Next
                    </span>
                    <div className="flex items-center gap-2 text-brand-500 font-bold text-xs">
                        <Clock size={14} strokeWidth={3} />
                        {nextLesson.start_time.slice(0, 5)} - {nextLesson.end_time.slice(0, 5)}
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-3xl font-black text-gray-900 leading-tight mb-2 group-hover:text-brand-600 transition-colors">
                        {nextLesson.subject_name || 'Class Session'}
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-500 font-bold text-sm">
                            <Users size={16} className="text-gray-400" />
                            {targetClass?.name || 'Assigned Class'}
                        </div>
                        {nextLesson.classroom && (
                            <div className="flex items-center gap-2 text-gray-500 font-bold text-sm">
                                <MapPin size={16} className="text-gray-400" />
                                {nextLesson.classroom}
                            </div>
                        )}
                    </div>
                </div>

                <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-black uppercase tracking-wider py-6 rounded-2xl group/btn overflow-hidden relative">
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        Get Started
                        <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-brand-600 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </Button>
            </div>
        </Card>
    );
};
