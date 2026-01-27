'use client';

import React, { useMemo } from 'react';
import { ClipboardList, Award, TrendingUp, BookOpen, Lock, Clock } from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface StudentScoresViewProps {
    student: Types.Student;
    students: Types.Student[];
    currentClass?: Types.Class;
    scores: Types.Score[];
    settings: Types.Settings;
}

export const StudentScoresView: React.FC<StudentScoresViewProps> = ({
    student, students, currentClass, scores, settings
}) => {
    // Get current term scores
    const myScore = useMemo(() => {
        return scores.find(s =>
            s.student_id === student.id &&
            s.session === settings.current_session &&
            s.term === settings.current_term
        );
    }, [scores, student.id, settings]);

    // Check if report card is published
    const isPublished = myScore?.is_passed ?? false;

    // Calculate position
    const position = useMemo(() => {
        if (!myScore || !isPublished) return null;
        return Utils.getStudentPosition(student.id, students, scores, settings.current_session, settings.current_term);
    }, [student.id, students, scores, settings, myScore, isPublished]);

    const totalInClass = useMemo(() => {
        return students.filter(s => s.class_id === student.class_id).length;
    }, [students, student.class_id]);

    const classSubjects = Utils.getSubjectsForClass(currentClass);

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'A': return 'bg-green-100 text-green-700';
            case 'B': return 'bg-blue-100 text-blue-700';
            case 'C': return 'bg-yellow-100 text-yellow-700';
            case 'D': return 'bg-orange-100 text-orange-700';
            case 'E':
            case 'F': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Show locked message if results are not published
    if (!isPublished) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Academic Scores</h1>
                    <p className="text-gray-500">View your scores for {settings.current_term} - {settings.current_session}</p>
                </div>

                <Card className="p-12 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="h-10 w-10 text-amber-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Results Not Yet Published</h2>
                        <p className="text-gray-500 mb-6">
                            Your results for {settings.current_term} ({settings.current_session}) have not been released yet. 
                            Please check back later or contact your school administration.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span>Results are typically published after the examination period</span>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Academic Scores</h1>
                <p className="text-gray-500">View your scores for {settings.current_term} - {settings.current_session}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-gradient-to-br from-brand-500 to-brand-600 text-white">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{myScore?.average?.toFixed(1) || '0'}%</p>
                            <p className="text-xs text-white/80">Term Average</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Award className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{position ? Utils.ordinalSuffix(position) : '-'}</p>
                            <p className="text-xs text-gray-500">Class Position</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{myScore?.rows?.length || 0}</p>
                            <p className="text-xs text-gray-500">Subjects</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <ClipboardList className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{totalInClass}</p>
                            <p className="text-xs text-gray-500">Students in Class</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Scores Table */}
            <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-brand-500" />
                    Subject Scores
                </h2>

                {myScore && myScore.rows.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="text-left py-3 px-4 font-bold text-gray-700">Subject</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-700">CA1 (15)</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-700">CA2 (15)</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-700">Exam (70)</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-700">Total (100)</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-700">Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myScore.rows.map((row, i) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium text-gray-900">{row.subject}</td>
                                        <td className="py-3 px-4 text-center text-gray-600">{row.ca1}</td>
                                        <td className="py-3 px-4 text-center text-gray-600">{row.ca2}</td>
                                        <td className="py-3 px-4 text-center text-gray-600">{row.exam}</td>
                                        <td className="py-3 px-4 text-center font-bold text-gray-900">{row.total}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(row.grade)}`}>
                                                {row.grade}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50 font-bold">
                                    <td className="py-3 px-4 text-gray-900">Overall Average</td>
                                    <td className="py-3 px-4 text-center" colSpan={3}></td>
                                    <td className="py-3 px-4 text-center text-brand-600 text-lg">{myScore.average?.toFixed(1)}%</td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(myScore.rows[0]?.grade || 'C')}`}>
                                            {myScore.average && myScore.average >= 70 ? 'A' : myScore.average && myScore.average >= 60 ? 'B' : myScore.average && myScore.average >= 50 ? 'C' : myScore.average && myScore.average >= 45 ? 'D' : 'F'}
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="italic">No scores available for this term yet.</p>
                        <p className="text-sm mt-2">Check back later for your results.</p>
                    </div>
                )}
            </Card>

            {/* Teacher's Remarks */}
            {myScore && (myScore.teacher_remark || myScore.head_teacher_remark) && (
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Remarks</h2>
                    <div className="space-y-4">
                        {myScore.teacher_remark && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs font-bold text-blue-600 uppercase mb-1">Class Teacher's Remark</p>
                                <p className="text-gray-700">{myScore.teacher_remark}</p>
                            </div>
                        )}
                        {myScore.head_teacher_remark && (
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                <p className="text-xs font-bold text-purple-600 uppercase mb-1">Principal's Remark</p>
                                <p className="text-gray-700">{myScore.head_teacher_remark}</p>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};
