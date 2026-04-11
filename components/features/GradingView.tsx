/**
 * GradingView
 *
 * Main grading view with tab navigation. Manages shared state and handlers,
 * delegates UI rendering to extracted tab components.
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    Shield,
    ClipboardList,
    Sparkles,
    FileText,
    Send,
    Settings2,
    Users2,
    GraduationCap,
} from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { GradingSchemeManager } from './grading/GradingSchemeManager';
import { SubjectTeacherManager } from './grading/SubjectTeacherManager';
import { ScoreEntryTab } from './grading/ScoreEntryTab';
import { EarlyYearsEntryTab } from './grading/EarlyYearsEntryTab';
import { SkillsTab } from './grading/SkillsTab';
import { ReportPreviewTab } from './grading/ReportPreviewTab';
import apiClient from '@/lib/api-client';
import { PublishTab } from './grading/PublishTab';
import { useToast } from '@/components/providers/toast-provider';

interface GradingViewProps {
    students: Types.Student[];
    classes: Types.Class[];
    scores: Types.Score[];
    settings: Types.Settings;
    onUpsertScore: (score: Types.Score) => void;
    currentRole?: string;
}

export const GradingView: React.FC<GradingViewProps> = ({
    students,
    classes,
    scores,
    settings,
    onUpsertScore,
    currentRole = 'admin',
}) => {
    const { addToast } = useToast();

    const [selectedClass, setSelectedClass] = useState(String(classes[0]?.id || ''));
    const currentClass = classes.find(c => Utils.sameId(c.id, selectedClass));
    const classSubjects = Utils.getSubjectsForClass(currentClass);
    const isEarlyYears = Utils.isEarlyYearsClass(currentClass);

    const [selectedSubject, setSelectedSubject] = useState(classSubjects[0] || '');
    const [activeTab, setActiveTab] = useState<'broadsheet' | 'report' | 'skills' | 'publish' | 'schemes' | 'assignments'>('broadsheet');
    const [reportStudentId, setReportStudentId] = useState('');

    const activeStudents = students.filter(s => Utils.sameId(s.class_id, selectedClass));

    useEffect(() => {
        if (classes.length > 0 && !selectedClass) {
            setSelectedClass(String(classes[0].id));
        }
    }, [classes, selectedClass]);

    useEffect(() => {
        if (classSubjects.length > 0 && !classSubjects.includes(selectedSubject)) {
            setSelectedSubject(classSubjects[0]);
        }
    }, [selectedClass, classSubjects, selectedSubject]);

    const classScoresForTerm = useMemo(
        () =>
            scores.filter(
                s =>
                    Utils.sameId(s.class_id, selectedClass) &&
                    s.session === settings.current_session &&
                    s.term === settings.current_term
            ),
        [scores, selectedClass, settings.current_session, settings.current_term]
    );

    const publishedCount = useMemo(() => classScoresForTerm.filter(s => s.is_passed).length, [classScoresForTerm]);

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const createEmptyScore = useCallback(
        (studentId: string): Types.Score => ({
            id: Utils.generateId(),
            student_id: studentId,
            class_id: selectedClass,
            session: settings.current_session,
            term: settings.current_term,
            rows: [],
            average: 0,
            created_at: Date.now(),
            updated_at: Date.now(),
            affective: {},
            psychomotor: {},
            early_years_observations: [],
        }),
        [selectedClass, settings.current_session, settings.current_term]
    );
    const debouncedUpsert = useCallback(
        (score: Types.Score) => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            debounceTimerRef.current = setTimeout(() => {
                onUpsertScore(score);
            }, 1000);
        },
        [onUpsertScore]
    );

    const cancelDebouncedUpsert = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            cancelDebouncedUpsert();
        };
    }, [cancelDebouncedUpsert]);

    const handleScoreChange = (studentId: string, field: 'ca1' | 'ca2' | 'exam', value: number) => {
        const score = scores.find(
            s => s.student_id === studentId && s.session === settings.current_session && s.term === settings.current_term
        );

        const newScore = score ? JSON.parse(JSON.stringify(score)) : createEmptyScore(studentId);

        let rowIndex = newScore.rows.findIndex((r: any) => r.subject === selectedSubject);
        if (rowIndex === -1) {
            newScore.rows.push({ subject: selectedSubject, ca1: 0, ca2: 0, exam: 0, total: 0, grade: 'F', comment: '' });
            rowIndex = newScore.rows.length - 1;
        }

        const row = newScore.rows[rowIndex];
        (row as any)[field] = value;
        row.total = row.ca1 + row.ca2 + row.exam;

        const { grade, comment } = Utils.calculateGrade(row.total);
        row.grade = grade;
        row.comment = comment;

        const totalScore = newScore.rows.reduce((acc: number, r: any) => acc + r.total, 0);
        newScore.average = totalScore / newScore.rows.length;
        newScore.total_score = totalScore;

        debouncedUpsert(newScore);
    };

    const handleTraitChange = (studentId: string, category: 'affective' | 'psychomotor', trait: string, value: number) => {
        const score = scores.find(
            s => s.student_id === studentId && s.session === settings.current_session && s.term === settings.current_term
        );

        const newScore = score ? { ...score, [category]: { ...score[category] } } : createEmptyScore(studentId);

        if (!newScore[category]) newScore[category] = {};
        newScore[category][trait] = value;
        debouncedUpsert(newScore);
    };

    const handleScoreFieldChange = (studentId: string, field: keyof Types.Score, value: any) => {
        const score = scores.find(
            s => s.student_id === studentId && s.session === settings.current_session && s.term === settings.current_term
        );

        const newScore = score ? { ...score } : createEmptyScore(studentId);

        if (newScore[field] !== value) {
            (newScore as any)[field] = value;
            debouncedUpsert(newScore);
        }
    };

    const handleMagicRemark = async (
        studentId: string,
        targetField: 'teacher_remark' | 'head_teacher_remark' = 'teacher_remark'
    ): Promise<string | null> => {
        const score = scores.find(
            s => s.student_id === studentId && s.session === settings.current_session && s.term === settings.current_term
        );

        if (!score?.id) {
            addToast('Please enter some scores or traits first before generating an AI remark', 'warning');
            return null;
        }

        try {
            const res = await apiClient.post(`/reports/${score.id}/suggest-remark/`);
            if (res.data?.suggestion) {
                handleScoreFieldChange(studentId, targetField, res.data.suggestion);
                addToast(
                    targetField === 'teacher_remark'
                        ? 'AI class-teacher remark generated successfully!'
                        : 'AI head-teacher remark generated successfully!',
                    'success'
                );
                return res.data.suggestion;
            }
            return null;
        } catch {
            addToast('Failed to generate AI remark. Please try again later.', 'error');
            return null;
        }
    };

    const getRow = (studentId: string) => {
        const score = scores.find(
            s => s.student_id === studentId && s.session === settings.current_session && s.term === settings.current_term
        );

        return score?.rows.find(r => r.subject === selectedSubject) || { ca1: 0, ca2: 0, exam: 0, total: 0, grade: '-', comment: '-' };
    };

    const previewScore = useMemo(() => {
        if (!reportStudentId || reportStudentId === 'all') return null;

        const score = scores.find(
            s => s.student_id === reportStudentId && s.session === settings.current_session && s.term === settings.current_term
        );

        if (score) return score;

        return { ...createEmptyScore(reportStudentId), id: 'temp' } as Types.Score;
    }, [reportStudentId, scores, createEmptyScore]);

    const selectedStudent = useMemo(() => {
        if (!reportStudentId || reportStudentId === 'all') return null;
        return students.find(s => s.id === reportStudentId) || null;
    }, [reportStudentId, students]);

    const handlePrint = () => {
        const reportCard = document.getElementById('report-card');
        if (!reportCard) {
            alert('Report card not found');
            return;
        }

        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            alert('Please allow pop-ups to print');
            return;
        }

        const content = reportCard.cloneNode(true) as HTMLElement;
        const allStyles = Array.from(document.styleSheets)
            .map(sheet => {
                try {
                    return Array.from(sheet.cssRules)
                        .map(rule => rule.cssText)
                        .join('\n');
                } catch {
                    return '';
                }
            })
            .join('\n');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Report Card - ${settings.school_name}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
                <style>
                    ${allStyles}
                    @page { size: A4; margin: 10mm; }
                    body { font-family: 'Inter', sans-serif; background: white !important; padding: 0 !important; margin: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .absolute { position: absolute !important; }
                    .inset-0 { top: 0 !important; right: 0 !important; bottom: 0 !important; left: 0 !important; }
                    .pointer-events-none { pointer-events: none !important; }
                    [class*="opacity-"] { opacity: inherit !important; }
                    .print\\:hidden { display: none !important; }
                    img { max-width: 100% !important; height: auto !important; }
                    .shadow-lg, .shadow-xl, .shadow-2xl { box-shadow: none !important; }
                    .border { border: 1px solid #e5e7eb !important; }
                </style>
            </head>
            <body>
                ${content.outerHTML}
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
            }, 800);
        };
    };

    const handlePassReportCards = (pass: boolean) => {
        if (classScoresForTerm.length === 0) {
            addToast('No scores found for this class', 'warning');
            return;
        }

        // Prevent stale pending autosaves from immediately overriding publish status.
        cancelDebouncedUpsert();

        classScoresForTerm.forEach(score => {
            const updatedScore: Types.Score = {
                ...score,
                is_passed: pass,
                passed_at: pass ? new Date().toISOString() : undefined,
                passed_by: pass ? score.passed_by : undefined,
            };
            onUpsertScore(updatedScore);
        });

        addToast(
            pass
                ? `Report cards published for ${classScoresForTerm.length} students`
                : `Report cards unpublished for ${classScoresForTerm.length} students`,
            pass ? 'success' : 'info'
        );
    };

    const handlePassSingleReport = (studentId: string, pass: boolean) => {
        const score = scores.find(
            s => s.student_id === studentId && s.session === settings.current_session && s.term === settings.current_term
        );

        if (!score) {
            addToast('No score found for this student', 'warning');
            return;
        }

        // Prevent stale pending autosaves from immediately overriding publish status.
        cancelDebouncedUpsert();

        const updatedScore: Types.Score = {
            ...score,
            is_passed: pass,
            passed_at: pass ? new Date().toISOString() : undefined,
            passed_by: pass ? score.passed_by : undefined,
        };

        onUpsertScore(updatedScore);

        const student = students.find(s => s.id === studentId);
        addToast(
            pass ? `Report card published for ${student?.names}` : `Report card unpublished for ${student?.names}`,
            pass ? 'success' : 'info'
        );
    };

    const classPublishStatus = useMemo(() => {
        const passedCount = classScoresForTerm.filter(s => s.is_passed).length;
        const totalCount = classScoresForTerm.length;

        return {
            passedCount,
            totalCount,
            allPassed: totalCount > 0 && passedCount === totalCount,
            nonePassed: passedCount === 0,
        };
    }, [classScoresForTerm]);

    const tabs = [
        {
            key: 'broadsheet' as const,
            label: isEarlyYears ? 'Early Years' : 'Score Entry',
            subtitle: isEarlyYears ? 'Capture narrative observations' : 'Capture CA and exam scores',
            icon: ClipboardList,
            adminOnly: false,
        },
        {
            key: 'skills' as const,
            label: 'Skills & Remarks',
            subtitle: 'Behavior ratings and comments',
            icon: Sparkles,
            adminOnly: false,
        },
        {
            key: 'report' as const,
            label: 'Report Cards',
            subtitle: 'Preview, print and export',
            icon: FileText,
            adminOnly: false,
        },
        {
            key: 'publish' as const,
            label: 'Publish',
            subtitle: 'Control result visibility',
            icon: Send,
            adminOnly: true,
        },
        {
            key: 'schemes' as const,
            label: 'Schemes',
            subtitle: 'Configure grade boundaries',
            icon: Settings2,
            adminOnly: true,
        },
        {
            key: 'assignments' as const,
            label: 'Assignments',
            subtitle: 'Manage subject teachers',
            icon: Users2,
            adminOnly: true,
        },
    ];

    const visibleTabs = tabs.filter(tab => !tab.adminOnly || currentRole === 'admin');

    return (
        <div className="space-y-5 lg:space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-white no-print">
                <div className="absolute -top-20 -right-10 h-64 w-64 rounded-full bg-brand-100/70 blur-3xl" />
                <div className="absolute -bottom-24 left-20 h-64 w-64 rounded-full bg-accent-100/60 blur-3xl" />

                <div className="relative flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">
                            <GraduationCap className="h-3.5 w-3.5" />
                            Grading Center
                        </p>
                        <h1 className="mt-3 text-2xl font-bold text-gray-900">Academic Grading</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {currentClass?.name || 'No class selected'} | {settings.current_term} | {settings.current_session}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-700">Students</p>
                            <p className="mt-1 text-lg font-bold text-cyan-900">{activeStudents.length}</p>
                        </div>
                        <div className="rounded-2xl border border-brand-100 bg-brand-50 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-brand-700">Subjects</p>
                            <p className="mt-1 text-lg font-bold text-brand-900">{classSubjects.length}</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-700">Published</p>
                            <p className="mt-1 text-lg font-bold text-emerald-900">{publishedCount}</p>
                        </div>
                        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-amber-700">Pending</p>
                            <p className="mt-1 text-lg font-bold text-amber-900">{Math.max(0, classScoresForTerm.length - publishedCount)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 no-print">
                {visibleTabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;

                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`group rounded-2xl border px-4 py-3 text-left transition-all ${
                                isActive
                                    ? 'border-brand-300 bg-gradient-to-br from-brand-50 to-white shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-brand-200 hover:shadow-sm'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={`rounded-xl p-2 ${
                                        isActive ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-brand-100 group-hover:text-brand-700'
                                    }`}
                                >
                                    {tab.key === 'publish' ? <Shield className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                                </div>
                                <div>
                                    <p className={`text-sm font-semibold ${isActive ? 'text-brand-900' : 'text-gray-800'}`}>{tab.label}</p>
                                    <p className="text-xs text-gray-500">{tab.subtitle}</p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {activeTab === 'assignments' && <SubjectTeacherManager />}
            {activeTab === 'schemes' && <GradingSchemeManager />}

            {activeTab === 'broadsheet' && (
                isEarlyYears ? (
                    <EarlyYearsEntryTab
                        classes={classes}
                        selectedClass={selectedClass}
                        setSelectedClass={setSelectedClass}
                        activeStudents={activeStudents}
                        reportStudentId={reportStudentId}
                        setReportStudentId={setReportStudentId}
                        scores={scores}
                        settings={settings}
                        handleScoreFieldChange={handleScoreFieldChange}
                    />
                ) : (
                    <ScoreEntryTab
                        classes={classes}
                        selectedClass={selectedClass}
                        setSelectedClass={setSelectedClass}
                        selectedSubject={selectedSubject}
                        setSelectedSubject={setSelectedSubject}
                        classSubjects={classSubjects}
                        activeStudents={activeStudents}
                        getRow={getRow}
                        handleScoreChange={handleScoreChange}
                    />
                )
            )}

            {activeTab === 'skills' && (
                <SkillsTab
                    classes={classes}
                    selectedClass={selectedClass}
                    setSelectedClass={setSelectedClass}
                    activeStudents={activeStudents}
                    reportStudentId={reportStudentId}
                    setReportStudentId={setReportStudentId}
                    scores={scores}
                    settings={settings}
                    handleTraitChange={handleTraitChange}
                    handleScoreFieldChange={handleScoreFieldChange}
                    onMagicRemark={handleMagicRemark}
                />
            )}

            {activeTab === 'report' && (
                <ReportPreviewTab
                    classes={classes}
                    selectedClass={selectedClass}
                    setSelectedClass={setSelectedClass}
                    activeStudents={activeStudents}
                    reportStudentId={reportStudentId}
                    setReportStudentId={setReportStudentId}
                    scores={scores}
                    settings={settings}
                    classSubjects={classSubjects}
                    currentClass={currentClass}
                    previewScore={previewScore}
                    selectedStudent={selectedStudent}
                    handlePrint={handlePrint}
                />
            )}

            {activeTab === 'publish' && currentRole === 'admin' && (
                <PublishTab
                    classes={classes}
                    selectedClass={selectedClass}
                    setSelectedClass={setSelectedClass}
                    activeStudents={activeStudents}
                    scores={scores}
                    settings={settings}
                    classSubjects={classSubjects}
                    classPublishStatus={classPublishStatus}
                    handlePassReportCards={handlePassReportCards}
                    handlePassSingleReport={handlePassSingleReport}
                />
            )}
        </div>
    );
};
