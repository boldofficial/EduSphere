import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, AlertTriangle, FileText, Download, PieChart as PieChartIcon, BarChart as BarChartIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';

interface FinancialDashboardProps {
    students: Types.Student[];
    classes: Types.Class[];
    fees: Types.FeeStructure[];
    payments: Types.Payment[];
    expenses: Types.Expense[];
    settings: Types.Settings;
}

const COLORS = ['#3b6fb6', '#8FC31F', '#F59E0B', '#DC2626', '#8b5cf6', '#ec4899'];

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
    students, classes, fees, payments, expenses, settings
}) => {
    // Filter for current session/term
    const currentPayments = payments.filter(p => p.session === settings.current_session && p.term === settings.current_term);
    const currentExpenses = expenses.filter(e => e.session === settings.current_session && e.term === settings.current_term);
    const currentFees = fees.filter(f => f.session === settings.current_session && f.term === settings.current_term);

    // Calculate totals with numeric coercion for safety
    const totalIncome = currentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalExpenses = currentExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netBalance = totalIncome - totalExpenses;

    // Calculate expected vs collected using the same utility as invoices/debtor reports
    const expectedIncome = students.reduce((sum, student) => {
        const { totalBill } = Utils.getStudentBalance(
            student,
            fees,
            payments,
            settings.current_session,
            settings.current_term
        );
        return sum + totalBill;
    }, 0);
    const collectionRate = expectedIncome > 0 ? (totalIncome / expectedIncome) * 100 : 0;

    // Chart Data: Payment Methods
    const paymentsByMethod = currentPayments.reduce((acc, p) => {
        const method = p.method || 'other';
        acc[method] = (acc[method] || 0) + (Number(p.amount) || 0);
        return acc;
    }, {} as Record<string, number>);

    const paymentChartData = Object.entries(paymentsByMethod).map(([name, value]) => ({ name, value }));

    // Chart Data: Expense Categories
    const expensesByCategory = currentExpenses.reduce((acc, e) => {
        const category = e.category || 'other';
        acc[category] = (acc[category] || 0) + (Number(e.amount) || 0);
        return acc;
    }, {} as Record<string, number>);

    const expenseChartData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));

    // Chart Data: Revenue vs Expenses (Monthly)
    // For demo, we'll group by month from the current term's payments
    const monthlyData = currentPayments.reduce((acc, p) => {
        const month = p.date ? new Date(p.date).toLocaleString('default', { month: 'short' }) : 'Unknown';
        if (!acc[month]) acc[month] = { month, income: 0, expense: 0 };
        acc[month].income += (Number(p.amount) || 0);
        return acc;
    }, {} as Record<string, any>);

    currentExpenses.forEach(e => {
        const month = e.date ? new Date(e.date).toLocaleString('default', { month: 'short' }) : 'Unknown';
        if (!monthlyData[month]) monthlyData[month] = { month, income: 0, expense: 0 };
        monthlyData[month].expense += (Number(e.amount) || 0);
    });

    const revenueChartData = Object.values(monthlyData).sort((a, b) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(a.month) - months.indexOf(b.month);
    });

    // Debtors analysis
    const debtors = students.map(student => {
        const { balance } = Utils.getStudentBalance(student, fees, payments, settings.current_session, settings.current_term);
        return { student, balance };
    }).filter(d => d.balance > 0).sort((a, b) => b.balance - a.balance);

    const totalOutstanding = debtors.reduce((sum, d) => sum + d.balance, 0);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border-none shadow-sm p-5 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Total Income</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{Utils.formatCurrency(totalIncome)}</p>
                            <div className="flex items-center mt-2 text-green-600 text-xs font-medium">
                                <TrendingUp size={14} className="mr-1" />
                                <span>{currentPayments.length} transactions</span>
                            </div>
                        </div>
                        <div className="h-12 w-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                            <DollarSign size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="bg-white border-none shadow-sm p-5 border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Total Expenses</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{Utils.formatCurrency(totalExpenses)}</p>
                            <div className="flex items-center mt-2 text-red-600 text-xs font-medium">
                                <TrendingDown size={14} className="mr-1" />
                                <span>{currentExpenses.length} records</span>
                            </div>
                        </div>
                        <div className="h-12 w-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                            <TrendingDown size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="bg-white border-none shadow-sm p-5 border-l-4 border-brand-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Net Balance</p>
                            <p className={`text-2xl font-bold mt-1 ${netBalance >= 0 ? 'text-brand-700' : 'text-orange-600'}`}>
                                {Utils.formatCurrency(netBalance)}
                            </p>
                            <p className="text-gray-400 text-xs mt-2 uppercase tracking-wider font-semibold">
                                {netBalance >= 0 ? 'Surplus' : 'Deficit'}
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
                            <PieChartIcon size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="bg-white border-none shadow-sm p-5 border-l-4 border-amber-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Outstanding Fees</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{Utils.formatCurrency(totalOutstanding)}</p>
                            <div className="flex items-center mt-2 text-amber-600 text-xs font-medium">
                                <AlertTriangle size={14} className="mr-1" />
                                <span>{debtors.length} students owing</span>
                            </div>
                        </div>
                        <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                            <Users size={24} />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue vs Expenses Chart */}
                <Card className="lg:col-span-2 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900">Financial Trends</h3>
                        <div className="flex gap-2">
                            <div className="flex items-center text-xs text-gray-500">
                                <div className="w-3 h-3 bg-brand-500 rounded-full mr-1" /> Income
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                                <div className="w-3 h-3 bg-red-400 rounded-full mr-1" /> Expense
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f9fafb' }}
                                />
                                <Bar dataKey="income" fill="#3b6fb6" radius={[4, 4, 0, 0]} barSize={32} />
                                <Bar dataKey="expense" fill="#f87171" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Collection Rate Doughnut */}
                <Card className="p-6 flex flex-col items-center justify-center text-center">
                    <h3 className="font-bold text-gray-900 mb-6 self-start">Collection Rate</h3>
                    <div className="relative h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Collected', value: totalIncome },
                                        { name: 'Pending', value: Math.max(0, expectedIncome - totalIncome) }
                                    ]}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#8FC31F" />
                                    <Cell fill="#f3f4f6" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-gray-900">{collectionRate.toFixed(0)}%</span>
                            <span className="text-xs text-gray-400 font-bold uppercase">Collected</span>
                        </div>
                    </div>
                    <div className="mt-6 w-full space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Target</span>
                            <span className="font-bold text-gray-900">{Utils.formatCurrency(expectedIncome)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Collected</span>
                            <span className="font-bold text-green-600">{Utils.formatCurrency(totalIncome)}</span>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expense Breakdown Pie */}
                <Card className="p-6">
                    <h3 className="font-bold text-gray-900 mb-6">Expense Distribution</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={expenseChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {expenseChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Top Debtors Table */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900">Top Debtors</h3>
                        <Button variant="ghost" size="sm" className="text-brand-600 hover:text-brand-700 font-bold uppercase text-xs">
                            View All Report
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {debtors.slice(0, 5).map(({ student, balance }) => {
                            const cls = classes.find(c => c.id === student.class_id);
                            return (
                                <div key={student.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                                            {student.names.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm group-hover:text-brand-600 transition-colors">{student.names}</p>
                                            <p className="text-xs text-gray-400 font-medium">{cls?.name} • {student.student_no}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-red-600 text-sm">{Utils.formatCurrency(balance)}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Balance due</p>
                                    </div>
                                </div>
                            );
                        })}
                        {debtors.length === 0 && (
                            <div className="text-center py-12">
                                <div className="h-16 w-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <TrendingUp size={32} />
                                </div>
                                <h4 className="font-bold text-gray-900">All caught up!</h4>
                                <p className="text-sm text-gray-500 mt-1">There are currently no outstanding fees.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};
