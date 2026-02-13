'use client';

import React from 'react';
import { ClipboardList, Award, Timer } from 'lucide-react';
import Link from 'next/link';
import { AcademicProgressChart } from '../grading/AcademicProgressChart';
import { AchievementShowcase } from '../dashboard/AchievementShowcase';

interface StudentAcademicWidgetsProps {
    isResultPublished: boolean;
    myScore: any;
    scores: any[];
    studentId: string;
    subjectAnalysis: any;
    nextExam: any;
    daysUntilExam: number | null;
}

export const StudentAcademicWidgets: React.FC<StudentAcademicWidgetsProps> = ({
    isResultPublished,
    myScore,
    scores,
    studentId,
    subjectAnalysis,
    nextExam,
    daysUntilExam
}) => {
    return (
        <div className="space-y-6">
            {/* Exam Countdown Widget */}
            {nextExam && daysUntilExam !== null && (
                <div className={`p-3 sm:p-4 rounded-xl lg:rounded-2xl border flex items-center gap-3 sm:gap-4 ${daysUntilExam <= 7 ? 'bg-red-50 border-red-200' :
                    daysUntilExam <= 14 ? 'bg-yellow-50 border-yellow-200' :
                        'bg-brand-50 border-brand-200'
                    }`}>
                    <div className={`p-2 sm:p-3 rounded-lg lg:rounded-xl ${daysUntilExam <= 7 ? 'bg-red-500' :
                        daysUntilExam <= 14 ? 'bg-yellow-500' :
                            'bg-brand-500'
                        } text-white shrink-0`}>
                        <Timer size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">Upcoming Exam</p>
                        <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{nextExam.title}</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className={`text-2xl sm:text-3xl font-black ${daysUntilExam <= 7 ? 'text-red-600' :
                            daysUntilExam <= 14 ? 'text-yellow-600' :
                                'text-brand-600'
                            }`}>{daysUntilExam}</p>
                        <p className="text-[10px] sm:text-xs font-medium text-gray-500">days left</p>
                    </div>
                </div>
            )}

            {/* Academic Progress Chart */}
            {isResultPublished && (
                <AcademicProgressChart scores={scores} studentId={studentId} />
            )}

            {/* Academic Performance Widget */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <ClipboardList size={20} className="text-brand-500" />
                        Academic Performance
                    </h2>
                    <Link href="/grading" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                        View Details →
                    </Link>
                </div>
                {isResultPublished && myScore && myScore.rows.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-2 px-2 font-bold text-gray-600">Subject</th>
                                    <th className="text-center py-2 px-2 font-bold text-gray-600">CA1</th>
                                    <th className="text-center py-2 px-2 font-bold text-gray-600">CA2</th>
                                    <th className="text-center py-2 px-2 font-bold text-gray-600">Exam</th>
                                    <th className="text-center py-2 px-2 font-bold text-gray-600">Total</th>
                                    <th className="text-center py-2 px-2 font-bold text-gray-600">Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myScore.rows.slice(0, 6).map((row: any, i: number) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="py-2 px-2 font-medium text-gray-900">{row.subject}</td>
                                        <td className="py-2 px-2 text-center text-gray-600">{row.ca1}</td>
                                        <td className="py-2 px-2 text-center text-gray-600">{row.ca2}</td>
                                        <td className="py-2 px-2 text-center text-gray-600">{row.exam}</td>
                                        <td className="py-2 px-2 text-center font-bold text-gray-900">{row.total}</td>
                                        <td className="py-2 px-2 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${row.grade === 'A' ? 'bg-green-100 text-green-700' :
                                                row.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                                                    row.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                                        row.grade === 'D' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-red-100 text-red-700'
                                                }`}>
                                                {row.grade}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {myScore.rows.length > 6 && (
                            <p className="text-xs text-gray-400 mt-2 text-center">+{myScore.rows.length - 6} more subjects</p>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400 italic text-sm">
                        {!isResultPublished ? 'Results pending publication by school administration.' : 'No scores available for this term yet.'}
                    </div>
                )}
            </div>

            {/* Subject Analysis Widget */}
            {subjectAnalysis && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Award size={20} className="text-brand-500" />
                        Subject Analysis
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-gray-400 uppercase">Top Strengths</p>
                            {subjectAnalysis.top.map((s: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                                    <span className="text-sm font-medium text-gray-700">{s.subject}</span>
                                    <span className="text-sm font-bold text-green-700">{s.total}%</span>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-gray-400 uppercase">Focus Areas</p>
                            {subjectAnalysis.needsImprovement.length > 0 ? (
                                subjectAnalysis.needsImprovement.map((s: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                                        <span className="text-sm font-medium text-gray-700">{s.subject}</span>
                                        <span className="text-sm font-bold text-red-700">{s.total}%</span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
                                    Excellent! No subjects currently below 50%.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Achievements Widget */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 px-2">
                    <Award size={20} className="text-brand-500" />
                    Achievements & Awards
                </h2>
                <AchievementShowcase studentId={studentId} />
            </div>
        </div>
    );
};
