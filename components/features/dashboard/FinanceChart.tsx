import React from 'react';
import {
    DynamicBarChart as BarChart,
    Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from '@/components/ui/charts';
import { Card } from '@/components/ui/card';
import * as Utils from '@/lib/utils';

interface FinanceChartProps {
    revenue: number;
    expenses: number;
}

export const FinanceChart: React.FC<FinanceChartProps> = ({ revenue, expenses }) => {
    const financeData = [
        { name: 'Income', amount: revenue, fill: '#10b981' }, // emerald-500
        { name: 'Expenses', amount: expenses, fill: '#ef4444' }, // red-500
    ];

    return (
        <Card title="Financial Overview">
            <div className="h-72 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financeData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₦${val / 1000}k`} tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <Tooltip formatter={(value) => [Utils.formatCurrency(value as number), 'Amount']} />
                        <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={60}>
                            {financeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
