/**
 * Publish Tab
 * 
 * Admin-only tab for publishing/unpublishing report cards per class and per student.
 */
import React from 'react';
import { Shield, ShieldCheck, ShieldX, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import * as Types from '@/lib/types';
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
    classes, selectedClass, setSelectedClass, activeStudents,
    scores, settings, classSubjects, classPublishStatus,
    handlePassReportCards, handlePassSingleReport
}) => {
    return (
        <div className="space-y-6">
            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-green-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-full">
                            <ShieldCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Published</p>
                            <p className="text-2xl font-bold text-green-700">{classPublishStatus.passedCount}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-amber-50 to-white border-amber-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-100 rounded-full">
                            <AlertTriangle className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Unpublished</p>
                            <p className="text-2xl font-bold text-amber-700">{classPublishStatus.totalCount - classPublishStatus.passedCount}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Shield className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Scores</p>
                            <p className="text-2xl font-bold text-blue-700">{classPublishStatus.totalCount}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card>
                <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Select
                            label="Select Class"
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                        >
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                        <div className="text-sm text-gray-500">
                            {settings.current_session} • {settings.current_term}
                        </div>
                    </div>
                    <div className="flex gap-3">
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
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                            <ShieldCheck className="h-4 w-4" />
                            Publish All Results
                        </Button>
                    </div>
                </div>

                <div className="p-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-800">Important Notice</p>
                                <p className="text-sm text-amber-700 mt-1">
                                    Students and parents can only view report cards and grades after you publish them.
                                    Make sure all scores and remarks are complete before publishing.
                                </p>
                            </div>
                        </div>
                    </div>

                    <table className="w-full">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="py-3 px-4 font-semibold text-gray-700">Student</th>
                                <th className="py-3 px-4 font-semibold text-gray-700 text-center">Average</th>
                                <th className="py-3 px-4 font-semibold text-gray-700 text-center">Subjects Graded</th>
                                <th className="py-3 px-4 font-semibold text-gray-700 text-center">Status</th>
                                <th className="py-3 px-4 font-semibold text-gray-700 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeStudents.map(student => {
                                const studentScore = scores.find(s =>
                                    s.student_id === student.id &&
                                    s.session === settings.current_session &&
                                    s.term === settings.current_term
                                );
                                const isPublished = studentScore?.is_passed ?? false;
                                const subjectsGraded = studentScore?.rows?.filter(r => r.total > 0).length || 0;

                                return (
                                    <tr key={student.id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                                                    {student.names.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{student.names}</p>
                                                    <p className="text-xs text-gray-500">{student.student_no}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`font-bold ${(studentScore?.average || 0) >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                                                {studentScore?.average?.toFixed(1) || '0'}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`${subjectsGraded > 0 ? 'text-gray-900' : 'text-red-500'}`}>
                                                {subjectsGraded} / {classSubjects.length}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {isPublished ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Published
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                    <XCircle className="h-3 w-3" />
                                                    Unpublished
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
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
                                                    className="text-xs bg-green-600 hover:bg-green-700"
                                                    disabled={subjectsGraded === 0}
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
                                    <td colSpan={5} className="py-8 text-center text-gray-500">
                                        No students found in this class
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
