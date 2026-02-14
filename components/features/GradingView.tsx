/**
 * GradingView
 * 
 * Main grading view with tab navigation. Manages shared state and handlers,
 * delegates UI rendering to extracted tab components.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Shield } from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { GradingSchemeManager } from './grading/GradingSchemeManager';
import { SubjectTeacherManager } from './grading/SubjectTeacherManager';
import { ScoreEntryTab } from './grading/ScoreEntryTab';
import { SkillsTab } from './grading/SkillsTab';
import { ReportPreviewTab } from './grading/ReportPreviewTab';
import apiClient from '@/lib/api-client';
import { PublishTab } from './grading/PublishTab';
import { useSchoolStore } from '@/lib/store';
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
    students, classes, scores, settings, onUpsertScore, currentRole = 'admin'
}) => {
    const { currentUser } = useSchoolStore();
    const { addToast } = useToast();

    const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '');
    const currentClass = classes.find(c => c.id === selectedClass);
    const classSubjects = Utils.getSubjectsForClass(currentClass);

    const [selectedSubject, setSelectedSubject] = useState(classSubjects[0] || '');
    const [activeTab, setActiveTab] = useState<'broadsheet' | 'report' | 'skills' | 'publish' | 'schemes' | 'assignments'>('broadsheet');
    const [reportStudentId, setReportStudentId] = useState('');

    const activeStudents = students.filter(s => s.class_id === selectedClass);

    // Ensure selectedClass is set when classes load
    useEffect(() => {
        if (classes.length > 0 && !selectedClass) {
            setSelectedClass(classes[0].id);
        }
    }, [classes, selectedClass]);

    useEffect(() => {
        if (classSubjects.length > 0 && !classSubjects.includes(selectedSubject)) {
            setSelectedSubject(classSubjects[0]);
        }
    }, [selectedClass, classSubjects, selectedSubject]);

    // Use a debounced upsert to avoid too many API calls
    const debouncedUpsert = useMemo(
        () => Utils.debounce((score: Types.Score) => onUpsertScore(score), 1000),
        [onUpsertScore]
    );

    const handleScoreChange = (studentId: string, field: 'ca1' | 'ca2' | 'exam', value: number) => {
        let score = scores.find(s => s.student_id === studentId && s.session === settings.current_session && s.term === settings.current_term);

        let newScore = score ? JSON.parse(JSON.stringify(score)) : {
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
            psychomotor: {}
        };

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
        let score = scores.find(s => s.student_id === studentId && s.session === settings.current_session && s.term === settings.current_term);

        let newScore = score ? { ...score, [category]: { ...score[category] } } : {
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
            psychomotor: {}
        };

        if (!newScore[category]) newScore[category] = {};
        newScore[category][trait] = value;
        debouncedUpsert(newScore);
    };

    const handleScoreFieldChange = (studentId: string, field: keyof Types.Score, value: any) => {
        let score = scores.find(s => s.student_id === studentId && s.session === settings.current_session && s.term === settings.current_term);

        let newScore = score ? { ...score } : {
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
            psychomotor: {}
        };

        if (newScore[field] !== value) {
            (newScore as any)[field] = value;
            debouncedUpsert(newScore);
        }
    };

    const handleMagicRemark = async (studentId: string) => {
        const score = scores.find(s => s.student_id === studentId && s.session === settings.current_session && s.term === settings.current_term);
        if (!score?.id) {
            addToast('Please enter some scores or traits first before generating an AI remark', 'warning');
            return;
        }

        try {
            const res = await apiClient.post(`/reports/${score.id}/suggest-remark/`);
            if (res.data?.suggestion) {
                handleScoreFieldChange(studentId, 'teacher_remark', res.data.suggestion);
                addToast('AI Remark generated successfully!', 'success');
            }
        } catch (e) {
            addToast('Failed to generate AI remark. Please try again later.', 'error');
        }
    };

    const getRow = (studentId: string) => {
        const score = scores.find(s => s.student_id === studentId && s.session === settings.current_session && s.term === settings.current_term);
        return score?.rows.find(r => r.subject === selectedSubject) || { ca1: 0, ca2: 0, exam: 0, total: 0, grade: '-', comment: '-' };
    };

    // Compute preview score for single student view
    const previewScore = useMemo(() => {
        if (!reportStudentId || reportStudentId === 'all') return null;

        const score = scores.find(s =>
            s.student_id === reportStudentId &&
            s.session === settings.current_session &&
            s.term === settings.current_term
        );

        if (score) return score;

        return {
            id: 'temp',
            student_id: reportStudentId,
            class_id: selectedClass,
            session: settings.current_session,
            term: settings.current_term,
            rows: [],
            average: 0,
            created_at: Date.now(),
            updated_at: Date.now(),
            affective: {},
            psychomotor: {},
        } as Types.Score;
    }, [reportStudentId, scores, settings.current_session, settings.current_term, selectedClass, students]);

    const selectedStudent = useMemo(() => {
        if (!reportStudentId || reportStudentId === 'all') return null;
        return students.find(s => s.id === reportStudentId) || null;
    }, [reportStudentId, students]);

    const handlePrint = () => {
        const reportCard = document.getElementById('report-card');
        if (!reportCard) { alert('Report card not found'); return; }

        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) { alert('Please allow pop-ups to print'); return; }

        const content = reportCard.cloneNode(true) as HTMLElement;
        const allStyles = Array.from(document.styleSheets)
            .map(sheet => { try { return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n'); } catch { return ''; } })
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
                    .opacity-\\[0\\.03\\] { opacity: 0.03 !important; }
                    .opacity-\\[0\\.05\\] { opacity: 0.05 !important; }
                    .print\\:hidden { display: none !important; }
                    img { max-width: 100% !important; height: auto !important; }
                    .shadow-lg { box-shadow: none !important; }
                    .border { border: 1px solid #e5e7eb !important; }
                </style>
            </head>
            <body>
                ${content.outerHTML}
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.onload = () => { setTimeout(() => { printWindow.print(); }, 800); };
    };

    // Pass/Unpublish report cards for a class
    const handlePassReportCards = (pass: boolean) => {
        const classScores = scores.filter(s =>
            s.class_id === selectedClass &&
            s.session === settings.current_session &&
            s.term === settings.current_term
        );

        if (classScores.length === 0) { addToast('No scores found for this class', 'warning'); return; }

        classScores.forEach(score => {
            const updatedScore: Types.Score = {
                ...score,
                is_passed: pass,
                passed_at: pass ? Date.now() : undefined,
                passed_by: pass ? currentUser?.id : undefined,
                updated_at: Date.now()
            };
            onUpsertScore(updatedScore);
        });

        addToast(
            pass ? `Report cards published for ${classScores.length} students` : `Report cards unpublished for ${classScores.length} students`,
            pass ? 'success' : 'info'
        );
    };

    // Pass individual student report card
    const handlePassSingleReport = (studentId: string, pass: boolean) => {
        const score = scores.find(s =>
            s.student_id === studentId &&
            s.session === settings.current_session &&
            s.term === settings.current_term
        );

        if (!score) { addToast('No score found for this student', 'warning'); return; }

        const updatedScore: Types.Score = {
            ...score,
            is_passed: pass,
            passed_at: pass ? Date.now() : undefined,
            passed_by: pass ? currentUser?.id : undefined,
            updated_at: Date.now()
        };
        onUpsertScore(updatedScore);

        const student = students.find(s => s.id === studentId);
        addToast(
            pass ? `Report card published for ${student?.names}` : `Report card unpublished for ${student?.names}`,
            pass ? 'success' : 'info'
        );
    };

    // Get class publish status
    const classPublishStatus = useMemo(() => {
        const classScores = scores.filter(s =>
            s.class_id === selectedClass &&
            s.session === settings.current_session &&
            s.term === settings.current_term
        );
        const passedCount = classScores.filter(s => s.is_passed).length;
        const totalCount = classScores.length;
        return {
            passedCount,
            totalCount,
            allPassed: totalCount > 0 && passedCount === totalCount,
            nonePassed: passedCount === 0
        };
    }, [scores, selectedClass, settings.current_session, settings.current_term]);

    return (
        <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Academic Grading</h1>
                <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto w-full sm:w-auto">
                    <button onClick={() => setActiveTab('broadsheet')} className={`px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'broadsheet' ? 'bg-white shadow text-brand-700' : 'text-gray-600'}`}>Score Entry</button>
                    <button onClick={() => setActiveTab('skills')} className={`px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'skills' ? 'bg-white shadow text-brand-700' : 'text-gray-600'}`}>Skills</button>
                    <button onClick={() => setActiveTab('report')} className={`px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'report' ? 'bg-white shadow text-brand-700' : 'text-gray-600'}`}>Report Cards</button>
                    {currentRole === 'admin' && (
                        <>
                            <button onClick={() => setActiveTab('publish')} className={`px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-md flex items-center gap-1 whitespace-nowrap ${activeTab === 'publish' ? 'bg-white shadow text-brand-700' : 'text-gray-600'}`}>
                                <Shield className="h-3 w-3 lg:h-4 lg:w-4" />
                                Publish
                            </button>
                            <button onClick={() => setActiveTab('schemes')} className={`px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'schemes' ? 'bg-white shadow text-brand-700' : 'text-gray-600'}`}>
                                Schemes
                            </button>
                            <button onClick={() => setActiveTab('assignments')} className={`px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'assignments' ? 'bg-white shadow text-brand-700' : 'text-gray-600'}`}>
                                Assignments
                            </button>
                        </>
                    )}
                </div>
            </div>

            {activeTab === 'assignments' && <SubjectTeacherManager />}
            {activeTab === 'schemes' && <GradingSchemeManager />}

            {activeTab === 'broadsheet' && (
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
