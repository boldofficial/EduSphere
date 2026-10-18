'use client';

import React, { useState, useMemo } from 'react';
import { TrendingUp, Calendar, CreditCard, Award, Printer, X } from 'lucide-react';
import { useSchoolStore } from '@/lib/store';
import {
  useStudents,
  useClasses,
  useTeachers,
  useSettings,
  useScores,
  useAttendance,
  useAnnouncements,
  useEvents,
} from '@/lib/hooks/use-data';
import { ReportCardTemplate } from './grading/ReportCardTemplate';
import { ReportCardPDF } from './grading/ReportCardPDF';
import * as Utils from '@/lib/utils';
import { useStudentProfile } from '@/lib/hooks/use-student-profile';
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
  const { data: scores = [] } = useScores({ include_all_periods: true });
  const { data: attendance = [] } = useAttendance({ include_all_periods: true });
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
    return (
      foundStudent ||
      ({
        id: 'unassigned',
        names: currentUser?.username || 'Guest Student',
        student_no: '---',
        class_id: '',
        gender: 'Male',
        passport_url: '/placeholder.jpg',
      } as Types.Student)
    );
  }, [students, currentUser]);

  const currentClass = classes.find((c: Types.Class) => c.id === student.class_id);
  const classSubjects = Utils.getSubjectsForClass(currentClass);
  const classTeacher = teachers.find(
    (t: Types.Teacher) => String(t.id) === String(currentClass?.class_teacher_id)
  );

  const availableSessions = useMemo(() => {
    const sessions = new Set(
      scores.filter((s) => s.student_id === student.id).map((s) => s.session)
    );
    if (settings.current_session) sessions.add(settings.current_session);
    return Array.from(sessions).sort().reverse();
  }, [scores, settings.current_session, student.id]);

  const availableTerms = ['First Term', 'Second Term', 'Third Term'];
  const targetSession = selectedSession || settings.current_session;
  const targetTerm = selectedTerm || settings.current_term;
  const scopedSettings = useMemo(
    () => ({
      ...settings,
      current_session: targetSession,
      current_term: targetTerm,
    }),
    [settings, targetSession, targetTerm]
  );
  // Rank, class size and fees are computed by the server for this one student (students only receive
  // their own records, so ranking across the class cannot be done in the browser).
  const profileId = student.id !== 'unassigned' ? String(student.id) : undefined;
  const { data: profile } = useStudentProfile(profileId, targetSession, targetTerm);
  const myScore = scores.find(
    (s) => s.student_id === student.id && s.session === targetSession && s.term === targetTerm
  );
  const isResultPublished = myScore?.is_passed ?? false;
  const average = myScore?.average || 0;
  const myHistoryScores = useMemo(
    () => scores.filter((s) => s.student_id === student.id),
    [scores, student.id]
  );

  const terms = settings.terms || ['First Term', 'Second Term', 'Third Term'];
  const termIndex = terms.indexOf(targetTerm);
  const prevTerm = termIndex > 0 ? terms[termIndex - 1] : terms[terms.length - 1];
  const prevSession =
    termIndex > 0 || !targetSession
      ? targetSession
      : `${parseInt(targetSession.split('/')[0]) - 1}/${parseInt(targetSession.split('/')[1]) - 1}`;
  const { data: prevProfile } = useStudentProfile(profileId, prevSession, prevTerm);

  const previousTermData = useMemo(() => {
    const prevScore = scores.find(
      (s) => s.student_id === student.id && s.term === prevTerm && s.session === prevSession
    );
    const prevAcademics = prevProfile?.academics;
    return {
      average: prevScore?.average || null,
      position: prevAcademics?.published ? prevAcademics.position : null,
      attendance:
        prevScore?.attendance_present && prevScore?.attendance_total
          ? Math.round((prevScore.attendance_present / prevScore.attendance_total) * 100)
          : null,
    };
  }, [scores, student.id, prevTerm, prevSession, prevProfile]);

  const position = profile?.academics?.published ? profile.academics.position : null;
  const myAttendance =
    myScore?.attendance_present && myScore?.attendance_total
      ? Math.round((myScore.attendance_present / myScore.attendance_total) * 100)
      : 0;
  const balance = profile?.finance.balance ?? 0;
  const periodPayments = useMemo(
    () =>
      (profile?.finance.payments || []).map(
        (p) =>
          ({
            ...p,
            id: String(p.id),
            student_id: student.id,
            session: targetSession,
            term: targetTerm,
          }) as unknown as Types.Payment
      ),
    [profile, student.id, targetSession, targetTerm]
  );

  const stats = [
    {
      label: 'Term Average',
      value: isResultPublished ? `${average.toFixed(1)}%` : '--',
      icon: TrendingUp,
      color: 'bg-green-500',
      trend: previousTermData.average !== null ? average - previousTermData.average : null,
      trendSuffix: '%',
    },
    {
      label: 'Attendance',
      value: `${myAttendance}%`,
      icon: Calendar,
      color: 'bg-indigo-500',
      trend:
        previousTermData.attendance !== null ? myAttendance - previousTermData.attendance : null,
      trendSuffix: '%',
    },
    {
      label: 'Fee Balance',
      value: `₦${balance.toLocaleString()}`,
      icon: CreditCard,
      color: balance > 0 ? 'bg-red-500' : 'bg-green-600',
      trend: null,
      trendSuffix: '',
    },
    {
      label: 'Rank',
      value: isResultPublished && position ? Utils.ordinalSuffix(position) : '--',
      icon: Award,
      color: 'bg-amber-500',
      trend:
        isResultPublished && previousTermData.position !== null && position !== null
          ? previousTermData.position - position
          : null,
      trendSuffix: '',
    },
  ];

  const recentAttendance = useMemo(
    () =>
      attendance
        .filter(
          (a) =>
            a.class_id === student.class_id && a.session === targetSession && a.term === targetTerm
        )
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 7)
        .map((a) => ({
          date: a.date,
          status: a.records.find((r) => r.student_id === student.id)?.status || 'absent',
        })),
    [attendance, student.id, student.class_id, targetSession, targetTerm]
  );

  const eventsData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = events
      .filter(
        (e) =>
          e.start_date >= today &&
          (e.target_audience === 'all' ||
            e.target_audience === 'students' ||
            e.target_audience === 'parents')
      )
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    const nextExam = events
      .filter((e) => e.event_type === 'exam' && e.start_date >= today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
    return {
      upcoming: upcoming.slice(0, 2),
      nextExam,
      daysUntilExam: nextExam
        ? Math.ceil(
            (new Date(nextExam.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )
        : null,
    };
  }, [events]);

  const myAnnouncements = useMemo(
    () =>
      announcements
        .filter(
          (a) =>
            a.target === 'all' ||
            (currentRole === 'parent' && a.target === 'parents') ||
            (a.target === 'class' && a.class_id === student.class_id)
        )
        .sort((a, b) =>
          a.is_pinned === b.is_pinned
            ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            : a.is_pinned
              ? -1
              : 1
        )
        .slice(0, 3),
    [announcements, currentRole, student.class_id]
  );

  const subjectAnalysis = useMemo(() => {
    if (!isResultPublished || !myScore || !myScore.rows.length) return null;
    const sorted = [...myScore.rows].sort((a, b) => b.total - a.total);
    return {
      top: sorted.slice(0, 2),
      needsImprovement: sorted.slice(-2).filter((s) => s.total < 50),
    };
  }, [myScore, isResultPublished]);

  if (showReportCard && currentClass && myScore && isResultPublished) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900/95 overflow-y-auto">
        <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
          <div className="w-full max-w-5xl flex justify-between items-center mb-6 text-white no-print">
            <h2 className="text-2xl font-bold">Report Card Preview</h2>
            <div className="flex gap-4">
              <ReportCardPDF
                reportId={myScore?.id}
                session={targetSession}
                term={targetTerm}
                studentName={student?.names}
                schoolName={scopedSettings.school_name}
                variant="secondary"
                label="Download PDF"
                successMessage="Report card downloaded successfully"
                className="text-sm font-semibold"
              />
              <Button onClick={() => window.print()} variant="secondary" className="flex gap-2">
                <Printer size={16} /> Print
              </Button>
              <Button
                onClick={() => setShowReportCard(false)}
                variant="danger"
                className="flex gap-2"
              >
                <X size={16} /> Close
              </Button>
            </div>
          </div>
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden mb-12">
            <ReportCardTemplate
              student={student}
              currentClass={currentClass}
              score={myScore}
              settings={scopedSettings}
              subjects={classSubjects}
              historyScores={myHistoryScores}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 bg-white min-h-screen rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm">
      <StudentProfileHeader
        student={student}
        settings={scopedSettings}
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

      <StudentStatsGrid stats={stats} />

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
            payments={periodPayments}
            studentId={student.id}
          />
        </div>

        <div className="space-y-6">
          <StudentInfoWidgets
            currentClass={currentClass}
            classTeacher={classTeacher}
            classmatesCount={Math.max((profile?.academics?.class_size ?? 1) - 1, 0)}
            classSubjects={classSubjects}
            recentAttendance={recentAttendance}
            upcomingEvents={eventsData.upcoming}
            nextTermBegins={scopedSettings.next_term_begins}
          />

          <StudentJourney studentId={student.id} />

          <MessageInboxWidget maxMessages={3} />
        </div>
      </div>
    </div>
  );
};
