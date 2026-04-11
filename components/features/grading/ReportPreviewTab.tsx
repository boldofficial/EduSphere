/**
 * Report Preview Tab
 *
 * Student selection sidebar + inline report card preview with print support.
 */
import React, { useMemo, useState } from 'react';
import { ChevronRight, Printer, Users, Eye, Copy } from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ReportCardTemplate } from './ReportCardTemplate';
import { ReportCardPDF } from './ReportCardPDF';
import { useToast } from '@/components/providers/toast-provider';

interface ReportPreviewTabProps {
    classes: Types.Class[];
    selectedClass: string;
    setSelectedClass: (id: string) => void;
    activeStudents: Types.Student[];
    reportStudentId: string;
    setReportStudentId: (id: string) => void;
    scores: Types.Score[];
    settings: Types.Settings;
    classSubjects: string[];
    currentClass: Types.Class | undefined;
    previewScore: Types.Score | null;
    selectedStudent: Types.Student | null;
    handlePrint: () => void;
}

export const ReportPreviewTab: React.FC<ReportPreviewTabProps> = ({
    classes,
    selectedClass,
    setSelectedClass,
    activeStudents,
    reportStudentId,
    setReportStudentId,
    scores,
    settings,
    classSubjects,
    currentClass,
    previewScore,
    selectedStudent,
    handlePrint,
}) => {
    const [isCopyingParentNote, setIsCopyingParentNote] = useState(false);
    const { addToast } = useToast();

    const historyByStudentId = useMemo(() => {
        const grouped: Record<string, Types.Score[]> = {};
        scores.forEach(score => {
            if (!grouped[score.student_id]) grouped[score.student_id] = [];
            grouped[score.student_id].push(score);
        });
        return grouped;
    }, [scores]);

    const buildStudentHistory = (studentId: string) => historyByStudentId[studentId] || [];

    const publishStats = useMemo(() => {
        const classScores = scores.filter(
            s =>
                Utils.sameId(s.class_id, selectedClass) &&
                s.session === settings.current_session &&
                s.term === settings.current_term
        );
        const published = classScores.filter(s => s.is_passed).length;

        return {
            published,
            total: classScores.length,
        };
    }, [scores, selectedClass, settings.current_session, settings.current_term]);

    const handleCopyParentSummary = async () => {
        if (!selectedStudent || !previewScore || reportStudentId === 'all') {
            addToast('Select one student to copy a parent summary', 'warning');
            return;
        }
        const isEarlyYears = currentClass ? (currentClass.report_mode === 'early_years' || currentClass.category === 'Nursery') : false;

        const attendancePresent = previewScore.attendance_present || 0;
        const attendanceTotal = previewScore.attendance_total || 0;
        const attendancePercent = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 0;
        const secureCount = (previewScore.early_years_observations || []).filter(item => item.status === 'Secure').length;
        const developingCount = (previewScore.early_years_observations || []).filter(item => item.status === 'Developing').length;
        const emergingCount = (previewScore.early_years_observations || []).filter(item => item.status === 'Emerging').length;

        const parentSummary = [
            `${settings.school_name || 'School'} - Progress Update`,
            `Student: ${selectedStudent.names}`,
            `Class: ${currentClass?.name || '-'}`,
            `Session/Term: ${settings.current_session} / ${settings.current_term}`,
            isEarlyYears
                ? `Development Snapshot: Secure ${secureCount}, Developing ${developingCount}, Emerging ${emergingCount}`
                : `Average Score: ${(previewScore.average || 0).toFixed(1)}%`,
            `Attendance: ${attendancePresent}/${attendanceTotal} (${attendancePercent}%)`,
            `Teacher Remark: ${previewScore.teacher_remark || 'Steady progress this term.'}`,
            `Head Remark: ${previewScore.head_teacher_remark || 'Keep striving for excellence.'}`,
            '',
            'Kindly check the attached PDF report card for full details.',
        ].join('\n');

        setIsCopyingParentNote(true);
        try {
            const clipboard = globalThis?.navigator?.clipboard;
            if (clipboard?.writeText) {
                await clipboard.writeText(parentSummary);
                addToast('Parent summary copied. You can paste it into WhatsApp/SMS/email.', 'success');
            } else {
                addToast('Clipboard is not available in this browser', 'warning');
            }
        } catch {
            addToast('Failed to copy parent summary. Please try again.', 'error');
        } finally {
            setIsCopyingParentNote(false);
        }
    };

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 print:block">
            <div className="space-y-4 no-print lg:col-span-1">
                <div className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 px-5 py-4 text-white">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.14em]">Report Selection</h3>
                        <p className="mt-1 text-xs text-white/75">Preview one student or generate all reports.</p>
                    </div>

                    <div className="space-y-5 p-5">
                        <Select
                            label="Class"
                            value={selectedClass}
                            onChange={e => {
                                setSelectedClass(e.target.value);
                                setReportStudentId('');
                            }}
                        >
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </Select>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-3">
                                <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-700">Students</p>
                                <p className="mt-1 text-lg font-bold text-cyan-900">{activeStudents.length}</p>
                            </div>
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                                <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-700">Published</p>
                                <p className="mt-1 text-lg font-bold text-emerald-900">{publishStats.published}/{publishStats.total}</p>
                            </div>
                        </div>

                        <div className="max-h-[420px] overflow-y-auto rounded-2xl border border-gray-200">
                            <button
                                onClick={() => setReportStudentId('all')}
                                className={`flex w-full items-center justify-between border-b px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                                    reportStudentId === 'all'
                                        ? 'bg-brand-50 text-brand-700'
                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    All Students ({activeStudents.length})
                                </span>
                                <ChevronRight className="h-4 w-4 opacity-60" />
                            </button>

                            {activeStudents.map(student => (
                                <button
                                    key={student.id}
                                    onClick={() => setReportStudentId(student.id)}
                                    className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                                        reportStudentId === student.id
                                            ? 'bg-brand-50 text-brand-700 font-medium'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="truncate pr-2">{student.names}</span>
                                    <ChevronRight className="h-4 w-4 opacity-50" />
                                </button>
                            ))}
                        </div>

                        {reportStudentId && (
                            <div className="space-y-2 pt-1">
                                <ReportCardPDF
                                    reportId={reportStudentId !== 'all' ? previewScore?.id : undefined}
                                    classId={reportStudentId === 'all' ? selectedClass : undefined}
                                    session={settings.current_session}
                                    term={settings.current_term}
                                    studentName={selectedStudent?.names}
                                    schoolName={settings.school_name}
                                    variant="primary"
                                    label={reportStudentId === 'all' ? 'Bulk Download PDFs' : 'Download Parent PDF'}
                                    successMessage={
                                        reportStudentId === 'all'
                                            ? 'Bulk report cards downloaded successfully'
                                            : 'Parent-ready report card downloaded successfully'
                                    }
                                />
                                <Button
                                    variant="secondary"
                                    className="w-full flex items-center justify-center gap-2"
                                    onClick={handlePrint}
                                >
                                    <Printer className="h-4 w-4" />
                                    Browser Print
                                </Button>
                                {reportStudentId !== 'all' && (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="w-full flex items-center justify-center gap-2"
                                            onClick={handleCopyParentSummary}
                                            disabled={isCopyingParentNote}
                                        >
                                            <Copy className="h-4 w-4" />
                                            {isCopyingParentNote ? 'Copying...' : 'Copy Parent Summary'}
                                        </Button>
                                        <p className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-[11px] leading-relaxed text-brand-700">
                                            Parent-friendly export: download PDF, copy summary for WhatsApp/SMS/email, then print on A4 if needed.
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="overflow-y-auto print:overflow-visible lg:col-span-3 print:w-full">
                {reportStudentId === 'all' && currentClass ? (
                    <div id="report-card" className="space-y-0">
                        {activeStudents.map((student, index) => {
                            const studentScore = scores.find(
                                s =>
                                    s.student_id === student.id &&
                                    s.session === settings.current_session &&
                                    s.term === settings.current_term
                            );

                            return (
                                <div key={student.id} className={index > 0 ? 'page-break-before' : ''}>
                                    <ReportCardTemplate
                                        student={student}
                                        currentClass={currentClass}
                                        score={
                                            studentScore || {
                                                id: '',
                                                student_id: student.id,
                                                class_id: selectedClass,
                                                session: settings.current_session,
                                                term: settings.current_term,
                                                rows: [],
                                                average: 0,
                                                created_at: 0,
                                                updated_at: 0,
                                                affective: {},
                                                psychomotor: {},
                                                early_years_observations: [],
                                            }
                                        }
                                        settings={settings}
                                        subjects={
                                            student.assigned_subjects && student.assigned_subjects.length > 0
                                                ? student.assigned_subjects
                                                : classSubjects
                                        }
                                        historyScores={buildStudentHistory(student.id)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : previewScore && selectedStudent && currentClass ? (
                    <ReportCardTemplate
                        student={selectedStudent}
                        currentClass={currentClass}
                        score={previewScore}
                        settings={settings}
                        subjects={
                            selectedStudent.assigned_subjects && selectedStudent.assigned_subjects.length > 0
                                ? selectedStudent.assigned_subjects
                                : classSubjects
                        }
                        historyScores={buildStudentHistory(selectedStudent.id)}
                    />
                ) : (
                    <div className="flex min-h-[560px] flex-col items-center justify-center rounded-3xl border border-dashed border-brand-200 bg-gradient-to-br from-brand-50/60 via-white to-accent-50/40 px-6 text-center">
                        <div className="mb-4 rounded-2xl bg-brand-100 p-3 text-brand-700">
                            <Eye className="h-7 w-7" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Select a student to preview a report card</h3>
                        <p className="mt-2 max-w-md text-sm text-gray-500">
                            Use the left panel to choose a learner, or switch to &apos;All Students&apos; for bulk report generation and printing.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
