'use client';

import React, { useState, useMemo } from 'react';
import {
    Users,
    GraduationCap,
    ClipboardList,
    CalendarCheck,
    TrendingUp,
    Clock,
    UserCircle,
    BookOpen,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronRight,
    Save,
    Mail
} from 'lucide-react';
import { useSchoolStore } from '@/lib/store';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types'; // Explicit import
import {
    useStudents, useClasses, useScores, useAttendance, useSubjectTeachers, useTeachers, useSettings,
    useCreateScore, useUpdateScore, useCreateAttendance, useUpdateAttendance
} from '@/lib/hooks/use-data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/providers/toast-provider';
import { GradingView } from './GradingView';
import { AttendanceView } from './AttendanceView';
import { MessageInboxWidget } from './dashboard/MessageInboxWidget';

// Internal components for the modules (to be expanded)
const MySubjectsModule = ({ subjects, classes }: { subjects: any[], classes: any[] }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map(sub => {
                const cls = classes.find(c => c.id === sub.class_id);
                return (
                    <Card key={sub.id} className="hover:shadow-md transition-shadow cursor-pointer">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 bg-brand-100 rounded-xl flex items-center justify-center">
                                    <BookOpen className="h-6 w-6 text-brand-600" />
                                </div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{sub.session}</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{sub.subject}</h3>
                            <p className="text-sm text-gray-500 font-medium">{cls?.name || 'Unknown Class'}</p>
                        </div>
                    </Card>
                );
            })}
            {subjects.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400 bg-gray-50 rounded-xl border-dashed border-2">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No subjects assigned yet.</p>
                </div>
            )}
        </div>
    );
};

