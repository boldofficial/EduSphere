'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Award, Target, Users, BarChart3, Percent } from 'lucide-react';
import * as Types from '@/lib/types';
import * as Stats from '@/lib/statistics';
import * as Utils from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface StatisticsPanelProps {
    scores: Types.Score[];
    classId: string;
    subject: string;
    session: string;
    term: string;
    studentCount: number;
    gradingScheme?: Types.GradingScheme;
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
    scores,
    classId,
    subject,
    session,
    term,
    studentCount,
    gradingScheme,
}) => {
    const subjectScores = scores
        .filter(s => Utils.sameId(s.class_id, classId) && s.session === session && s.term === term)
        .flatMap(s => s.rows?.find(r => r.subject === subject))
        .map(r => r?.total || 0)
        .filter(s => s > 0);

    if (subjectScores.length === 0) {
        return (
            <Card className="p-6">
                <p className="text-gray-500 text-sm">No scores available for statistics.</p>
            </Card>
        );
    }

    const mean = Stats.calculateMean(subjectScores);
    const median = Stats.calculateMedian(subjectScores);
    const mode = Stats.calculateMode(subjectScores);
    const stdDev = Stats.calculateStdDev(subjectScores);
    const passRate = Stats.calculatePassRate(subjectScores);
    const { q1, q2, q3 } = Stats.getQuartiles(subjectScores);
    const skewness = Stats.getSkewness(subjectScores);

    const distribution = gradingScheme
        ? Stats.getGradeDistribution(subjectScores, gradingScheme)
        : [];

    const skewnessIcon = skewness === 'left' ? <TrendingUp className="h-4 w-4 text-blue-500" /> :
                         skewness === 'right' ? <TrendingDown className="h-4 w-4 text-red-500" /> :
                         <Minus className="h-4 w-4 text-gray-400" />;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-brand-600" />
                <h3 className="font-semibold text-gray-900">Statistics: {subject}</h3>
                <span className="text-xs text-gray-500">({session} {term})</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-white">
                    <div className="flex items-center gap-2 mb-1">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-xs text-gray-500 uppercase">Mean</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{mean.toFixed(1)}</p>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-purple-50 to-white">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span className="text-xs text-gray-500 uppercase">Median</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{median.toFixed(1)}</p>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white">
                    <div className="flex items-center gap-2 mb-1">
                        <Award className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs text-gray-500 uppercase">Mode</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{mode ?? '-'}</p>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-orange-50 to-white">
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-orange-600" />
                        <span className="text-xs text-gray-500 uppercase">Std Dev</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stdDev.toFixed(2)}</p>
                </Card>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-gradient-to-br from-green-50 to-white">
                    <div className="flex items-center gap-2 mb-1">
                        <Percent className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-gray-500 uppercase">Pass Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{passRate}%</p>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-cyan-50 to-white">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 uppercase">Q1 (25th)</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{q1.toFixed(1)}</p>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-cyan-50 to-white">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 uppercase">Q2 (Median)</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{q2.toFixed(1)}</p>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-cyan-50 to-white">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 uppercase">Q3 (75th)</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{q3.toFixed(1)}</p>
                </Card>
            </div>

            <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">Distribution:</span>
                {skewnessIcon}
                <span className="text-gray-700 font-medium">
                    {skewness === 'left' ? 'Left Skewed (most scores above average)' :
                     skewness === 'right' ? 'Right Skewed (most scores below average)' :
                     'Normal Distribution'}
                </span>
            </div>

            {distribution.length > 0 && (
                <Card className="p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Grade Distribution</h4>
                    <div className="space-y-2">
                        {distribution.filter(d => d.count > 0).map(d => (
                            <div key={d.grade} className="flex items-center gap-3">
                                <span className="w-8 text-sm font-bold" style={{ color: d.color }}>{d.grade}</span>
                                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${d.percentage}%`,
                                            backgroundColor: d.color
                                        }}
                                    />
                                </div>
                                <span className="w-12 text-xs text-gray-500 text-right">{d.count} ({d.percentage}%)</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};
