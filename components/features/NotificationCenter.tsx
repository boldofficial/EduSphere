'use client';

import React, { useState, useMemo } from 'react';
import {
    Bell,
    X,
    Megaphone,
    CreditCard,
    Calendar,
    Newspaper,
    Circle
} from 'lucide-react';
import { useSchoolStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import * as Utils from '@/lib/utils';
import {
    useStudents, useAnnouncements, useEvents, useNewsletters,
    useFees, usePayments, useSettings
} from '@/lib/hooks/use-data';
import * as Types from '@/lib/types';

export const NotificationCenter: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    // Auth State (Store)
    const { currentRole, currentUser } = useSchoolStore();

    // Data Hooks
    const { data: students = [] } = useStudents();
    const { data: announcements = [] } = useAnnouncements();
    const { data: events = [] } = useEvents();
    const { data: newsletters = [] } = useNewsletters();
    const { data: fees = [] } = useFees();
    const { data: payments = [] } = usePayments();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();

    // In a real app, notifications would be their own entity in DB
    // Here we synthesize them based on existing data
    const notifications = useMemo(() => {
        const items: any[] = [];
        const today = new Date();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(today.getDate() - 3);

        // 1. Recent Announcements
        const safeStudents = Array.isArray(students) ? students : [];
        const student = safeStudents.find((s: Types.Student) => s.id === (currentUser?.student_id || safeStudents[0]?.id));
        const classId = student?.class_id;

        const safeAnnouncements = Array.isArray(announcements) ? announcements : [];
        safeAnnouncements
            .filter(a => {
                const isForAll = a.target === 'all';
                const isForMyRole = (currentRole === 'parent' && a.target === 'parents');
                const isForMyClass = a.target === 'class' && a.class_id === classId;
                const isRecent = new Date(a.created_at).getTime() >= threeDaysAgo.getTime();
                return (isForAll || isForMyRole || isForMyClass) && isRecent;
            })
            .forEach(a => {
                items.push({
                    id: `ann-${a.id}`,
                    type: 'announcement',
                    title: a.title,
                    description: a.content,
                    date: a.created_at,
                    icon: Megaphone,
                    color: 'text-blue-500',
                    link: '/announcements'
                });
            });

        // 2. Fee Reminder (if balance > 0)
        if (student && (currentRole === 'student' || currentRole === 'parent')) {
            const { balance } = Utils.getStudentBalance(
                student, fees, payments, settings.current_session, settings.current_term
            );
            if (balance > 0) {
                items.push({
                    id: 'fee-reminder',
                    type: 'fee',
                    title: 'Fee Payment Pending',
                    description: `Outstanding balance of ₦${balance.toLocaleString()} for ${settings.current_term}.`,
                    date: Date.now(),
                    icon: CreditCard,
                    color: 'text-red-500',
                    link: '/bursary'
                });
            }
        }

        // 3. Upcoming Exams (within 7 days)
        const safeEvents = Array.isArray(events) ? events : [];
        const nextExam = safeEvents
            .filter(e => {
                const startDate = new Date(e.start_date);
                const diffTime = startDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return e.event_type === 'exam' && diffDays >= 0 && diffDays <= 7;
            })[0];

        if (nextExam) {
            items.push({
                id: `exam-${nextExam.id}`,
                type: 'exam',
                title: 'Upcoming Exam',
                description: `${nextExam.title} starts on ${nextExam.start_date}.`,
                date: new Date(nextExam.start_date).getTime(),
                icon: Calendar,
                color: 'text-yellow-500',
                link: '/calendar'
            });
        }

        // 4. New Newsletters (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        const safeNewsletters = Array.isArray(newsletters) ? newsletters : [];
        const latestNewsletter = safeNewsletters
            .filter(n => n.is_published && new Date(n.created_at).getTime() >= sevenDaysAgo.getTime())
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        if (latestNewsletter) {
            items.push({
                id: `news-${latestNewsletter.id}`,
                type: 'newsletter',
                title: 'New Newsletter',
                description: `Read the latest ${latestNewsletter.term} newsletter for ${latestNewsletter.session}.`,
                date: latestNewsletter.created_at,
                icon: Newspaper,
                color: 'text-green-500',
                link: '/newsletter'
            });
        }

        return items.sort((a, b) => b.date - a.date);
    }, [announcements, events, newsletters, settings, currentRole, currentUser, students, fees, payments]);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
                <Bell size={20} className="text-gray-600" />
                {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        {notifications.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 max-h-[480px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-900">Notifications</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[400px]">
                            {notifications.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map(n => (
                                        <Link
                                            key={n.id}
                                            href={n.link}
                                            onClick={() => setIsOpen(false)}
                                            className="block p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex gap-3">
                                                <div className={`mt-1 ${n.color}`}>
                                                    <n.icon size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-gray-900">{n.title}</p>
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.description}</p>
                                                    <p className="text-[10px] text-gray-400 mt-2">
                                                        {new Date(n.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <div className="mt-1">
                                                    <Circle size={8} className="fill-brand-500 text-brand-500" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-400 italic text-sm">
                                    No new notifications.
                                </div>
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-3 bg-gray-50 border-t text-center">
                                <button className="text-xs font-bold text-brand-600 hover:text-brand-700">
                                    Mark all as read
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
