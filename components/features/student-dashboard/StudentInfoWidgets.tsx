'use client';

import React from 'react';
import { BookOpen, Users, CalendarCheck, CheckCircle, Clock, XCircle, Calendar } from 'lucide-react';
import Link from 'next/link';

interface StudentInfoWidgetsProps {
    currentClass: any;
    classTeacher: any;
    classmatesCount: number;
    classSubjects: string[];
    recentAttendance: any[];
    upcomingEvents: any[];
    nextTermBegins?: string;
}

export const StudentInfoWidgets: React.FC<StudentInfoWidgetsProps> = ({
    currentClass,
    classTeacher,
    classmatesCount,
    classSubjects,
    recentAttendance,
    upcomingEvents,
    nextTermBegins
}) => {
    return (
        <div className="space-y-6">
            {/* Class Information Widget */}
            <div className="bg-brand-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <BookOpen size={18} />
                        Class Information
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                            <span className="text-brand-100 text-sm">Class</span>
                            <span className="font-bold">{currentClass?.name || 'Not Assigned'}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                            <span className="text-brand-100 text-sm">Class Teacher</span>
                            <span className="font-bold text-right">{classTeacher?.name || 'Not Assigned'}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                            <span className="text-brand-100 text-sm flex items-center gap-1"><Users size={14} /> Classmates</span>
                            <span className="font-bold">{classmatesCount}</span>
                        </div>
                        <div className="p-3 bg-white/10 rounded-xl">
                            <p className="text-brand-100 text-sm mb-2">Subjects ({classSubjects.length})</p>
                            <div className="flex flex-wrap gap-1">
                                {classSubjects.slice(0, 4).map((sub, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-medium">{sub}</span>
                                ))}
                                {classSubjects.length > 4 && (
                                    <span className="px-2 py-0.5 bg-white/10 rounded text-[10px]">+{classSubjects.length - 4}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-brand-800 rounded-full blur-3xl opacity-50"></div>
            </div>

            {/* Attendance History Widget */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <CalendarCheck size={18} className="text-brand-500" />
                        Attendance History
                    </h3>
                </div>
                <div className="space-y-2">
                    {recentAttendance.length > 0 ? (
                        recentAttendance.map((record, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm font-medium text-gray-700">
                                    {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${record.status === 'present' ? 'bg-green-100 text-green-700' :
                                    record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    {record.status === 'present' ? <CheckCircle size={12} /> :
                                        record.status === 'late' ? <Clock size={12} /> :
                                            <XCircle size={12} />}
                                    {record.status}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6 text-gray-400 italic text-sm">No attendance records yet.</div>
                    )}
                </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar size={20} className="text-brand-500" />
                        Upcoming Events
                    </h2>
                    <Link href="/calendar" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                        View All →
                    </Link>
                </div>
                <div className="space-y-4">
                    {upcomingEvents.length > 0 ? (
                        upcomingEvents.map((event, i) => (
                            <div key={event.id} className={`p-4 rounded-2xl border ${event.event_type === 'exam' ? 'bg-red-50 border-red-100' : event.event_type === 'holiday' ? 'bg-green-50 border-green-100' : 'bg-brand-50 border-brand-100'}`}>
                                <p className={`text-xs font-bold uppercase mb-1 ${event.event_type === 'exam' ? 'text-red-600' : event.event_type === 'holiday' ? 'text-green-600' : 'text-brand-600'}`}>
                                    {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                </p>
                                <p className="text-sm font-black text-gray-900">{event.title}</p>
                                {event.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{event.description}</p>}
                            </div>
                        ))
                    ) : (
                        <div className="p-4 bg-brand-50 rounded-2xl border border-brand-100">
                            <p className="text-xs font-bold text-brand-600 uppercase mb-1">{nextTermBegins}</p>
                            <p className="text-sm font-black text-gray-900">School Resumption</p>
                            <p className="text-xs text-gray-500 mt-2">Make sure to complete fee payments before resumption.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
