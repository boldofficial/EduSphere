/**
 * Publish Tab
 *
 * Admin-only tab for publishing/unpublishing report cards per class and per student.
 */
import React from 'react';
import { Shield, ShieldCheck, ShieldX, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface PublishTabProps {
    classes: Types.Class[];
    selectedClass: string;
    setSelectedClass: (id: string) => void;
    activeStudents: Types.Student[];
    scores: Types.Score[];
    settings: Types.Settings;
    classSubjects: string[];
    classPublishStatus: {
        passedCount: number;
        totalCount: number;
        allPassed: boolean;
        nonePassed: boolean;
    };
    handlePassReportCards: (pass: boolean) => void;
    handlePassSingleReport: (studentId: string, pass: boolean) => void;
}

export const PublishTab: React.FC<PublishTabProps> = ({
    classes,
    selectedClass,
    setSelectedClass,
    activeStudents,
    scores,
    settings,
    classSubjects,
    classPublishStatus,
    handlePassReportCards,
    handlePassSingleReport,
}) => {
    const selectedClassObj = classes.find(item => Utils.sameId(item.id, selectedClass));
    const isEarlyYears = Utils.isEarlyYearsClass(selectedClassObj);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-100 p-3">
                            <ShieldCheck className="h-6 w-6 text-emerald-700" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Published</p>
                            <p className="text-2xl font-bold text-emerald-800">{classPublishStatus.passedCount}</p>
                        </div>
                    </div>
                </Card>

                <Card className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-amber-100 p-3">
                            <AlertTriangle className="h-6 w-6 text-amber-700" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Unpublished</p>
                            <p className="text-2xl font-bold text-amber-800">{classPublishStatus.totalCount - classPublishStatus.passedCount}</p>
                        </div>
                    </div>
                </Card>

                <Card className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-brand-100 p-3">
                            <Shield className="h-6 w-6 text-brand-700" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Scores</p>
                            <p className="text-2xl font-bold text-brand-900">{classPublishStatus.totalCount}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="overflow-hidden rounded-3xl border border-brand-100 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-brand-100 bg-gradient-to-r from-brand-50 to-white p-5">
                    <div className="flex flex-wrap items-end gap-4">
                        <Select label="Class" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </Select>
                        <div className="pb-1 text-sm text-gray-500">
                            {settings.current_session} | {settings.current_term}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => handlePassReportCards(false)}
                            disabled={classPublishStatus.nonePassed}
                            className="flex items-center gap-2"
                        >
                            <ShieldX className="h-4 w-4" />
                            Unpublish All
                        </Button>
                        <Button
                            onClick={() => handlePassReportCards(true)}
                            disabled={classPublishStatus.allPassed}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                        >
                            <ShieldCheck className="h-4 w-4" />
                            Publish All Results
                        </Button>
                    </div>
                </div>

                <div className="p-5">
                    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                            <div>
                                <p className="text-sm font-semibold text-amber-800">Important Notice</p>
                                <p className="mt-1 text-sm text-amber-700">
                                    Students and parents can only view report cards after publication. Confirm scores and remarks before publishing.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-sm">
                            <thead>
                                <tr className="bg-brand-900 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                                    <th className="px-4 py-3">Student</th>
                                    <th className="px-4 py-3 text-center">{isEarlyYears ? 'Secure %' : 'Average'}</th>
                                    <th className="px-4 py-3 text-center">{isEarlyYears ? 'Learning Areas' : 'Subjects Graded'}</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {activeStudents.map(student => {
                                    const studentScore = scores.find(
                                        s =>
                                            s.student_id === student.id &&
                                            s.session === settings.current_session &&
                                            s.term === settings.current_term
                                    );

                                    const isPublished = studentScore?.is_passed ?? false;
                                    const subjectsGraded = studentScore?.rows?.filter(r => r.total > 0).length || 0;
                                    const observationsCompleted = studentScore?.early_years_observations?.filter(item => Boolean(item.comment?.trim())).length || 0;
                                    const secureCount = studentScore?.early_years_observations?.filter(item => item.status === 'Secure').length || 0;
                                    const securePercent = (studentScore?.early_years_observations?.length || 0) > 0
                                        ? (secureCount / (studentScore?.early_years_observations?.length || 1)) * 100
                                        : 0;
                                    const progressValue = isEarlyYears ? observationsCompleted : subjectsGraded;
                                    const progressTotal = isEarlyYears ? Utils.EARLY_YEARS_LEARNING_AREAS.length : classSubjects.length;

                                    return (
                                        <tr key={student.id} className="transition-colors hover:bg-brand-50/30">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
                                                        {student.names.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{student.names}</p>
                                                        <p className="text-xs text-gray-500">{student.student_no}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-bold ${
                                                    isEarlyYears
                                                        ? (securePercent >= 50 ? 'text-emerald-600' : 'text-amber-600')
                                                        : (studentScore?.average || 0) >= 50
                                                            ? 'text-emerald-600'
                                                            : 'text-rose-600'
                                                }`}>
                                                    {isEarlyYears ? `${securePercent.toFixed(1)}%` : `${studentScore?.average?.toFixed(1) || '0'}%`}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={progressValue > 0 ? 'text-gray-900' : 'text-rose-500'}>
                                                    {progressValue} / {progressTotal}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {isPublished ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                        Published
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                                                        <XCircle className="h-3.5 w-3.5" />
                                                        Unpublished
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {isPublished ? (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => handlePassSingleReport(student.id, false)}
                                                        className="text-xs"
                                                    >
                                                        Unpublish
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handlePassSingleReport(student.id, true)}
                                                        className="bg-emerald-600 text-xs hover:bg-emerald-700"
                                                        disabled={progressValue === 0}
                                                    >
                                                        Publish
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {activeStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                                            No students found in this class.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>
        </div>
    );
};
