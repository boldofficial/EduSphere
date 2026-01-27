'use client';

import React, { useState, useMemo } from 'react';
import {
    TrendingUp, Users, DollarSign, Calendar,
    BarChart3
} from 'lucide-react';
import {
    DynamicLineChart as LineChart,
    DynamicBarChart as BarChart,
    DynamicPieChart as RechartsPieChart,
    Line, Bar, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from '@/components/ui/charts';
import { useSchoolStore } from '@/lib/store'; // For Auth if needed
import {
    useStudents, useClasses, useScores, useAttendance,
    usePayments, useExpenses, useFees, useSettings
} from '@/lib/hooks/use-data';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';

const COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const AnalyticsView: React.FC = () => {
    // Data Hooks
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();
    const { data: students = [] } = useStudents();
    const { data: classes = [] } = useClasses();
    const { data: scores = [] } = useScores();
    const { data: attendance = [] } = useAttendance();
    const { data: payments = [] } = usePayments();
    const { data: expenses = [] } = useExpenses();
    const { data: fees = [] } = useFees();
    const [activeTab, setActiveTab] = useState<'performance' | 'financial' | 'attendance'>('performance');
    const [selectedSession, setSelectedSession] = useState(settings.current_session);

    // Performance Analytics
    const performanceData = useMemo(() => {
        const terms = settings.terms || ['First Term', 'Second Term', 'Third Term'];

        return terms.map((term: string) => {
            const termScores = scores.filter(s => s.session === selectedSession && s.term === term);
            const averages = termScores.map(s => s.average).filter(a => a > 0);
            const avgScore = averages.length > 0
                ? averages.reduce((a, b) => a + b, 0) / averages.length
                : 0;

            return {
                term: term.replace(' Term', ''),
                average: Math.round(avgScore * 10) / 10,
                studentsScored: termScores.length
            };
        });
    }, [scores, settings, selectedSession]);

    // Class comparison data
    const classComparisonData = useMemo(() => {
        return classes.map(cls => {
            const classStudents = students.filter((s: Types.Student) => s.class_id === cls.id);
            const classScores = scores.filter(
                (s: Types.Score) => classStudents.some((st: Types.Student) => st.id === s.student_id) &&
                    s.session === selectedSession &&
                    s.term === settings.current_term
            );

            const averages = classScores.map(s => s.average).filter(a => a > 0);
            const avgScore = averages.length > 0
                ? averages.reduce((a, b) => a + b, 0) / averages.length
                : 0;

            return {
                class: cls.name,
                average: Math.round(avgScore * 10) / 10,
                students: classStudents.length
            };
        }).filter(c => c.students > 0);
    }, [classes, students, scores, settings, selectedSession]);

    // Financial Analytics
    const financialData = useMemo(() => {
        const terms = settings.terms || ['First Term', 'Second Term', 'Third Term'];

        return terms.map((term: string) => {
            const termPayments = payments.filter(p => p.session === selectedSession && p.term === term);
            const termExpenses = expenses.filter(e => e.session === selectedSession && e.term === term);

            const totalRevenue = termPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
            const totalExpenses = termExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);

            return {
                term: term.replace(' Term', ''),
                revenue: totalRevenue,
                expenses: totalExpenses,
                profit: totalRevenue - totalExpenses
            };
        });
    }, [payments, expenses, settings, selectedSession]);

    // Expense breakdown
    const expenseBreakdown = useMemo(() => {
        const categories: Record<string, number> = {
            salary: 0, maintenance: 0, supplies: 0, utilities: 0, other: 0
        };

        expenses
            .filter(e => e.session === selectedSession)
            .forEach(e => { categories[e.category] += e.amount; });

        return Object.entries(categories)
            .filter(([_, val]) => val > 0)
            .map(([name, value]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                value
            }));
    }, [expenses, selectedSession]);

    // Attendance Analytics
    const attendanceData = useMemo(() => {
        const terms = settings.terms || ['First Term', 'Second Term', 'Third Term'];

        return terms.map((term: string) => {
            const termAttendance = attendance.filter(
                a => a.session === selectedSession && a.term === term
            );

            let totalPresent = 0;
            let totalRecords = 0;

            termAttendance.forEach(a => {
                a.records.forEach(r => {
                    totalRecords++;
                    if (r.status === 'present') totalPresent++;
                });
            });

            const rate = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;

            return {
                term: term.replace(' Term', ''),
                attendanceRate: Math.round(rate * 10) / 10,
                daysRecorded: termAttendance.length
            };
        });
    }, [attendance, settings, selectedSession]);

    // Stats summary
    const stats = useMemo(() => {
        const totalRevenue = payments
            .filter(p => p.session === selectedSession)
            .reduce((sum: number, p: any) => sum + p.amount, 0);
        const totalExpenses = expenses
            .filter(e => e.session === selectedSession)
            .reduce((sum: number, e: any) => sum + e.amount, 0);
        const avgPerformance = performanceData.length > 0
            ? performanceData.reduce((sum: number, p: any) => sum + p.average, 0) / performanceData.length
            : 0;
        const avgAttendance = attendanceData.length > 0
            ? attendanceData.reduce((sum: number, a: any) => sum + a.attendanceRate, 0) / attendanceData.length
            : 0;

        return { totalRevenue, totalExpenses, avgPerformance, avgAttendance };
    }, [payments, expenses, performanceData, attendanceData, selectedSession]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Comprehensive school performance insights</p>
                </div>
                <Select
                    value={selectedSession}
                    onChange={e => setSelectedSession(e.target.value)}
                    className="w-40"
                >
                    <option value={settings.current_session}>{settings.current_session}</option>
                </Select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-gradient-to-br from-green-50 to-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {Utils.formatCurrency(stats.totalRevenue)}
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Avg Performance</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats.avgPerformance.toFixed(1)}%
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-purple-50 to-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Attendance Rate</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats.avgAttendance.toFixed(1)}%
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-orange-50 to-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Students</p>
                            <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                        </div>
                        <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('performance')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'performance' ? 'bg-white shadow text-brand-700' : 'text-gray-600'
                        }`}
                >
                    <BarChart3 className="h-4 w-4 inline mr-2" />
                    Performance
                </button>
                <button
                    onClick={() => setActiveTab('financial')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'financial' ? 'bg-white shadow text-brand-700' : 'text-gray-600'
                        }`}
                >
                    <DollarSign className="h-4 w-4 inline mr-2" />
                    Financial
                </button>
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'attendance' ? 'bg-white shadow text-brand-700' : 'text-gray-600'
                        }`}
                >
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Attendance
                </button>
            </div>

            {/* Performance Tab */}
            {activeTab === 'performance' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-4">
                        <h3 className="font-semibold text-gray-700 mb-4">Performance Trend by Term</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={performanceData}>
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
                                    name="Avg Score (%)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>

                    <Card className="p-4">
                        <h3 className="font-semibold text-gray-700 mb-4">Class Comparison</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={classComparisonData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis type="category" dataKey="class" width={80} />
                                <Tooltip />
                                <Bar dataKey="average" fill="#3b82f6" name="Avg Score (%)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            )}

            {/* Financial Tab */}
            {activeTab === 'financial' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-4">
                        <h3 className="font-semibold text-gray-700 mb-4">Revenue vs Expenses</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={financialData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="term" />
                                <YAxis />
                                <Tooltip formatter={(value) => Utils.formatCurrency(Number(value))} />
                                <Legend />
                                <Bar dataKey="revenue" fill="#16a34a" name="Revenue" />
                                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    <Card className="p-4">
                        <h3 className="font-semibold text-gray-700 mb-4">Expense Breakdown</h3>
                        {expenseBreakdown.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsPieChart>
                                    <Pie
                                        data={expenseBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {expenseBreakdown.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => Utils.formatCurrency(Number(value))} />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-400">
                                No expense data available
                            </div>
                        )}
                    </Card>

                    <Card className="p-4 lg:col-span-2">
                        <h3 className="font-semibold text-gray-700 mb-4">Financial Summary</h3>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left">Term</th>
                                    <th className="px-4 py-2 text-right">Revenue</th>
                                    <th className="px-4 py-2 text-right">Expenses</th>
                                    <th className="px-4 py-2 text-right">Net Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {financialData.map((row: any) => (
                                    <tr key={row.term} className="border-t">
                                        <td className="px-4 py-3 font-medium">{row.term} Term</td>
                                        <td className="px-4 py-3 text-right text-green-600">
                                            {Utils.formatCurrency(row.revenue)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-red-600">
                                            {Utils.formatCurrency(row.expenses)}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-bold ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {row.profit >= 0 ? '+' : ''}{Utils.formatCurrency(row.profit)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-4">
                        <h3 className="font-semibold text-gray-700 mb-4">Attendance Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={attendanceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="term" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="attendanceRate"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={{ r: 6 }}
                                    name="Attendance Rate (%)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>

                    <Card className="p-4">
                        <h3 className="font-semibold text-gray-700 mb-4">Attendance Summary</h3>
                        <div className="space-y-4">
                            {attendanceData.map((row: any) => (
                                <div key={row.term} className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium">{row.term} Term</span>
                                        <span className={`font-bold ${row.attendanceRate >= 80 ? 'text-green-600' :
                                            row.attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                            {row.attendanceRate.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${row.attendanceRate >= 80 ? 'bg-green-500' :
                                                row.attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${row.attendanceRate}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {row.daysRecorded} days recorded
                                    </p>
                                </div>
                            ))}

                            {attendanceData.every((a: any) => a.daysRecorded === 0) && (
                                <div className="text-center py-8 text-gray-400">
                                    No attendance data available
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
