'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Award, TrendingUp, BookOpen, Lock, Clock, Sparkles } from 'lucide-react';
import { TrendBadge } from './TrendBadge';
import { ReportCardPDF } from './ReportCardPDF';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface StudentScoresViewProps {
    student: Types.Student;
    students: Types.Student[];
    currentClass?: Types.Class;
    scores: Types.Score[];
    settings: Types.Settings;
}

export const StudentScoresView: React.FC<StudentScoresViewProps> = ({
    student, students, currentClass, scores, settings
}) => {
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');

    useEffect(() => {
        if (!selectedSession && settings.current_session) setSelectedSession(settings.current_session);
        if (!selectedTerm && settings.current_term) setSelectedTerm(settings.current_term);
    }, [settings.current_session, settings.current_term, selectedSession, selectedTerm]);

    const availableSessions = useMemo(() => {
        const sessions = new Set(scores.filter(s => s.student_id === student.id).map(s => s.session));
        if (settings.current_session) sessions.add(settings.current_session);
        return Array.from(sessions).sort().reverse();
    }, [scores, settings.current_session, student.id]);

    const availableTerms = settings.terms?.length ? settings.terms : ['First Term', 'Second Term', 'Third Term'];
    const targetSession = selectedSession || settings.current_session;
    const targetTerm = selectedTerm || settings.current_term;
    const isEarlyYears = Utils.isEarlyYearsClass(currentClass);

    // Get selected term scores
    const myScore = useMemo(() => {
        return scores.find(s =>
            s.student_id === student.id &&
            s.session === targetSession &&
            s.term === targetTerm
        );
    }, [scores, student.id, targetSession, targetTerm]);
    const earlySecurePercent = useMemo(() => {
        if (!isEarlyYears || !myScore) return 0;
        const observations = myScore.early_years_observations || [];
        if (observations.length === 0) return 0;
        const secure = observations.filter(item => item.status === 'Secure').length;
        return (secure / observations.length) * 100;
    }, [isEarlyYears, myScore]);

    // Check if report card is published
    const isPublished = myScore?.is_passed ?? false;

    // Calculate position
    const position = useMemo(() => {
        if (!myScore || !isPublished) return null;
        return Utils.getStudentPosition(student.id, students, scores, targetSession, targetTerm);
    }, [student.id, students, scores, targetSession, targetTerm, myScore, isPublished]);

    const totalInClass = useMemo(() => {
        return students.filter(s => Utils.sameId(s.class_id, student.class_id)).length;
    }, [students, student.class_id]);

    const getGradeColor = (grade: string) => {
        const gradeColors: Record<string, string> = {
            'A*': 'bg-purple-100 text-purple-700',
            'A': 'bg-green-100 text-green-700',
            'B': 'bg-blue-100 text-blue-700',
            'C': 'bg-amber-100 text-amber-700',
            'D': 'bg-orange-100 text-orange-700',
            'E': 'bg-red-100 text-red-700',
            'F': 'bg-red-200 text-red-800',
        };
        return gradeColors[grade] || 'bg-gray-100 text-gray-700';
    };

    // Show locked message if results are not published
    if (!isPublished) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Academic Scores</h1>
                    <p className="text-gray-500">View your scores for {targetTerm} - {targetSession}</p>
                </div>

                <Card className="p-12 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="h-10 w-10 text-amber-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Results Not Yet Published</h2>
                        <p className="text-gray-500 mb-6">
                            Your results for {targetTerm} ({targetSession}) have not been released yet.
                            Please check back later or contact your school administration.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span>Results are typically published after the examination period</span>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Academic Scores</h1>
                    <p className="text-gray-500">View your scores for {targetTerm} - {targetSession}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <select
                        value={targetSession}
                        onChange={(e) => setSelectedSession(e.target.value)}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700"
                    >
                        {availableSessions.map(session => (
                            <option key={session} value={session}>{session}</option>
                        ))}
                    </select>
                    <select
                        value={targetTerm}
                        onChange={(e) => setSelectedTerm(e.target.value)}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700"
                    >
                        {availableTerms.map(term => (
                            <option key={term} value={term}>{term}</option>
                        ))}
                    </select>
                </div>
                {myScore?.id && (
                    <ReportCardPDF
                        reportId={myScore.id}
                        session={targetSession}
                        term={targetTerm}
                        studentName={student?.names}
                        schoolName={settings.school_name}
                        variant="secondary"
                        label="Download Published Report"
                        successMessage="Published report card downloaded successfully"
                        className="w-full sm:w-auto"
                    />
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-gradient-to-br from-brand-500 to-brand-600 text-white">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-3xl font-bold">{isEarlyYears ? earlySecurePercent.toFixed(1) : (myScore?.average?.toFixed(1) || '0')}%</p>
                                <TrendBadge trend={myScore?.performance_trend} showText={false} />
                            </div>
                            <p className="text-xs text-white/80">{isEarlyYears ? 'Secure Development' : 'Term Average'}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Award className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{position ? Utils.ordinalSuffix(position) : '-'}</p>
                            <p className="text-xs text-gray-500">Class Position</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {isEarlyYears ? (myScore?.early_years_observations?.length || 0) : (myScore?.rows?.length || 0)}
                            </p>
                            <p className="text-xs text-gray-500">{isEarlyYears ? 'Learning Areas' : 'Subjects'}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <ClipboardList className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{totalInClass}</p>
                            <p className="text-xs text-gray-500">Students in Class</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Scores Table */}
            <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-brand-500" />
                    {isEarlyYears ? 'Learning & Development' : 'Subject Scores'}
                </h2>

                {isEarlyYears && myScore ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="text-left py-3 px-4 font-bold text-gray-700">Learning Area</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-700">Status</th>
                                    <th className="text-left py-3 px-4 font-bold text-gray-700">Observation</th>
                                    <th className="text-left py-3 px-4 font-bold text-gray-700">Next Step</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(myScore.early_years_observations || []).map((row, i) => (
                                    <tr key={`${row.area}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium text-gray-900">{row.area}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                row.status === 'Secure'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : row.status === 'Developing'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-rose-100 text-rose-700'
                                            }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">{row.comment || '-'}</td>
                                        <td className="py-3 px-4 text-gray-600">{row.next_step || '-'}</td>
                                    </tr>
                                ))}
                                {(myScore.early_years_observations || []).length === 0 && (
                                    <tr>
                                        <td className="py-8 px-4 text-center text-gray-500" colSpan={4}>
                                            No early-years observations available for this term yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : myScore && myScore.rows.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="text-left py-3 px-4 font-bold text-gray-700">Subject</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-700">CA1 (15)</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-700">CA2 (15)</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-700">Exam (70)</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-700">Total (100)</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-700">Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myScore.rows.map((row, i) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium text-gray-900">{row.subject}</td>
                                        <td className="py-3 px-4 text-center text-gray-600">{row.ca1}</td>
                                        <td className="py-3 px-4 text-center text-gray-600">{row.ca2}</td>
                                        <td className="py-3 px-4 text-center text-gray-600">{row.exam}</td>
                                        <td className="py-3 px-4 text-center font-bold text-gray-900">{row.total}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(row.grade)}`}>
                                                {row.grade}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50 font-bold">
                                    <td className="py-3 px-4 text-gray-900">Overall Average</td>
                                    <td className="py-3 px-4 text-center" colSpan={3}></td>
                                    <td className="py-3 px-4 text-center text-brand-600 text-lg">{myScore.average?.toFixed(1)}%</td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(myScore.rows[0]?.grade || 'C')}`}>
                                            {myScore.average && myScore.average >= 70 ? 'A' : myScore.average && myScore.average >= 60 ? 'B' : myScore.average && myScore.average >= 50 ? 'C' : myScore.average && myScore.average >= 45 ? 'D' : 'F'}
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="italic">No scores available for this term yet.</p>
                        <p className="text-sm mt-2">Check back later for your results.</p>
                    </div>
                )}
            </Card>

            {/* Remarks */}
            {myScore && (myScore.teacher_remark || myScore.head_teacher_remark || myScore.ai_performance_remark) && (
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-brand-500" />
                        Performance Analysis & Remarks
                    </h2>
                    <div className="space-y-4">
                        {myScore.ai_performance_remark && (
                            <div className="p-4 bg-brand-50 rounded-lg border border-brand-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <Sparkles className="h-12 w-12 text-brand-500" />
                                </div>
                                <p className="text-xs font-bold text-brand-600 uppercase mb-1 flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    AI Performance Analysis
                                </p>
                                <p className="text-gray-700 relative z-10">{myScore.ai_performance_remark}</p>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {myScore.teacher_remark && (
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-xs font-bold text-blue-600 uppercase mb-1">Class Teacher&apos;s Remark</p>
                                    <p className="text-gray-700">{myScore.teacher_remark}</p>
                                </div>
                            )}
                            {myScore.head_teacher_remark && (
                                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                    <p className="text-xs font-bold text-purple-600 uppercase mb-1">Principal&apos;s Remark</p>
                                    <p className="text-gray-700">{myScore.head_teacher_remark}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};
