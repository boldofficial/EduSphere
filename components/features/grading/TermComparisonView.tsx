'use client';

import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import {
    DynamicLineChart as LineChart,
    DynamicBarChart as BarChart,
    Line, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from '@/components/ui/charts';
import * as Types from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';

interface TermComparisonViewProps {
    students: Types.Student[];
    classes: Types.Class[];
    scores: Types.Score[];
    settings: Types.Settings;
}

export const TermComparisonView: React.FC<TermComparisonViewProps> = ({
    students, classes, scores, settings
}) => {
    const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [compareMode, setCompareMode] = useState<'student' | 'class'>('student');

    const activeStudents = students.filter(s => s.class_id === selectedClass);
    const terms = settings.terms || ['First Term', 'Second Term', 'Third Term'];

    // Calculate student performance across terms
    const studentTermData = useMemo(() => {
        if (!selectedStudent) return [];

        return terms.map(term => {
            const score = scores.find(
                s => s.student_id === selectedStudent &&
                    s.session === settings.current_session &&
                    s.term === term
            );
            return {
                term: term.replace(' Term', ''),
                average: score?.average || 0,
                totalSubjects: score?.rows.length || 0,
                totalScore: score?.total_score || 0
            };
        });
    }, [selectedStudent, scores, settings.current_session, terms]);

    // Calculate class average across terms
    const classTermData = useMemo(() => {
        const classStudents = students.filter(s => s.class_id === selectedClass);

        return terms.map(term => {
            const termScores = classStudents.map(student => {
                const score = scores.find(
                    s => s.student_id === student.id &&
                        s.session === settings.current_session &&
                        s.term === term
                );
                return score?.average || 0;
            }).filter(avg => avg > 0);

            const classAverage = termScores.length > 0
                ? termScores.reduce((a, b) => a + b, 0) / termScores.length
                : 0;

            return {
                term: term.replace(' Term', ''),
                average: Math.round(classAverage * 100) / 100,
                studentsWithScores: termScores.length
            };
        });
    }, [selectedClass, students, scores, settings.current_session, terms]);

    // Subject-wise comparison for student
    const subjectComparison = useMemo(() => {
        if (!selectedStudent) return [];

        const allSubjects = new Set<string>();
        const termScores: Record<string, Types.Score | undefined> = {};

        terms.forEach(term => {
            const score = scores.find(
                s => s.student_id === selectedStudent &&
                    s.session === settings.current_session &&
                    s.term === term
            );
            termScores[term] = score;
            score?.rows.forEach(row => allSubjects.add(row.subject));
        });

        return Array.from(allSubjects).map(subject => {
            const data: Record<string, any> = { subject };
            terms.forEach(term => {
                const row = termScores[term]?.rows.find(r => r.subject === subject);
                data[term.replace(' Term', '')] = row?.total || 0;
            });
            return data;
        });
    }, [selectedStudent, scores, settings.current_session, terms]);

    // Calculate trend indicator
    const getTrendIndicator = (data: { average: number }[]) => {
        if (data.length < 2) return null;
        const lastTwo = data.slice(-2);
        const diff = lastTwo[1].average - lastTwo[0].average;

        if (diff > 5) return { icon: TrendingUp, color: 'text-green-600', label: 'Improving' };
        if (diff < -5) return { icon: TrendingDown, color: 'text-red-600', label: 'Declining' };
        return { icon: Minus, color: 'text-gray-500', label: 'Stable' };
    };

    const studentTrend = getTrendIndicator(studentTermData);
    const classTrend = getTrendIndicator(classTermData);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Term Progression Tracking</h2>
                    <p className="text-sm text-gray-500 mt-1">Compare performance across terms</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setCompareMode('student')}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${compareMode === 'student' ? 'bg-white shadow text-brand-700' : 'text-gray-600'
                            }`}
                    >
                        By Student
                    </button>
                    <button
                        onClick={() => setCompareMode('class')}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${compareMode === 'class' ? 'bg-white shadow text-brand-700' : 'text-gray-600'
                            }`}
                    >
                        By Class
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Selection Panel */}
                <Card className="lg:col-span-1">
                    <div className="p-4 space-y-4">
                        <Select
                            label="Class"
                            value={selectedClass}
                            onChange={e => {
                                setSelectedClass(e.target.value);
                                setSelectedStudent('');
                            }}
                        >
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </Select>

                        {compareMode === 'student' && (
                            <div className="space-y-1 max-h-[400px] overflow-y-auto border rounded-md">
                                {activeStudents.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSelectedStudent(s.id)}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selectedStudent === s.id
                                            ? 'bg-brand-50 text-brand-700 font-medium'
                                            : 'text-gray-700'
                                            }`}
                                    >
                                        {s.names}
                                    </button>
                                ))}
                            </div>
                        )}

                        {compareMode === 'student' && selectedStudent && studentTrend && (
                            <div className={`p-3 rounded-lg bg-gray-50 flex items-center gap-2 ${studentTrend.color}`}>
                                <studentTrend.icon className="h-5 w-5" />
                                <span className="text-sm font-medium">{studentTrend.label}</span>
                            </div>
                        )}

                        {compareMode === 'class' && classTrend && (
                            <div className={`p-3 rounded-lg bg-gray-50 flex items-center gap-2 ${classTrend.color}`}>
                                <classTrend.icon className="h-5 w-5" />
                                <span className="text-sm font-medium">Class is {classTrend.label}</span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Charts Panel */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Average Trend Line Chart */}
                    <Card>
                        <div className="p-4">
                            <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
                                <BarChart3 className="h-4 w-4" />
                                {compareMode === 'student' ? 'Student Average Progression' : 'Class Average Progression'}
                            </h3>

                            {(compareMode === 'student' && !selectedStudent) ? (
                                <div className="h-64 flex items-center justify-center text-gray-400">
                                    Select a student to view their progression
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={compareMode === 'student' ? studentTermData : classTermData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="term" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="average"
                                            stroke="#16a34a"
                                            strokeWidth={3}
                                            dot={{ r: 6 }}
                                            name="Average (%)"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>

                    {/* Subject-wise Comparison (Student Mode Only) */}
                    {compareMode === 'student' && selectedStudent && subjectComparison.length > 0 && (
                        <Card>
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-700 mb-4">
                                    Subject-wise Comparison
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={subjectComparison} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" domain={[0, 100]} />
                                        <YAxis type="category" dataKey="subject" width={100} />
                                        <Tooltip />
                                        <Legend />
                                        {terms.map((term, index) => (
                                            <Bar
                                                key={term}
                                                dataKey={term.replace(' Term', '')}
                                                fill={['#16a34a', '#3b82f6', '#f59e0b'][index % 3]}
                                                name={term}
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    )}

                    {/* Term Summary Table */}
                    <Card>
                        <div className="p-4">
                            <h3 className="font-semibold text-gray-700 mb-4">Term Summary</h3>
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Term</th>
                                        <th className="px-4 py-2 text-center">Average</th>
                                        <th className="px-4 py-2 text-center">
                                            {compareMode === 'student' ? 'Subjects' : 'Students'}
                                        </th>
                                        <th className="px-4 py-2 text-center">Change</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(compareMode === 'student' ? studentTermData : classTermData).map((row, index, arr) => {
                                        const prev = index > 0 ? arr[index - 1].average : 0;
                                        const change = index > 0 ? row.average - prev : 0;

                                        return (
                                            <tr key={row.term} className="border-t">
                                                <td className="px-4 py-3 font-medium">{row.term} Term</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`font-bold ${row.average >= 50 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                        {row.average.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-gray-500">
                                                    {compareMode === 'student'
                                                        ? (row as any).totalSubjects
                                                        : (row as any).studentsWithScores
                                                    }
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {index > 0 && (
                                                        <span className={`font-medium ${change > 0 ? 'text-green-600' :
                                                            change < 0 ? 'text-red-600' : 'text-gray-500'
                                                            }`}>
                                                            {change > 0 ? '+' : ''}{change.toFixed(1)}%
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
