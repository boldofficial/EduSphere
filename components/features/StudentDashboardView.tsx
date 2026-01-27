'use client';

import React, { useState, useMemo } from 'react';
import {
    CreditCard,
    GraduationCap,
    FileText,
    Calendar,
    Award,
    TrendingUp,
    Download,
    X,
    Printer,
    Megaphone,
    Receipt,
    BadgeCheck,
    Pin,
    BookOpen,
    Users,
    CalendarCheck,
    CheckCircle,
    XCircle,
    Clock,
    ClipboardList,
    ArrowUp,
    ArrowDown,
    Timer,
    Mail
} from 'lucide-react';
import { useSchoolStore } from '@/lib/store';
import {
    useStudents, useClasses, useTeachers, useSettings,
    usePayments, useFees, useScores, useAttendance,
    useAnnouncements, useEvents
} from '@/lib/hooks/use-data';
import { ReportCardTemplate } from './grading/ReportCardTemplate';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AcademicProgressChart } from './grading/AcademicProgressChart';
import { MessageInboxWidget } from './dashboard/MessageInboxWidget';

export const StudentDashboardView = () => {
    // Auth state from store
    const { currentRole, currentUser } = useSchoolStore();

    // Data from TanStack Query
    const { data: students = [] } = useStudents();
    const { data: classes = [] } = useClasses();
    const { data: teachers = [] } = useTeachers();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();
    const { data: payments = [] } = usePayments();
    const { data: fees = [] } = useFees();
    const { data: scores = [] } = useScores();
    const { data: attendance = [] } = useAttendance();
    const { data: announcements = [] } = useAnnouncements();
    const { data: events = [] } = useEvents();

    const [showReportCard, setShowReportCard] = useState(false);

    // In a real app, we'd find the student linked to the parent/user
    // For demo/dev, we try to match by name or fallback to the first student
    const student = useMemo(() => {
        let foundStudent: Types.Student | undefined;

        if (currentUser?.student_id) {
            foundStudent = students.find((s: Types.Student) => s.id === currentUser.student_id);
        }

        // Use found student, or first student, or a safe fallback
        return foundStudent || students[0] || {
            id: 'demo',
            names: 'Student Name',
            student_no: 'NG-001',
            class_id: '',
            // Add other required properties to avoid type errors if necessary
            gender: 'Male',
            passport_url: '/placeholder.jpg',
        } as any;
    }, [students, currentUser]);

    const currentClass = classes.find((c: Types.Class) => c.id === student.class_id);
    const classSubjects = Utils.getSubjectsForClass(currentClass);
    const classTeacher = teachers.find((t: Types.Teacher) => t.id === currentClass?.class_teacher_id);
    const classmates = students.filter((s: Types.Student) => s.class_id === student.class_id);

    // Calculate financial summary
    const myFees = fees.filter(f => f.class_id === student.class_id || !f.class_id);
    const totalBilled = myFees.reduce((acc, f) => acc + f.amount, 0);
    const totalPaid = payments.filter(p => p.student_id === student.id).reduce((acc, p) => acc + p.amount, 0);
    const balance = totalBilled - totalPaid;

    // Get Academic Score
    const myScore = scores.find(s => s.student_id === student.id && s.session === settings.current_session && s.term === settings.current_term);
    const average = myScore?.average || 0;

    // Get previous term score for comparison
    const previousTermData = useMemo(() => {
        const terms = settings.terms || ['First Term', 'Second Term', 'Third Term'];
        const currentTermIndex = terms.indexOf(settings.current_term);

        // Try previous term in same session, or last term in previous session
        let prevTerm = currentTermIndex > 0 ? terms[currentTermIndex - 1] : terms[terms.length - 1];
        let prevSession = currentTermIndex > 0 ? settings.current_session :
            (parseInt(settings.current_session.split('/')[0]) - 1) + '/' + (parseInt(settings.current_session.split('/')[1]) - 1);

        const prevScore = scores.find(s =>
            s.student_id === student.id &&
            s.term === prevTerm &&
            (s.session === settings.current_session || s.session === prevSession)
        );

        const prevPosition = prevScore ? Utils.getStudentPosition(
            student.id, students, scores, prevScore.session, prevScore.term
        ) : null;

        const prevAttendance = prevScore?.attendance_present && prevScore?.attendance_total
            ? Math.round((prevScore.attendance_present / prevScore.attendance_total) * 100)
            : null;

        return {
            average: prevScore?.average || null,
            position: prevPosition,
            attendance: prevAttendance
        };
    }, [scores, student.id, students, settings]);

    // Calculate Position
    const position = useMemo(() => {
        if (!myScore) return null;
        return Utils.getStudentPosition(student.id, students, scores, settings.current_session, settings.current_term);
    }, [student.id, students, scores, settings]);

    // Attendance
    const myAttendance = myScore?.attendance_present && myScore?.attendance_total
        ? Math.round((myScore.attendance_present / myScore.attendance_total) * 100)
        : 0;

    // Get recent attendance records for this student
    const recentAttendance = useMemo(() => {
        return attendance
            .filter(a => a.class_id === student.class_id && a.session === settings.current_session && a.term === settings.current_term)
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 7)
            .map(a => {
                const record = a.records.find(r => r.student_id === student.id);
                return {
                    date: a.date,
                    status: record?.status || 'absent'
                };
            });
    }, [attendance, student.id, student.class_id, settings]);

    // Upcoming exam countdown
    const nextExam = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return events
            .filter(e => e.event_type === 'exam' && e.start_date >= today)
            .sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
    }, [events]);

    const daysUntilExam = nextExam ? Math.ceil((new Date(nextExam.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

    // Calculate trends
    const averageTrend = previousTermData.average !== null ? average - previousTermData.average : null;
    const positionTrend = previousTermData.position !== null && position !== null ? previousTermData.position - position : null; // Positive = improved
    const attendanceTrend = previousTermData.attendance !== null ? myAttendance - previousTermData.attendance : null;

    // Check if report card is published by admin
    const isResultPublished = myScore?.is_passed ?? false;

    const stats = [
        {
            label: 'Term Average',
            value: isResultPublished ? `${average.toFixed(1)}%` : '--',
            icon: TrendingUp,
            color: 'bg-green-500',
            trend: averageTrend,
            trendSuffix: '%'
        },
        {
            label: 'Attendance',
            value: `${myAttendance}%`,
            icon: Calendar,
            color: 'bg-blue-500',
            trend: attendanceTrend,
            trendSuffix: '%'
        },
        {
            label: 'Fee Balance',
            value: `₦${balance.toLocaleString()}`,
            icon: CreditCard,
            color: balance > 0 ? 'bg-red-500' : 'bg-green-600',
            trend: null,
            trendSuffix: ''
        },
        {
            label: 'Rank',
            value: isResultPublished && position ? Utils.ordinalSuffix(position) : '--',
            icon: Award,
            color: 'bg-amber-500',
            trend: isResultPublished ? positionTrend : null,
            trendSuffix: '',
            invertTrend: false // Positive means moved up in rank
        },
    ];


    // Get relevant announcements for the student
    const myAnnouncements = useMemo(() => {
        return announcements
            .filter(a => {
                const isForAll = a.target === 'all';
                const isForParents = currentRole === 'parent' && a.target === 'parents';
                const isForMyClass = a.target === 'class' && a.class_id === student.class_id;
                return isForAll || isForParents || isForMyClass;
            })
            .sort((a, b) => {
                if (a.is_pinned && !b.is_pinned) return -1;
                if (!a.is_pinned && b.is_pinned) return 1;
                return b.created_at - a.created_at;
            })
            .slice(0, 3);
    }, [announcements, currentRole, student.class_id]);

    // Get upcoming events
    const upcomingEvents = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return events
            .filter(e => e.start_date >= today && (e.target_audience === 'all' || e.target_audience === 'students' || e.target_audience === 'parents'))
            .sort((a, b) => a.start_date.localeCompare(b.start_date))
            .slice(0, 2);
    }, [events]);

    // Subject Performance Analysis
    const subjectAnalysis = useMemo(() => {
        if (!isResultPublished || !myScore || !myScore.rows.length) return null;
        const sorted = [...myScore.rows].sort((a, b) => b.total - a.total);
        return {
            top: sorted.slice(0, 2),
            needsImprovement: sorted.slice(-2).filter(s => s.total < 50),
        };
    }, [myScore, isResultPublished]);

    if (showReportCard && currentClass && myScore && isResultPublished) {
        return (
            <div className="fixed inset-0 z-50 bg-gray-900/95 overflow-y-auto">
                <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
                    <div className="w-full max-w-5xl flex justify-between items-center mb-6 text-white no-print">
                        <h2 className="text-2xl font-bold">Report Card Preview</h2>
                        <div className="flex gap-4">
                            <Button onClick={() => window.print()} variant="secondary" className="flex gap-2">
                                <Printer size={16} /> Print
                            </Button>
                            <Button onClick={() => setShowReportCard(false)} variant="danger" className="flex gap-2">
                                <X size={16} /> Close
                            </Button>
                        </div>
                    </div>

                    <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden mb-12">
                        <ReportCardTemplate
                            student={student}
                            currentClass={currentClass}
                            score={myScore}
                            settings={settings}
                            subjects={classSubjects}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 lg:space-y-8">
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
                            {student.names.substring(0, 1)}
                        </div>
                    )}
                    <div className="text-center sm:text-left flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 uppercase tracking-tight truncate">{student.names}</h1>
                        <p className="text-gray-500 font-medium text-sm sm:text-base">Admission No: <span className="text-brand-600 font-bold">{student.student_no}</span> | Term: {settings.current_term}</p>
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

            {/* Exam Countdown Widget */}
            {nextExam && daysUntilExam !== null && (
                <div className={`p-3 sm:p-4 rounded-xl lg:rounded-2xl border flex items-center gap-3 sm:gap-4 ${daysUntilExam <= 7 ? 'bg-red-50 border-red-200' :
                    daysUntilExam <= 14 ? 'bg-yellow-50 border-yellow-200' :
                        'bg-brand-50 border-brand-200'
                    }`}>
                    <div className={`p-2 sm:p-3 rounded-lg lg:rounded-xl ${daysUntilExam <= 7 ? 'bg-red-500' :
                        daysUntilExam <= 14 ? 'bg-yellow-500' :
                            'bg-brand-500'
                        } text-white shrink-0`}>
                        <Timer size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">Upcoming Exam</p>
                        <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{nextExam.title}</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className={`text-2xl sm:text-3xl font-black ${daysUntilExam <= 7 ? 'text-red-600' :
                            daysUntilExam <= 14 ? 'text-yellow-600' :
                                'text-brand-600'
                            }`}>{daysUntilExam}</p>
                        <p className="text-[10px] sm:text-xs font-medium text-gray-500">days left</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Academic Progress Chart */}
                    {isResultPublished ? (
                        <AcademicProgressChart scores={scores} studentId={student.id} />
                    ) : null}

                    {/* Academic Performance Widget */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <ClipboardList size={20} className="text-brand-500" />
                                Academic Performance
                            </h2>
                            <Link href="/grading" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                                View Details →
                            </Link>
                        </div>
                        {isResultPublished && myScore && myScore.rows.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left py-2 px-2 font-bold text-gray-600">Subject</th>
                                            <th className="text-center py-2 px-2 font-bold text-gray-600">CA1</th>
                                            <th className="text-center py-2 px-2 font-bold text-gray-600">CA2</th>
                                            <th className="text-center py-2 px-2 font-bold text-gray-600">Exam</th>
                                            <th className="text-center py-2 px-2 font-bold text-gray-600">Total</th>
                                            <th className="text-center py-2 px-2 font-bold text-gray-600">Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myScore.rows.slice(0, 6).map((row, i) => (
                                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                                <td className="py-2 px-2 font-medium text-gray-900">{row.subject}</td>
                                                <td className="py-2 px-2 text-center text-gray-600">{row.ca1}</td>
                                                <td className="py-2 px-2 text-center text-gray-600">{row.ca2}</td>
                                                <td className="py-2 px-2 text-center text-gray-600">{row.exam}</td>
                                                <td className="py-2 px-2 text-center font-bold text-gray-900">{row.total}</td>
                                                <td className="py-2 px-2 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${row.grade === 'A' ? 'bg-green-100 text-green-700' :
                                                        row.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                                                            row.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                                                row.grade === 'D' ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-red-100 text-red-700'
                                                        }`}>
                                                        {row.grade}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {myScore.rows.length > 6 && (
                                    <p className="text-xs text-gray-400 mt-2 text-center">+{myScore.rows.length - 6} more subjects</p>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 italic text-sm">
                                {!isResultPublished ? 'Results pending publication by school administration.' : 'No scores available for this term yet.'}
                            </div>
                        )}
                    </div>

                    {/* Announcements Widget */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Megaphone size={20} className="text-brand-500" />
                                Announcements
                            </h2>
                            <Link href="/announcements" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                                View All →
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {myAnnouncements.length > 0 ? (
                                myAnnouncements.map((a, i) => (
                                    <div key={a.id} className={`p-4 rounded-2xl border-l-4 ${a.priority === 'urgent' ? 'bg-red-50 border-l-red-500' : a.priority === 'important' ? 'bg-yellow-50 border-l-yellow-500' : 'bg-gray-50 border-l-brand-500'}`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {a.is_pinned && <Pin className="h-3 w-3 text-yellow-500" />}
                                                    <p className="text-sm font-bold text-gray-900">{a.title}</p>
                                                    {a.priority !== 'normal' && (
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${a.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            {a.priority}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-600 line-clamp-2">{a.content}</p>
                                            </div>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                {new Date(a.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-400 italic text-sm">No announcements.</div>
                            )}
                        </div>
                    </div>

                    {/* Recent Payments */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <FileText size={20} className="text-brand-500" />
                                Recent Payments
                            </h2>
                            <Link href="/bursary" className="text-sm text-brand-600 hover:text-brand-700 font-medium font-bold">
                                Full Statement →
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {payments.filter(p => p.student_id === student.id).length > 0 ? (
                                payments.filter(p => p.student_id === student.id).slice(0, 3).map((p, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-dashed">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">₦{p.amount.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">{p.date}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-tighter">Verified</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-400 italic text-sm">No recent transactions.</div>
                            )}
                        </div>
                    </div>

                    {/* Subject Analysis Widget */}
                    {subjectAnalysis && (
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Award size={20} className="text-brand-500" />
                                Subject Analysis
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-400 uppercase">Top Strengths</p>
                                    {subjectAnalysis.top.map((s, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                                            <span className="text-sm font-medium text-gray-700">{s.subject}</span>
                                            <span className="text-sm font-bold text-green-700">{s.total}%</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-400 uppercase">Focus Areas</p>
                                    {subjectAnalysis.needsImprovement.length > 0 ? (
                                        subjectAnalysis.needsImprovement.map((s, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                                                <span className="text-sm font-medium text-gray-700">{s.subject}</span>
                                                <span className="text-sm font-bold text-red-700">{s.total}%</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
                                            Excellent! No subjects currently below 50%.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

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
                                    <span className="font-bold">{classmates.length - 1}</span>
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
                                    <p className="text-xs font-bold text-brand-600 uppercase mb-1">{settings.next_term_begins}</p>
                                    <p className="text-sm font-black text-gray-900">School Resumption</p>
                                    <p className="text-xs text-gray-500 mt-2">Make sure to complete fee payments before resumption.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Messages Inbox */}
                    <MessageInboxWidget maxMessages={3} />
                </div>
            </div>
        </div>
    );
};

