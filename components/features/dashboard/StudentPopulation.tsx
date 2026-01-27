import React from 'react';
import {
    DynamicPieChart as PieChart,
    Pie, Cell, ResponsiveContainer, Tooltip
} from '@/components/ui/charts';
import { Card } from '@/components/ui/card';
import * as Types from '@/lib/types';

interface StudentPopulationProps {
    students: Types.Student[];
}

export const StudentPopulation: React.FC<StudentPopulationProps> = ({ students }) => {
    const totalStudents = students.length;
    const genderData = [
        { name: 'Male', value: students.filter(s => s.gender === 'Male').length, color: '#3b82f6' },
        { name: 'Female', value: students.filter(s => s.gender === 'Female').length, color: '#ec4899' },
    ];

    return (
        <Card title="Student Population">
            <div className="h-56 w-full relative min-h-[224px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />)}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-gray-900">{totalStudents}</span>
                    <span className="text-xs text-gray-500 font-medium uppercase">Students</span>
                </div>
            </div>
        </Card>
    );
};
