'use client';

import React, { useState, useMemo } from 'react';
import {
    TrendingUp,
    Calendar,
    CreditCard,
    Award,
    Printer,
    X
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
import { MessageInboxWidget } from './dashboard/MessageInboxWidget';
import { StudentJourney } from './dashboard/StudentJourney';

// Extracted Components
import { StudentProfileHeader } from './student-dashboard/StudentProfileHeader';
import { StudentStatsGrid } from './student-dashboard/StudentStatsGrid';
import { StudentAcademicWidgets } from './student-dashboard/StudentAcademicWidgets';
import { StudentInfoWidgets } from './student-dashboard/StudentInfoWidgets';
import { StudentFeedWidgets } from './student-dashboard/StudentFeedWidgets';

export const StudentDashboardView = () => {
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
    const [selectedSession, setSelectedSession] = useState<string>('');
    const [selectedTerm, setSelectedTerm] = useState<string>('');

    React.useEffect(() => {
        if (settings.current_session && !selectedSession) setSelectedSession(settings.current_session);
        if (settings.current_term && !selectedTerm) setSelectedTerm(settings.current_term);
    }, [settings, selectedSession, selectedTerm]);

    const student = useMemo(() => {
        let foundStudent: Types.Student | undefined;
        // Priority: Use profile_id (or student_id) from currentUser
        const profileId = currentUser?.profile_id || currentUser?.student_id;

        if (profileId) {
            foundStudent = students.find((s: Types.Student) => s.id === profileId);
        }

        // Final fallback for demo/unassigned users
        return foundStudent || {
            id: 'unassigned', names: currentUser?.username || 'Guest Student', student_no: '---', class_id: '',
            gender: 'Male', passport_url: '/placeholder.jpg',
        } as any;
    }, [students, currentUser]);

    const currentClass = classes.find((c: Types.Class) => c.id === student.class_id);
    const classSubjects = Utils.getSubjectsForClass(currentClass);
    const classTeacher = teachers.find((t: Types.Teacher) => String(t.id) === String(currentClass?.class_teacher_id));
    const classmates = students.filter((s: Types.Student) => s.class_id === student.class_id);

    // Calculations
    const totalBilled = fees.filter(f => f.class_id === student.class_id || !f.class_id).reduce((acc, f) => acc + f.amount, 0);
    const totalPaid = payments.filter(p => p.student_id === student.id).reduce((acc, p) => acc + p.amount, 0);
    const balance = totalBilled - totalPaid;

    const availableSessions = useMemo(() => {
        const sessions = new Set(scores.filter(s => s.student_id === student.id).map(s => s.session));
        if (settings.current_session) sessions.add(settings.current_session);
        return Array.from(sessions).sort().reverse();
    }, [scores, settings.current_session, student.id]);

    const availableTerms = ['First Term', 'Second Term', 'Third Term'];
    const targetSession = selectedSession || settings.current_session;
    const targetTerm = selectedTerm || settings.current_term;
    const myScore = scores.find(s => s.student_id === student.id && s.session === targetSession && s.term === targetTerm);
    const isResultPublished = myScore?.is_passed ?? false;
    const average = myScore?.average || 0;

    const previousTermData = useMemo(() => {
        const terms = settings.terms || ['First Term', 'Second Term', 'Third Term'];
        const currentTermIndex = terms.indexOf(settings.current_term);
        let prevTerm = currentTermIndex > 0 ? terms[currentTermIndex - 1] : terms[terms.length - 1];
        let prevSession = currentTermIndex > 0 ? settings.current_session :
            (parseInt(settings.current_session.split('/')[0]) - 1) + '/' + (parseInt(settings.current_session.split('/')[1]) - 1);

        const prevScore = scores.find(s => s.student_id === student.id && s.term === prevTerm && (s.session === settings.current_session || s.session === prevSession));
        return {
            average: prevScore?.average || null,
            position: prevScore ? Utils.getStudentPosition(student.id, students, scores, prevScore.session, prevScore.term) : null,
            attendance: prevScore?.attendance_present && prevScore?.attendance_total ? Math.round((prevScore.attendance_present / prevScore.attendance_total) * 100) : null
        };
    }, [scores, student.id, students, settings]);

    const position = useMemo(() => isResultPublished ? Utils.getStudentPosition(student.id, students, scores, settings.current_session, settings.current_term) : null, [student.id, students, scores, settings, isResultPublished]);
    const myAttendance = myScore?.attendance_present && myScore?.attendance_total ? Math.round((myScore.attendance_present / myScore.attendance_total) * 100) : 0;

    const stats = [
        { label: 'Term Average', value: isResultPublished ? `${average.toFixed(1)}%` : '--', icon: TrendingUp, color: 'bg-green-500', trend: previousTermData.average !== null ? average - previousTermData.average : null, trendSuffix: '%' },
        { label: 'Attendance', value: `${myAttendance}%`, icon: Calendar, color: 'bg-indigo-500', trend: previousTermData.attendance !== null ? myAttendance - previousTermData.attendance : null, trendSuffix: '%' },
        { label: 'Fee Balance', value: `₦${balance.toLocaleString()}`, icon: CreditCard, color: balance > 0 ? 'bg-rose-500' : 'bg-emerald-600', trend: null, trendSuffix: '' },
        { label: 'Rank', value: isResultPublished && position ? Utils.ordinalSuffix(position) : '--', icon: Award, color: 'bg-amber-500', trend: isResultPublished && previousTermData.position !== null && position !== null ? previousTermData.position - position : null, trendSuffix: '' },
    ];

    const recentAttendance = useMemo(() => attendance
        .filter(a => a.class_id === student.class_id && a.session === settings.current_session && a.term === settings.current_term)
        .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7)
        .map(a => ({ date: a.date, status: a.records.find(r => r.student_id === student.id)?.status || 'absent' })), [attendance, student.id, student.class_id, settings]);

    const eventsData = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const upcoming = events.filter(e => e.start_date >= today && (e.target_audience === 'all' || e.target_audience === 'students' || e.target_audience === 'parents')).sort((a, b) => a.start_date.localeCompare(b.start_date));
        const nextExam = events.filter(e => e.event_type === 'exam' && e.start_date >= today).sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
        return {
            upcoming: upcoming.slice(0, 2),
            nextExam,
            daysUntilExam: nextExam ? Math.ceil((new Date(nextExam.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
        };
    }, [events]);

    const myAnnouncements = useMemo(() => announcements
        .filter(a => a.target === 'all' || (currentRole === 'parent' && a.target === 'parents') || (a.target === 'class' && a.class_id === student.class_id))
        .sort((a, b) => (a.is_pinned === b.is_pinned) ? b.created_at - a.created_at : a.is_pinned ? -1 : 1).slice(0, 3), [announcements, currentRole, student.class_id]);

    const subjectAnalysis = useMemo(() => {
        if (!isResultPublished || !myScore || !myScore.rows.length) return null;
        const sorted = [...myScore.rows].sort((a, b) => b.total - a.total);
        return { top: sorted.slice(0, 2), needsImprovement: sorted.slice(-2).filter(s => s.total < 50) };
    }, [myScore, isResultPublished]);

    if (showReportCard && currentClass && myScore && isResultPublished) {
        return (
            <div className="fixed inset-0 z-50 bg-gray-900/95 overflow-y-auto">
                <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
                    <div className="w-full max-w-5xl flex justify-between items-center mb-6 text-white no-print">
                        <h2 className="text-2xl font-bold">Report Card Preview</h2>
                        <div className="flex gap-4">
                            <Button onClick={() => window.print()} variant="secondary" className="flex gap-2"><Printer size={16} /> Print</Button>
                            <Button onClick={() => setShowReportCard(false)} variant="danger" className="flex gap-2"><X size={16} /> Close</Button>
                        </div>
                    </div>
                    <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden mb-12">
                        <ReportCardTemplate student={student} currentClass={currentClass} score={myScore} settings={settings} subjects={classSubjects} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 lg:space-y-8 bg-white min-h-screen rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm">
            <StudentProfileHeader
                student={student}
                selectedSession={targetSession}
                setSelectedSession={setSelectedSession}
                availableSessions={availableSessions}
                selectedTerm={targetTerm}
                setSelectedTerm={setSelectedTerm}
                availableTerms={availableTerms}
                isResultPublished={isResultPublished}
                myScore={myScore}
                setShowReportCard={setShowReportCard}
            />

            <StudentStatsGrid stats={stats as any} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <StudentAcademicWidgets
                        isResultPublished={isResultPublished}
                        myScore={myScore}
                        scores={scores}
                        studentId={student.id}
                        subjectAnalysis={subjectAnalysis}
                        nextExam={eventsData.nextExam}
                        daysUntilExam={eventsData.daysUntilExam}
                    />

                    <StudentFeedWidgets
                        announcements={myAnnouncements}
                        payments={payments}
                        studentId={student.id}
                    />
                </div>

                <div className="space-y-6">
                    <StudentInfoWidgets
                        currentClass={currentClass}
                        classTeacher={classTeacher}
                        classmatesCount={classmates.length - 1}
                        classSubjects={classSubjects}
                        recentAttendance={recentAttendance}
                        upcomingEvents={eventsData.upcoming}
                        nextTermBegins={settings.next_term_begins}
                    />

                    <StudentJourney studentId={student.id} />

                    <MessageInboxWidget maxMessages={3} />
                </div>
            </div>
        </div>
    );
};
