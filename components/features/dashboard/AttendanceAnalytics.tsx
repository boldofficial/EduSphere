'use client';

import React, { useMemo } from 'react';
import {
    DynamicAreaChart as AreaChart,
    Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from '@/components/ui/charts';
import { Card } from '@/components/ui/card';
import { useAttendance } from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';

export const AttendanceAnalytics: React.FC = () => {
    const { data: attendanceData = [] } = useAttendance();

    const chartData = useMemo(() => {
        if (!attendanceData.length) return [];

        // Group by date and calculate average presence %
        const grouped: Record<string, { total: number; present: number }> = {};

        attendanceData.forEach(session => {
            if (!grouped[session.date]) {
                grouped[session.date] = { total: 0, present: 0 };
            }

            session.records.forEach(record => {
                grouped[session.date].total += 1;
                if (record.status === 'present' || record.status === 'late') {
                    grouped[session.date].present += 1;
                }
            });
        });

        return Object.entries(grouped)
            .map(([date, counts]) => ({
                date: Utils.formatDate(date, 'MMM dd'),
                rawDate: date,
                percentage: counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 0
            }))
            .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
            .slice(-14); // Last 14 days
    }, [attendanceData]);

    if (attendanceData.length === 0) return null;

    return (
        <Card title="Attendance Trends" className="overflow-hidden">
            <div className="h-72 w-full min-h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) => `${val}%`}
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value) => [`${value}%`, 'Attendance']}
                        />
                        <Area
                            type="monotone"
                            dataKey="percentage"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorPercentage)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="px-6 pb-6 pt-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Presence rate over the last 14 active days
                </p>
            </div>
        </Card>
    );
};
