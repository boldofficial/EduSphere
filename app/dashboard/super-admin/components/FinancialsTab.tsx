'use client';

import React, { useMemo } from 'react';
import {
    CreditCard, TrendingUp, TrendingDown, DollarSign, ArrowUpRight,
    Calendar, Download, Wallet, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area
} from 'recharts';

function MetricCard({ title, value, icon: Icon, gradient, trend, trendLabel }: any) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
                <Icon size={96} />
            </div>
            <div className="relative z-10">
                <div className={`w-11 h-11 ${gradient} rounded-xl flex items-center justify-center text-white shadow-lg mb-4`}>
                    <Icon size={20} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
                {trend && (
                    <div className={`flex items-center gap-1 mt-3 text-xs font-bold ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span>{trend > 0 ? '+' : ''}{trend}%</span>
                        {trendLabel && <span className="text-gray-400 ml-1">{trendLabel}</span>}
                    </div>
                )}
            </div>
        </div>
    );
}

export function FinancialsTab({ revenue }: any) {
    // Derive monthly data from recent payments or use fallback
    const monthlyData = useMemo(() => {
        if (revenue?.monthly_revenue && revenue.monthly_revenue.length > 0) {
            return revenue.monthly_revenue;
        }
        // Build from recent_payments if available
        const months: Record<string, number> = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months[monthNames[d.getMonth()]] = 0;
        }
        revenue?.recent_payments?.forEach((p: any) => {
            const d = new Date(p.date);
            const key = monthNames[d.getMonth()];
            if (key in months) months[key] += parseFloat(p.amount);
        });
        return Object.entries(months).map(([name, value]) => ({ name, value }));
    }, [revenue]);

    const thisMonthRevenue = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1]?.value || 0 : 0;
    const lastMonthRevenue = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2]?.value || 0 : 0;
    const monthGrowth = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;

    const paymentCount = revenue?.recent_payments?.length || 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Financial Overview</h2>
                    <p className="text-gray-500 text-sm font-medium mt-1">Revenue analytics and transaction history.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Revenue"
                    value={`₦${parseFloat(revenue?.total_revenue || 0).toLocaleString()}`}
                    icon={Wallet}
                    gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
                    trend={12}
                    trendLabel="vs last year"
                />
                <MetricCard
                    title="This Month"
                    value={`₦${thisMonthRevenue.toLocaleString()}`}
                    icon={Calendar}
                    gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                    trend={monthGrowth}
                    trendLabel="vs last month"
                />
                <MetricCard
                    title="Transactions"
                    value={paymentCount}
                    icon={CreditCard}
                    gradient="bg-gradient-to-br from-violet-500 to-purple-700"
                />
                <MetricCard
                    title="Avg. Payment"
                    value={`₦${paymentCount > 0 ? Math.round(parseFloat(revenue?.total_revenue || 0) / paymentCount).toLocaleString() : '0'}`}
                    icon={DollarSign}
                    gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                />
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-md">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-900">Revenue Performance</h3>
                            <p className="text-xs font-medium text-gray-400">Last 6 months trend</p>
                        </div>
                    </div>
                </div>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData}>
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }}
                                tickFormatter={(v: number) => `₦${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '12px 18px' }}
                                formatter={(value: any) => [`₦${value.toLocaleString()}`, 'Revenue']}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#10b981"
                                strokeWidth={3}
                                fill="url(#revenueGradient)"
                                dot={{ r: 5, fill: '#10b981', strokeWidth: 3, stroke: '#fff' }}
                                activeDot={{ r: 7, strokeWidth: 0, fill: '#10b981' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900">Recent Transactions</h3>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-3 py-1 rounded-full">
                        {paymentCount} records
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/80 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wider">School</th>
                                <th className="px-6 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wider">Reference</th>
                                <th className="px-6 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {revenue?.recent_payments?.map((payment: any, i: number) => (
                                <tr key={i} className="hover:bg-brand-50/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black">
                                                {payment.school__name?.[0]}
                                            </div>
                                            <span className="font-bold text-gray-900 text-sm">{payment.school__name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-emerald-600 font-black text-sm flex items-center gap-1">
                                            <ArrowUpRight size={14} /> ₦{parseFloat(payment.amount).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-sm font-medium">{new Date(payment.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-gray-400 text-xs font-mono">{payment.reference}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 rounded-full text-[10px] font-black uppercase">
                                            <CheckCircle2 size={10} /> Paid
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {(!revenue?.recent_payments || revenue.recent_payments.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <Wallet size={40} className="mx-auto mb-4 text-gray-200" />
                                        <p className="font-bold text-gray-400">No transactions recorded yet.</p>
                                        <p className="text-sm text-gray-300 mt-1">Payments will appear here as schools subscribe.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
