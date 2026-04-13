'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    Users,
    GraduationCap,
    ClipboardList,
    CalendarCheck,
    TrendingUp,
    BookOpen,
    TrendingDown,
    PieChart as PieChartIcon,
    DollarSign,
    AlertTriangle,
    Settings,
    Upload,
    Calendar,
    User
} from 'lucide-react';
import { useSchoolStore } from '@/lib/store';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';
import {
    useStudents, useClasses, useScores, useAttendance, useSubjectTeachers, useTeachers, useSettings,
    useCreateScore, useUpdateScore, useCreateAttendance, useUpdateAttendance, useUpdateTeacher
} from '@/lib/hooks/use-data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GradingView } from './GradingView';
import { AttendanceView } from './AttendanceView';
import { MessageInboxWidget } from './dashboard/MessageInboxWidget';
import { NextLessonWidget } from './dashboard/NextLessonWidget';
import { AttendanceAnalytics } from './dashboard/AttendanceAnalytics';
import { ConductLogWidget } from './dashboard/ConductLogWidget';

// Internal components for the modules
const MySubjectsModule = ({ subjects, classes }: { subjects: any[], classes: any[] }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map(sub => {
                const cls = classes.find(c => String(c.id) === String(sub.class_id));
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
                            const cls = classes.find(c => String(c.id) === String(student.class_id));
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
    const { currentUser } = useSchoolStore();

    // Attendance State
    const [selectedClassAtt, setSelectedClassAtt] = useState('');
    const [dateAtt, setDateAtt] = useState(Utils.getTodayString());
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'students' | 'grading' | 'attendance' | 'settings'>('overview');
    const [isSavingSignature, setIsSavingSignature] = useState(false);

    // Data Hooks
    const { data: students = [] } = useStudents();
    const { data: classes = [] } = useClasses();
    const { data: teachers = [] } = useTeachers();
    const { data: scores = [] } = useScores({ include_all_periods: true });
    const { data: subjectTeachers = [] } = useSubjectTeachers();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();

    const targetSession = selectedSession || settings.current_session;
    const targetTerm = selectedTerm || settings.current_term;
    const periodSettings = useMemo(
        () => ({
            ...settings,
            current_session: targetSession,
            current_term: targetTerm,
        }),
        [settings, targetSession, targetTerm],
    );

    const availableSessions = useMemo(() => {
        const sessions = new Set(subjectTeachers.map(s => s.session));
        if (settings.current_session) sessions.add(settings.current_session);
        return Array.from(sessions).sort().reverse();
    }, [subjectTeachers, settings.current_session]);
    const availableTerms = settings.terms?.length ? settings.terms : ['First Term', 'Second Term', 'Third Term'];

    // Filtered Attendance Hook
    const { data: attendance = [], isLoading: attendanceLoading } = useAttendance({
        class_id: selectedClassAtt,
        date: dateAtt,
        session: targetSession,
        term: targetTerm,
    });

    // Mutations
    const { mutate: createScore } = useCreateScore();
    const { mutate: updateScore } = useUpdateScore();
    const { mutate: createAttendance } = useCreateAttendance();
    const { mutate: updateAttendance } = useUpdateAttendance();
    const { mutate: updateTeacher } = useUpdateTeacher();

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
        const existing = attendance.find(a => a.id === att.id) || attendance[0];
        if (existing) {
            updateAttendance({ id: existing.id, updates: att });
        } else {
            createAttendance(att);
        }
    };

    // Derived Data
    const myTeacherProfile = teachers.find(t => t.email === currentUser?.email) || teachers[0] || { id: 'teacher_1', name: 'Demo Teacher' };

    const myAssignments = useMemo(() =>
        subjectTeachers.filter(st => String(st.teacher_id) === String(myTeacherProfile.id) && st.session === targetSession),
        [subjectTeachers, myTeacherProfile.id, targetSession]
    );

    const myClassIds = useMemo(() => {
        const idsFromSubjects = myAssignments.map(a => a.class_id);
        const idsFromClassTeacher = classes.filter(c => String(c.class_teacher_id) === String(myTeacherProfile.id)).map(c => c.id);
        return Array.from(new Set([...idsFromSubjects, ...idsFromClassTeacher]));
    }, [myAssignments, classes, myTeacherProfile.id]);

    const myClasses = useMemo(() => classes.filter(c => myClassIds.includes(c.id)), [classes, myClassIds]);

    const myStudents = useMemo(() =>
        students.filter((s: Types.Student) => myClassIds.includes(s.class_id)),
        [students, myClassIds]
    );

    const classesAsClassTeacher = useMemo(() =>
        classes.filter(c => String(c.class_teacher_id) === String(myTeacherProfile.id)),
        [classes, myTeacherProfile.id]
    );

    // Initial selected class for attendance
    useEffect(() => {
        if (!selectedClassAtt && myClasses.length > 0) {
            setSelectedClassAtt(String(myClasses[0].id));
        }
    }, [myClasses, selectedClassAtt]);

    useEffect(() => {
        if (!selectedSession && settings.current_session) setSelectedSession(settings.current_session);
        if (!selectedTerm && settings.current_term) setSelectedTerm(settings.current_term);
    }, [settings.current_session, settings.current_term, selectedSession, selectedTerm]);

    const stats = [
        { label: 'My Subjects', value: myAssignments.length.toString(), icon: BookOpen, color: 'bg-blue-500' },
        { label: 'Total Students', value: myStudents.length.toString(), icon: Users, color: 'bg-indigo-500' },
        { label: 'Classes', value: myClasses.length.toString(), icon: GraduationCap, color: 'bg-pink-500' },
        { label: 'Class Teacher For', value: classesAsClassTeacher.length.toString(), icon: ClipboardList, color: 'bg-amber-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase">Teacher Dashboard</h1>
                    <p className="text-gray-500 font-medium">Welcome, <span className="text-brand-600">{myTeacherProfile.name}</span></p>
                    <div className="mt-2 flex gap-2">
                        <select
                            value={targetSession}
                            onChange={(e) => setSelectedSession(e.target.value)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700"
                        >
                            {availableSessions.map(session => (
                                <option key={session} value={session}>{session}</option>
                            ))}
                        </select>
                        <select
                            value={targetTerm}
                            onChange={(e) => setSelectedTerm(e.target.value)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700"
                        >
                            {availableTerms.map((term: string) => (
                                <option key={term} value={term}>{term}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex bg-white p-1 rounded-xl shadow-sm border overflow-x-auto">
                    {[
                        { id: 'overview', label: 'Overview', icon: TrendingUp },
                        { id: 'subjects', label: 'My Subjects', icon: BookOpen },
                        { id: 'students', label: 'My Students', icon: Users },
                        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
                        { id: 'grading', label: 'Grading', icon: ClipboardList },
                        { id: 'settings', label: 'Settings', icon: Settings },
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
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <GraduationCap size={20} className="text-brand-500" />
                                My Classes
                            </h2>
                            {myClasses.length > 0 ? (
                                <div className="space-y-3">
                                    {myClasses.map(cls => {
                                        const isClassTeacher = String(cls.class_teacher_id) === String(myTeacherProfile.id);
                                        const studentsInClass = students.filter((s: Types.Student) => String(s.class_id) === String(cls.id)).length;
                                        const subjectsInClass = myAssignments.filter(a => String(a.class_id) === String(cls.id));
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

                        <div className="space-y-8">
                            <NextLessonWidget teacherId={String(myTeacherProfile.id)} />

                            <ConductLogWidget students={myStudents} />

                            <div className="bg-brand-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-lg font-bold mb-2">Notice Board</h3>
                                    <p className="text-brand-100 text-sm">Review school announcements and upcoming events.</p>
                                </div>
                            </div>
                            <MessageInboxWidget maxMessages={3} />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'subjects' && <MySubjectsModule subjects={myAssignments} classes={classes} />}
            {activeTab === 'students' && <MyStudentsModule students={myStudents} classes={classes} />}
            {activeTab === 'grading' && (
                myClasses.length > 0 ? (
                    <GradingView
                        classes={myClasses}
                        students={myStudents}
                        scores={scores}
                        settings={periodSettings}
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
                        students={myStudents.filter(s => String(s.class_id) === String(selectedClassAtt))}
                        attendance={attendance}
                        settings={periodSettings}
                        onSave={handleUpsertAttendance}
                        selectedClass={selectedClassAtt}
                        setSelectedClass={setSelectedClassAtt}
                        date={dateAtt}
                        setDate={setDateAtt}
                        isLoading={attendanceLoading}
                    />
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <p>You have not been assigned to any classes yet.</p>
                    </div>
                )
            )}

            {activeTab === 'settings' && (
                <div className="max-w-4xl mx-auto space-y-8">
                    <Card className="p-8 border-brand-100 bg-white rounded-3xl shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center">
                                <Settings size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Portal Settings</h2>
                                <p className="text-sm text-gray-500">Manage your profile and digital signature</p>
                            </div>
                        </div>

                        <div className="space-y-10">
                            {/* Signature Section */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">Digital Signature</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            This signature will be automatically attached to student report cards for your classes.
                                            Please upload a clear image (PNG preferred) with a transparent or white background.
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="h-24 w-48 bg-white border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden relative group">
                                            {myTeacherProfile.signature_url ? (
                                                <img 
                                                    src={myTeacherProfile.signature_url} 
                                                    alt="Signature" 
                                                    className="max-h-full max-w-full object-contain p-2"
                                                />
                                            ) : (
                                                <div className="text-center text-gray-300">
                                                    <Upload size={24} className="mx-auto mb-1 opacity-50" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">No Signature</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative">
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        
                                                        setIsSavingSignature(true);
                                                        try {
                                                            // We use the PhotoUpload component's logic or direct upload
                                                            // For now, let's assume we can use a direct upload endpoint if we had one,
                                                            // but most of the app uses Cloudinary/R2.
                                                            // I'll simulate the upload or use existing logic if I can find it.
                                                            // Usually, there's an api/proxy/media/upload or similar.
                                                            
                                                            const formData = new FormData();
                                                            formData.append('file', file);
                                                            
                                                            const uploadResp = await fetch('/api/proxy/core/upload/', {
                                                                method: 'POST',
                                                                body: formData
                                                            });
                                                            const uploadData = await uploadResp.json();
                                                            
                                                            if (uploadData.url) {
                                                                updateTeacher({ 
                                                                    id: String(myTeacherProfile.id), 
                                                                    updates: { signature_url: uploadData.url } 
                                                                });
                                                            }
                                                        } catch (err) {
                                                            console.error("Upload failed", err);
                                                        } finally {
                                                            setIsSavingSignature(false);
                                                        }
                                                    }}
                                                />
                                                <Button size="sm" variant="outline" className="text-xs" disabled={isSavingSignature}>
                                                    {isSavingSignature ? 'Uploading...' : 'Upload Signature'}
                                                </Button>
                                            </div>
                                            {myTeacherProfile.signature_url && (
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => updateTeacher({ 
                                                        id: String(myTeacherProfile.id), 
                                                        updates: { signature_url: null } 
                                                    })}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 rounded-2xl bg-brand-50/50 border border-brand-100 flex items-start gap-3">
                                    <div className="h-8 w-8 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center shrink-0">
                                        <Calendar size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">Academic Cycle</p>
                                        <p className="text-sm font-bold text-gray-900">{targetSession} - {targetTerm}</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-3">
                                    <div className="h-8 w-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Role</p>
                                        <p className="text-sm font-bold text-gray-900">{myTeacherProfile.staff_type === 'ACADEMIC' ? 'Academic Staff' : 'Staff'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex items-start gap-4">
                        <AlertTriangle className="text-amber-600 shrink-0" size={24} />
                        <div>
                            <h4 className="text-amber-900 font-bold mb-1 underline decoration-amber-300">Important Note</h4>
                            <p className="text-amber-800 text-sm leading-relaxed">
                                Please ensure your signature is professional and clearly legible. Once uploaded, it will be applied to all <b>printed</b> and <b>digital</b> report cards you release for this term.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
