'use client';

import React, { useMemo } from 'react';
import {
    DynamicLineChart as LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from '@/components/ui/charts';
import { Card } from '@/components/ui/card';
import * as Types from '@/lib/types';
import { TrendingUp } from 'lucide-react';

interface AcademicProgressChartProps {
    scores: Types.Score[];
    studentId: string;
}

export const AcademicProgressChart: React.FC<AcademicProgressChartProps> = ({ scores, studentId }) => {
    const chartData = useMemo(() => {
        // Filter scores for this student
        const studentScores = scores.filter(s => s.student_id === studentId);

        // Sort by session and then term
        const sortedScores = [...studentScores].sort((a, b) => {
            // Compare sessions (e.g., "2023/2024")
            const sessionA = a.session.split('/').map(Number)[0];
            const sessionB = b.session.split('/').map(Number)[0];
            if (sessionA !== sessionB) return sessionA - sessionB;

            // Compare terms
            const terms = ['First Term', 'Second Term', 'Third Term'];
            return terms.indexOf(a.term) - terms.indexOf(b.term);
        });

        return sortedScores.map(s => ({
            name: `${s.term.split(' ')[0]} ${s.session}`,
            label: `${s.term} (${s.session})`,
            average: s.average || 0,
        }));
    }, [scores, studentId]);

    if (chartData.length < 2) {
        return null; // Not enough data to show a trend
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp size={20} className="text-brand-500" />
                    Academic Progress Trend
                </h2>
            </div>
            <div className="h-64 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                            dy={10}
                        />
                        <YAxis
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                            tickFormatter={(val) => `${val}%`}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: number | undefined) => [`${(value || 0).toFixed(1)}%`, 'Average Score']}
                            labelFormatter={(label, payload) => payload[0]?.payload?.label || label}
                        />
                        <Line
                            type="monotone"
                            dataKey="average"
                            stroke="#4f46e5" // indigo-600
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, fill: '#4f46e5' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
