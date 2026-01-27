import React from 'react';
import {
    DynamicPieChart as PieChart,
    DynamicLineChart as LineChart,
    Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    Line, XAxis, YAxis, CartesianGrid
} from '@/components/ui/charts';
import { Card } from '@/components/ui/card';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';

interface AdvancedAnalyticsProps {
    students: Types.Student[];
    payments: Types.Payment[];
    fees: Types.FeeStructure[];
    settings: Types.Settings;
}

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
    students, payments, fees, settings
}) => {
    // 1. Calculate Fee Collection Status
    let totalPaid = 0;
    let totalPending = 0;

    students.forEach(s => {
        const { totalBill, balance } = Utils.getStudentBalance(s, fees, payments, settings.current_session, settings.current_term);
        totalPaid += (Number(totalBill) || 0) - (Number(balance) || 0);
        totalPending += (Number(balance) || 0);
    });

    const collectionData = [
        { name: 'Paid', value: totalPaid, color: '#10b981' }, // emerald-500
        { name: 'Pending', value: totalPending, color: '#f59e0b' }, // amber-500
    ];

    // 2. Mock Enrollment Trends (based on student data)
    // In a real app, this would be grouped by term from historical records
    const enrollmentData = [
        { term: '2024/25 - 1st', count: Math.max(0, students.length - 12) },
        { term: '2024/25 - 2nd', count: Math.max(0, students.length - 8) },
        { term: '2024/25 - 3rd', count: Math.max(0, students.length - 3) },
        { term: '2025/26 - 1st', count: students.length },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Fee Collection Status">
                <div className="h-64 sm:h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={collectionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {collectionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => [Utils.formatCurrency(value), '']} />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card title="Enrollment Trends">
                <div className="h-64 sm:h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={enrollmentData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="term" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};
