'use client';

import React from 'react';
import { BadgeCheck, Receipt, Download, Clock, Printer, X } from 'lucide-react';
import Link from 'next/link';
import * as Types from '@/lib/types';

interface StudentProfileHeaderProps {
    student: any;
    selectedSession: string;
    setSelectedSession: (s: string) => void;
    availableSessions: string[];
    selectedTerm: string;
    setSelectedTerm: (t: string) => void;
    availableTerms: string[];
    isResultPublished: boolean;
    myScore: any;
    setShowReportCard: (s: boolean) => void;
}

export const StudentProfileHeader: React.FC<StudentProfileHeaderProps> = ({
    student,
    selectedSession, setSelectedSession, availableSessions,
    selectedTerm, setSelectedTerm, availableTerms,
    isResultPublished, myScore,
    setShowReportCard
}) => {
    return (
        <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                {/* Student Picture */}
                {student.passport_url ? (
                    <img
                        src={student.passport_url}
                        alt={student.names}
                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl sm:rounded-2xl border-4 border-brand-100 object-cover shadow-lg shrink-0"
                    />
                ) : (
                    <div className="h-20 w-20 sm:h-24 sm:w-24 bg-brand-50 rounded-xl sm:rounded-2xl border-4 border-brand-100 flex items-center justify-center text-2xl sm:text-3xl font-black text-brand-600 shadow-inner shrink-0">
                        {student.names?.substring(0, 1)}
                    </div>
                )}
                <div className="text-center sm:text-left flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 uppercase tracking-tight truncate">{student.names}</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <p className="text-gray-500 font-medium text-sm sm:text-base">Admission No: <span className="text-brand-600 font-bold">{student.student_no}</span></p>
                        <span className="hidden sm:inline text-gray-300">|</span>

                        {/* Session Selector */}
                        <select
                            value={selectedSession}
                            onChange={(e) => setSelectedSession(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-1 font-bold"
                        >
                            {availableSessions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        {/* Term Selector */}
                        <select
                            value={selectedTerm}
                            onChange={(e) => setSelectedTerm(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-1 font-bold"
                        >
                            {availableTerms.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
                {/* Buttons - Stack on mobile, row on larger screens */}
                <div className="w-full sm:w-auto flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mt-2 sm:mt-0">
                    <Link href="/id_cards" className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto flex gap-2 items-center justify-center bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-purple-200 transition-all text-sm">
                            <BadgeCheck size={16} />
                            ID Card
                        </button>
                    </Link>
                    <Link href="/bursary" className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto flex gap-2 items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all text-sm">
                            <Receipt size={16} />
                            Invoice
                        </button>
                    </Link>
                    {isResultPublished ? (
                        <button
                            onClick={() => {
                                if (myScore) setShowReportCard(true);
                            }}
                            className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-200 transition-all text-sm"
                        >
                            <Download size={16} />
                            Report Card
                        </button>
                    ) : (
                        <button
                            disabled
                            className="w-full sm:w-auto bg-gray-300 text-gray-500 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed text-sm"
                            title="Results not yet published by school administration"
                        >
                            <Clock size={16} />
                            Results Pending
                        </button>
                    )}
                </div>
            </div>
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand-50 rounded-full blur-3xl opacity-50"></div>
        </div>
    );
};