const MyStudentsModule = ({ students, classes }: { students: any[], classes: any[] }) => {
    return (
        <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">My Students</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Student Name</th>
                            <th className="px-6 py-3">Admission No</th>
                            <th className="px-6 py-3">Class</th>
                            <th className="px-6 py-3">Gender</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {students.map(student => {
                            const cls = classes.find(c => c.id === student.class_id);
                            return (
                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-gray-900">{student.names}</td>
                                    <td className="px-6 py-3 text-gray-500">{student.student_no}</td>
                                    <td className="px-6 py-3 text-gray-500">{cls?.name || '-'}</td>
                                    <td className="px-6 py-3 text-gray-500">{student.gender}</td>
                                    <td className="px-6 py-3 text-right">
                                        <Button size="sm" variant="ghost">View Profile</Button>
                                    </td>
                                </tr>
                            );
                        })}
                        {students.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                    No students found in your classes.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export const TeacherDashboardView = () => {
    // Auth
    const { currentRole, currentUser } = useSchoolStore();

    // Data Hooks
    const { data: students = [] } = useStudents();
    const { data: classes = [] } = useClasses();
    const { data: teachers = [] } = useTeachers();
    const { data: scores = [] } = useScores();
    const { data: attendance = [] } = useAttendance();
    const { data: subjectTeachers = [] } = useSubjectTeachers();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();

    // Mutations
    const { mutate: createScore } = useCreateScore();
    const { mutate: updateScore } = useUpdateScore();
    const { mutate: createAttendance } = useCreateAttendance();
    const { mutate: updateAttendance } = useUpdateAttendance();

    // Handlers
    const handleUpsertScore = (score: Types.Score) => {
        const existing = scores.find(s => s.id === score.id);
        if (existing) {
            updateScore({ id: score.id, updates: score });
        } else {
            createScore(score);
        }
    };

    const handleUpsertAttendance = (att: Types.Attendance) => {
        const existing = attendance.find(a => a.id === att.id);
        if (existing) {
            updateAttendance({ id: att.id, updates: att });
        } else {
            createAttendance(att);
        }
    };
    const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'students' | 'grading' | 'attendance'>('overview');

    // Derived Data
    const myTeacherProfile = teachers.find(t => t.email === currentUser?.email) || teachers[0] || { id: 'teacher_1', name: 'Demo Teacher' };

    // My Subjects (from SubjectTeacher assignments)
    const myAssignments = useMemo(() =>
        subjectTeachers.filter(st => st.teacher_id === myTeacherProfile.id && st.session === settings.current_session),
        [subjectTeachers, myTeacherProfile.id, settings.current_session]
    );

    // My Classes (classes where I'm assigned as class teacher OR teach subjects)
    const myClassIdsFromSubjects = myAssignments.map(a => a.class_id);
    const myClassIdsFromClassTeacher = classes.filter(c => c.class_teacher_id === myTeacherProfile.id).map(c => c.id);
    const myClassIds = Array.from(new Set([...myClassIdsFromSubjects, ...myClassIdsFromClassTeacher]));
    const myClasses = classes.filter(c => myClassIds.includes(c.id));

    // Classes where I'm the class teacher
    const classesAsClassTeacher = useMemo(() =>
        classes.filter(c => c.class_teacher_id === myTeacherProfile.id),
        [classes, myTeacherProfile.id]
    );

    // My Students (students in any of my classes)
    const myStudents = useMemo(() =>
        students.filter((s: Types.Student) => myClassIds.includes(s.class_id)),
        [students, myClassIds]
    );

    // Stats
    const stats = [
        { label: 'My Subjects', value: myAssignments.length.toString(), icon: BookOpen, color: 'bg-blue-500' },
        { label: 'Total Students', value: myStudents.length.toString(), icon: Users, color: 'bg-indigo-500' },
        { label: 'Classes', value: myClasses.length.toString(), icon: GraduationCap, color: 'bg-pink-500' },
        { label: 'Class Teacher For', value: classesAsClassTeacher.length.toString(), icon: ClipboardList, color: 'bg-amber-500' },
    ];

    return (
        <div className="space-y-6">
            {/* Header with Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase">Teacher Dashboard</h1>
                    <p className="text-gray-500 font-medium">Welcome, <span className="text-brand-600">{myTeacherProfile.name}</span></p>
                </div>
                <div className="flex bg-white p-1 rounded-xl shadow-sm border overflow-x-auto">
                    {[
                        { id: 'overview', label: 'Overview', icon: TrendingUp },
                        { id: 'subjects', label: 'My Subjects', icon: BookOpen },
                        { id: 'students', label: 'My Students', icon: Users },
                        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
                        { id: 'grading', label: 'Grading', icon: ClipboardList },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-brand-50 text-brand-700 shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                                <div className={`${stat.color} p-3 rounded-xl text-white`}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* My Classes Section */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <GraduationCap size={20} className="text-brand-500" />
                                My Classes
                            </h2>
                            {myClasses.length > 0 ? (
                                <div className="space-y-3">
                                    {myClasses.map(cls => {
                                        const isClassTeacher = cls.class_teacher_id === myTeacherProfile.id;
                                        const studentsInClass = students.filter((s: Types.Student) => s.class_id === cls.id).length;
                                        const subjectsInClass = myAssignments.filter(a => a.class_id === cls.id);
                                        return (
                                            <div key={cls.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-bold text-gray-900">{cls.name}</h3>
                                                    {isClassTeacher && (
                                                        <span className="px-2 py-1 bg-brand-100 text-brand-700 text-xs font-bold rounded-full">
                                                            Class Teacher
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Users size={14} />
                                                        {studentsInClass} students
                                                    </span>
                                                    {subjectsInClass.length > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <BookOpen size={14} />
                                                            {subjectsInClass.map(s => s.subject).join(', ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed">
                                    <GraduationCap size={32} className="mb-2 opacity-50" />
                                    <p>No classes assigned yet.</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-brand-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-2">Notice Board</h3>
                                <p className="text-brand-100 text-sm">Review school announcements and upcoming events.</p>
                            </div>
                        </div>

                        {/* Messages Inbox */}
                        <MessageInboxWidget maxMessages={3} />
                    </div>
                </div>
            )}

            {/* My Subjects Tab */}
            {activeTab === 'subjects' && (
                <MySubjectsModule subjects={myAssignments} classes={classes} />
            )}

            {/* My Students Tab */}
            {activeTab === 'students' && (
                <MyStudentsModule students={myStudents} classes={classes} />
            )}

            {/* Grading Module */}
            {activeTab === 'grading' && (
                myClasses.length > 0 ? (
                    <GradingView
                        classes={myClasses}
                        students={myStudents}
                        scores={scores}
                        settings={settings}
                        onUpsertScore={handleUpsertScore}
                    />
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <p>You have not been assigned to any classes yet.</p>
                    </div>
                )
            )}

            {activeTab === 'attendance' && (
                myClasses.length > 0 ? (
                    <AttendanceView
                        classes={myClasses}
                        students={myStudents}
                        attendance={attendance}
                        settings={settings}
                        onSave={handleUpsertAttendance}
                    />
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <p>You have not been assigned to any classes yet.</p>
                    </div>
                )
            )}
        </div>
    );
};
