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
import { useFinancialStats } from '@/lib/hooks/use-data';

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
    // Phase 2: Use backend-calculated stats for performance
    const { data: stats, isLoading } = useFinancialStats(settings.current_session, settings.current_term);

    // Filter for current session/term (Fallback for charts not yet in specialized stats)
    const currentPayments = payments.filter(p => p.session === settings.current_session && p.term === settings.current_term);
    const currentExpenses = expenses.filter(e => e.session === settings.current_session && e.term === settings.current_term);

    // Derived values from backend stats
    const totalIncome = stats?.summary.total_income ?? currentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalExpenses = stats?.summary.total_expenses ?? currentExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netBalance = stats?.summary.net_balance ?? (totalIncome - totalExpenses);
    const expectedIncome = stats?.summary.total_expected ?? students.reduce((sum, student) => {
        const { totalBill } = Utils.getStudentBalance(student, fees, payments, settings.current_session, settings.current_term);
        return sum + totalBill;
    }, 0);

    const totalOutstanding = expectedIncome - totalIncome;
    const collectionRate = expectedIncome > 0 ? (totalIncome / expectedIncome) * 100 : 0;

    // Chart Data: Payment Methods from stats or fallback
    const paymentChartData = stats
        ? Object.entries(stats.breakdown.methods).map(([name, value]) => ({ name, value }))
        : Object.entries(currentPayments.reduce((acc, p) => {
            const method = p.method || 'other';
            acc[method] = (acc[method] || 0) + (Number(p.amount) || 0);
            return acc;
        }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }));

    // Chart Data: Expense Categories from stats or fallback
    const expenseChartData = stats
        ? Object.entries(stats.breakdown.expense_categories).map(([name, value]) => ({ name, value }))
        : Object.entries(currentExpenses.reduce((acc, e) => {
            const category = e.category || 'other';
            acc[category] = (acc[category] || 0) + (Number(e.amount) || 0);
            return acc;
        }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }));

    // Debtors analysis (Still needs local student data for the list, and calculating balance)
    const debtors = students.map(student => {
        const { balance } = Utils.getStudentBalance(student, fees, payments, settings.current_session, settings.current_term);
        return { student, balance };
    }).filter(d => d.balance > 0).sort((a, b) => b.balance - a.balance);

    const revenueChartData = stats?.breakdown.monthly_trend ?? Object.values(currentPayments.reduce((acc, p) => {
        const month = p.date ? new Date(p.date).toLocaleString('default', { month: 'short' }) : 'Unknown';
        if (!acc[month]) acc[month] = { month, income: 0, expense: 0 };
        acc[month].income += (Number(p.amount) || 0);
        return acc;
    }, {} as Record<string, any>)).sort((a, b) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(a.month) - months.indexOf(b.month);
    });

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-6">
                    <div className="absolute top-[-10%] right-[-10%] h-24 w-24 bg-white/10 rounded-full blur-2xl" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-emerald-50/80 text-xs font-bold uppercase tracking-wider">Total Income</p>
                            <p className="text-3xl font-black mt-1 leading-none">{Utils.formatCurrency(totalIncome)}</p>
                            <div className="flex items-center mt-3 bg-white/20 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm">
                                <TrendingUp size={12} className="mr-1" />
                                <span>{currentPayments.length} transactions</span>
                            </div>
                        </div>
                        <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                            <DollarSign size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-rose-500 to-red-700 text-white p-6">
                    <div className="absolute top-[-10%] right-[-10%] h-24 w-24 bg-white/10 rounded-full blur-2xl" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-rose-50/80 text-xs font-bold uppercase tracking-wider">Total Expenses</p>
                            <p className="text-3xl font-black mt-1 leading-none">{Utils.formatCurrency(totalExpenses)}</p>
                            <div className="flex items-center mt-3 bg-white/20 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm">
                                <TrendingDown size={12} className="mr-1" />
                                <span>{currentExpenses.length} records</span>
                            </div>
                        </div>
                        <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                            <TrendingDown size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-brand-600 to-indigo-800 text-white p-6">
                    <div className="absolute top-[-10%] right-[-10%] h-24 w-24 bg-white/10 rounded-full blur-2xl" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-brand-50/80 text-xs font-bold uppercase tracking-wider">Net Balance</p>
                            <p className="text-3xl font-black mt-1 leading-none">
                                {Utils.formatCurrency(netBalance)}
                            </p>
                            <div className="flex items-center mt-3 bg-white/20 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm">
                                <PieChartIcon size={12} className="mr-1" />
                                <span>{netBalance >= 0 ? 'SURPLUS' : 'DEFICIT'}</span>
                            </div>
                        </div>
                        <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                            <PieChartIcon size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-amber-400 to-orange-600 text-white p-6">
                    <div className="absolute top-[-10%] right-[-10%] h-24 w-24 bg-white/10 rounded-full blur-2xl" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-amber-50/80 text-xs font-bold uppercase tracking-wider">Outstanding Fees</p>
                            <p className="text-3xl font-black mt-1 leading-none">{Utils.formatCurrency(totalOutstanding)}</p>
                            <div className="flex items-center mt-3 bg-white/20 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm">
                                <AlertTriangle size={12} className="mr-1" />
                                <span>{debtors.length} students owing</span>
                            </div>
                        </div>
                        <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
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
