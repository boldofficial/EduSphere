'use client';

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Award, BookOpen, Users, Target, BarChart3 } from 'lucide-react';
import * as Types from '@/lib/types';
import * as Stats from '@/lib/statistics';
import * as Utils from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    PieChart,
    Pie,
} from 'recharts';

interface SubjectAnalyticsProps {
    scores: Types.Score[];
    students: Types.Student[];
    classId: string;
    classes: Types.Class[];
    session: string;
    term: string;
    gradingScheme?: Types.GradingScheme;
}

export const SubjectAnalytics: React.FC<SubjectAnalyticsProps> = ({
    scores,
    students,
    classId,
    classes,
    session,
    term,
    gradingScheme,
}) => {
    const currentClass = classes.find(c => Utils.sameId(c.id, classId));
    const classSubjects = currentClass?.subjects || [];

    const overallScores = useMemo(() => {
        return scores
            .filter(s => Utils.sameId(s.class_id, classId) && s.session === session && s.term === term)
            .flatMap(s => s.rows?.map(r => r.total || 0))
            .filter(s => s > 0);
    }, [scores, classId, session, term]);

    const subjectStats = useMemo(() => {
        return classSubjects.map(subject => {
            const subjectScoresArr = scores
                .filter(s => Utils.sameId(s.class_id, classId) && s.session === session && s.term === term)
                .flatMap(s => s.rows?.find(r => r.subject === subject))
                .map(r => r?.total || 0)
                .filter(s => s > 0);

            const avg = Stats.calculateMean(subjectScoresArr);
            const overallAvg = overallScores.length > 0 ? Stats.calculateMean(overallScores) : 0;
            const difficulty = overallAvg > 0 ? ((overallAvg - avg) / overallAvg) * 100 : 0;

            const gradeDist = subjectScoresArr.length > 0 && gradingScheme ? Stats.getGradeDistribution(
                subjectScoresArr,
                gradingScheme
            ) : [];

            return {
                subject,
                average: avg,
                passRate: Stats.calculatePassRate(subjectScoresArr),
                difficulty: Math.round(difficulty),
                topScore: subjectScoresArr.length > 0 ? Math.max(...subjectScoresArr) : 0,
                lowestScore: subjectScoresArr.length > 0 ? Math.min(...subjectScoresArr) : 0,
                studentCount: subjectScoresArr.length,
                gradeDistribution: gradeDist,
            };
        });
    }, [scores, classId, session, term, classSubjects, overallScores, gradingScheme]);

    const chartData = subjectStats.map(s => ({
        name: s.subject.substring(0, 8),
        fullName: s.subject,
        average: s.average,
        passRate: s.passRate,
        fill: s.average >= 70 ? '#10b981' : s.average >= 50 ? '#3b82f6' : '#ef4444',
    }));

    const sortedByDifficulty = [...subjectStats].sort((a, b) => b.difficulty - a.difficulty);
    const hardestSubject = sortedByDifficulty[sortedByDifficulty.length - 1];
    const easiestSubject = sortedByDifficulty[0];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-brand-600" />
                <h3 className="text-lg font-semibold text-gray-900">Subject Analytics</h3>
                <span className="text-sm text-gray-500">({currentClass?.name} - {session} {term})</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-gradient-to-br from-purple-50 to-white">
                    <div className="flex items-center gap-2 mb-1">
                        <Target className="h-4 w-4 text-purple-600" />
                        <span className="text-xs text-gray-500 uppercase">Class Average</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {overallScores.length > 0 ? Stats.calculateMean(overallScores).toFixed(1) : '-'}
                    </p>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-blue-50 to-white">
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-xs text-gray-500 uppercase">Students</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{students.filter(s => Utils.sameId(s.class_id, classId)).length}</p>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-green-50 to-white">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingDown className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-gray-500 uppercase">Easiest</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 truncate">{easiestSubject?.subject || '-'}</p>
                    <p className="text-xs text-gray-500">{easiestSubject?.average.toFixed(1)}%</p>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-red-50 to-white">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-red-600" />
                        <span className="text-xs text-gray-500 uppercase">Hardest</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 truncate">{hardestSubject?.subject || '-'}</p>
                    <p className="text-xs text-gray-500">{hardestSubject?.average.toFixed(1)}%</p>
                </Card>
            </div>

            <Card className="p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Subject Performance Comparison</h4>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis type="category" dataKey="name" width={80} />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                                                <p className="font-medium">{data.fullName}</p>
                                                <p className="text-sm text-gray-500">Average: {data.average.toFixed(1)}%</p>
                                                <p className="text-sm text-gray-500">Pass Rate: {data.passRate}%</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="average" radius={[0, 4, 4, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card className="p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Subject Details</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left">Subject</th>
                                <th className="px-3 py-2 text-center">Average</th>
                                <th className="px-3 py-2 text-center">Pass Rate</th>
                                <th className="px-3 py-2 text-center">Difficulty</th>
                                <th className="px-3 py-2 text-center">Top</th>
                                <th className="px-3 py-2 text-center">Lowest</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjectStats.map(s => (
                                <tr key={s.subject} className="border-t">
                                    <td className="px-3 py-2 font-medium">{s.subject}</td>
                                    <td className="px-3 py-2 text-center">
                                        <span className={`font-bold ${s.average >= 70 ? 'text-green-600' : s.average >= 50 ? 'text-blue-600' : 'text-red-600'}`}>
                                            {s.average.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-center">{s.passRate}%</td>
                                    <td className="px-3 py-2 text-center">
                                        <span className={`px-2 py-0.5 rounded text-xs ${s.difficulty > 10 ? 'bg-red-100 text-red-700' : s.difficulty > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                            {s.difficulty > 0 ? `+${s.difficulty}%` : `${s.difficulty}%`}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-center">{s.topScore}</td>
                                    <td className="px-3 py-2 text-center">{s.lowestScore}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {gradingScheme && (
                <Card className="p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Grade Distribution by Subject</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subjectStats.slice(0, 6).map(s => (
                            <div key={s.subject} className="p-3 bg-gray-50 rounded-lg">
                                <p className="font-medium text-sm mb-2">{s.subject}</p>
                                {s.gradeDistribution.length > 0 ? (
                                    <div className="space-y-1">
                                        {s.gradeDistribution.filter(g => g.count > 0).map(g => (
                                            <div key={g.grade} className="flex items-center gap-2 text-xs">
                                                <span className="w-4 font-bold" style={{ color: g.color }}>{g.grade}</span>
                                                <div className="flex-1 h-2 bg-gray-200 rounded-full">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{ width: `${g.percentage}%`, backgroundColor: g.color }}
                                                    />
                                                </div>
                                                <span className="w-8 text-right text-gray-500">{g.percentage}%</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400">No data</p>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};
