/**
 * Skills Tab
 *
 * Affective domain (behavioral traits) and Psychomotor skills rating,
 * plus attendance & remarks per student.
 */
import React from 'react';
import { ChevronRight, Sparkles, Loader2, UserCircle2 } from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';

interface SkillsTabProps {
    classes: Types.Class[];
    selectedClass: string;
    setSelectedClass: (id: string) => void;
    activeStudents: Types.Student[];
    reportStudentId: string;
    setReportStudentId: (id: string) => void;
    scores: Types.Score[];
    settings: Types.Settings;
    handleTraitChange: (studentId: string, category: 'affective' | 'psychomotor', trait: string, value: number) => void;
    handleScoreFieldChange: (studentId: string, field: keyof Types.Score, value: any) => void;
    onMagicRemark: (studentId: string, targetField: 'teacher_remark' | 'head_teacher_remark') => Promise<string | null>;
}

export const SkillsTab: React.FC<SkillsTabProps> = ({
    classes,
    selectedClass,
    setSelectedClass,
    activeStudents,
    reportStudentId,
    setReportStudentId,
    scores,
    settings,
    handleTraitChange,
    handleScoreFieldChange,
    onMagicRemark,
}) => {
    const [isGeneratingTeacher, setIsGeneratingTeacher] = React.useState(false);
    const [isGeneratingHeadTeacher, setIsGeneratingHeadTeacher] = React.useState(false);
    const [attendancePresentInput, setAttendancePresentInput] = React.useState('0');
    const [attendanceTotalInput, setAttendanceTotalInput] = React.useState('0');
    const [teacherRemarkDraft, setTeacherRemarkDraft] = React.useState('');
    const [headTeacherRemarkDraft, setHeadTeacherRemarkDraft] = React.useState('');

    const score = scores.find(
        s => s.student_id === reportStudentId && s.session === settings.current_session && s.term === settings.current_term
    );

    React.useEffect(() => {
        if (!reportStudentId) return;
        setAttendancePresentInput(String(score?.attendance_present ?? 0));
        setAttendanceTotalInput(String(score?.attendance_total ?? 0));
        setTeacherRemarkDraft(score?.teacher_remark || '');
        setHeadTeacherRemarkDraft(score?.head_teacher_remark || '');
    }, [
        reportStudentId,
        score?.attendance_present,
        score?.attendance_total,
        score?.teacher_remark,
        score?.head_teacher_remark,
    ]);

    const commitAttendanceValue = (field: 'attendance_present' | 'attendance_total', rawValue: string) => {
        const parsed = Number.parseInt(rawValue, 10);
        const safeValue = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
        handleScoreFieldChange(reportStudentId, field, safeValue);
        if (field === 'attendance_present') setAttendancePresentInput(String(safeValue));
        if (field === 'attendance_total') setAttendanceTotalInput(String(safeValue));
    };

    const handleAIGenerate = async (targetField: 'teacher_remark' | 'head_teacher_remark') => {
        if (targetField === 'teacher_remark') setIsGeneratingTeacher(true);
        if (targetField === 'head_teacher_remark') setIsGeneratingHeadTeacher(true);
        try {
            const suggestion = await onMagicRemark(reportStudentId, targetField);
            if (suggestion) {
                if (targetField === 'teacher_remark') setTeacherRemarkDraft(suggestion);
                if (targetField === 'head_teacher_remark') setHeadTeacherRemarkDraft(suggestion);
            }
        } finally {
            if (targetField === 'teacher_remark') setIsGeneratingTeacher(false);
            if (targetField === 'head_teacher_remark') setIsGeneratingHeadTeacher(false);
        }
    };

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="space-y-4 lg:col-span-1">
                <div className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 px-5 py-4 text-white">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.14em]">Student Skills</h3>
                        <p className="mt-1 text-xs text-white/75">Capture behavior, psychomotor ratings and remarks.</p>
                    </div>
                    <div className="space-y-4 p-5">
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

                        <div className="max-h-[500px] overflow-y-auto rounded-2xl border border-gray-200">
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
                    </div>
                </div>
            </div>

            <div className="space-y-6 lg:col-span-3">
                {reportStudentId ? (
                    <>
                        <Card className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white" title="Affective Domain">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {Utils.DOMAINS_AFFECTIVE.map(trait => {
                                    const value = score?.affective?.[trait] || 0;

                                    return (
                                        <div key={trait} className="flex items-center justify-between rounded-xl border border-amber-100 bg-white px-3 py-2.5">
                                            <span className="text-sm font-medium text-gray-700">{trait}</span>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(num => (
                                                    <button
                                                        key={num}
                                                        onClick={() => handleTraitChange(reportStudentId, 'affective', trait, num)}
                                                        className={`h-8 w-8 rounded-md border text-sm font-bold transition-colors ${
                                                            value === num
                                                                ? 'border-brand-600 bg-brand-600 text-white'
                                                                : 'border-gray-200 bg-white text-gray-500 hover:border-brand-300'
                                                        }`}
                                                    >
                                                        {num}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        <Card className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white" title="Psychomotor Skills">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {Utils.DOMAINS_PSYCHOMOTOR.map(skill => {
                                    const value = score?.psychomotor?.[skill] || 0;

                                    return (
                                        <div key={skill} className="flex items-center justify-between rounded-xl border border-sky-100 bg-white px-3 py-2.5">
                                            <span className="text-sm font-medium text-gray-700">{skill}</span>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(num => (
                                                    <button
                                                        key={num}
                                                        onClick={() => handleTraitChange(reportStudentId, 'psychomotor', skill, num)}
                                                        className={`h-8 w-8 rounded-md border text-sm font-bold transition-colors ${
                                                            value === num
                                                                ? 'border-brand-600 bg-brand-600 text-white'
                                                                : 'border-gray-200 bg-white text-gray-500 hover:border-brand-300'
                                                        }`}
                                                    >
                                                        {num}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        <Card className="rounded-3xl border border-brand-100" title="Attendance & Remarks">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Times Present</label>
                                        <input
                                            type="number"
                                            value={attendancePresentInput}
                                            onChange={e => setAttendancePresentInput(e.target.value)}
                                            onBlur={e => commitAttendanceValue('attendance_present', e.target.value)}
                                            className="h-10 w-full rounded-xl border border-brand-100 px-3 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Total School Days</label>
                                        <input
                                            type="number"
                                            value={attendanceTotalInput}
                                            onChange={e => setAttendanceTotalInput(e.target.value)}
                                            onBlur={e => commitAttendanceValue('attendance_total', e.target.value)}
                                            className="h-10 w-full rounded-xl border border-brand-100 px-3 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
                                        />
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-500">Attendance values are manually editable.</p>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{settings.class_teacher_label} Remark</label>
                                        <button
                                            onClick={() => handleAIGenerate('teacher_remark')}
                                            disabled={isGeneratingTeacher}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-50"
                                        >
                                            {isGeneratingTeacher ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                            AI Remark
                                        </button>
                                    </div>
                                    <textarea
                                        value={teacherRemarkDraft}
                                        onChange={e => {
                                            const value = e.target.value;
                                            setTeacherRemarkDraft(value);
                                            handleScoreFieldChange(reportStudentId, 'teacher_remark', value);
                                        }}
                                        className="min-h-[90px] w-full rounded-xl border border-brand-100 p-3 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
                                        placeholder={`Enter ${settings.class_teacher_label.toLowerCase()} remark...`}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{settings.head_teacher_label} Remark</label>
                                        <button
                                            onClick={() => handleAIGenerate('head_teacher_remark')}
                                            disabled={isGeneratingHeadTeacher}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-50"
                                        >
                                            {isGeneratingHeadTeacher ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                            AI Remark
                                        </button>
                                    </div>
                                    <textarea
                                        value={headTeacherRemarkDraft}
                                        onChange={e => {
                                            const value = e.target.value;
                                            setHeadTeacherRemarkDraft(value);
                                            handleScoreFieldChange(reportStudentId, 'head_teacher_remark', value);
                                        }}
                                        className="min-h-[90px] w-full rounded-xl border border-brand-100 p-3 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
                                        placeholder={`Enter ${settings.head_teacher_label.toLowerCase()} remark...`}
                                    />
                                </div>
                            </div>
                        </Card>
                    </>
                ) : (
                    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-3xl border border-dashed border-brand-200 bg-gradient-to-br from-brand-50/60 via-white to-accent-50/30 px-6 text-center">
                        <div className="mb-3 rounded-2xl bg-brand-100 p-3 text-brand-700">
                            <UserCircle2 className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Select a student to begin</h3>
                        <p className="mt-2 max-w-md text-sm text-gray-500">
                            Pick a learner from the left panel to set trait ratings, attendance, and official remarks.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
