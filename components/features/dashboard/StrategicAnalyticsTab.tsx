'use client';

import React from 'react';
import {
    TrendingUp, Users, CreditCard, BarChart3,
    ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, AreaChart, Area,
    PieChart, Pie, Cell
} from 'recharts';

interface AnalyticsTabProps {
    data: {
        registrations: { name: string; value: number }[];
        revenue: { name: string; value: number }[];
        plans: { name: string; school_count: number }[];
    } | null | undefined;
}

const COLORS = ['#4F46E5', '#0EA5E9', '#F59E0B', '#10B981', '#EC4899'];

export const StrategicAnalyticsTab: React.FC<AnalyticsTabProps> = ({ data }) => {
    if (!data) return (
        <div className="p-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <Activity className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No analytics data available yet</p>
        </div>
    );

    const totalRevenue = data.revenue?.reduce((acc, curr) => acc + curr.value, 0) || 0;
    const totalSchools = data.registrations?.reduce((acc, curr) => acc + curr.value, 0) || 0;

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            {/* Header Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-brand-600 text-white p-8 rounded-[32px] shadow-2xl shadow-brand-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp size={120} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Total Platform Revenue</p>
                    <h3 className="text-4xl font-black mb-4 tracking-tighter">₦{totalRevenue.toLocaleString()}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold bg-white/20 w-max px-3 py-1 rounded-full border border-white/20">
                        <ArrowUpRight size={14} /> 12% vs last month
                    </div>
                </div>

                <div className="bg-indigo-600 text-white p-8 rounded-[32px] shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Users size={120} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Institutional Growth</p>
                    <h3 className="text-4xl font-black mb-4 tracking-tighter">{totalSchools} Schools</h3>
                    <div className="flex items-center gap-2 text-xs font-bold bg-white/20 w-max px-3 py-1 rounded-full border border-white/20">
                        <Activity size={14} /> +2 this week
                    </div>
                </div>

                <div className="bg-amber-500 text-white p-8 rounded-[32px] shadow-2xl shadow-amber-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <CreditCard size={120} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Avg. Revenue / School</p>
                    <h3 className="text-4xl font-black mb-4 tracking-tighter">₦{(totalRevenue / (totalSchools || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold bg-white/20 w-max px-3 py-1 rounded-full border border-white/20">
                        <BarChart3 size={14} /> High efficiency
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Trend */}
                <div className="bg-white p-8 rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-xl font-black text-gray-900 tracking-tight">Revenue Trajectory</h4>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Gross platform income over 12 months</p>
                        </div>
                        <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.revenue}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} dy={10} />
                                <YAxis stroke="#9CA3AF" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} tickFormatter={(v) => `₦${v / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                    formatter={(v: any) => [`₦${v.toLocaleString()}`, 'Revenue']}
                                />
                                <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Registration Trend */}
                <div className="bg-white p-8 rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-xl font-black text-gray-900 tracking-tight">Registration Pulse</h4>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">New school signups per month</p>
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {(<BarChart data={data.registrations}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} dy={10} />
                                <YAxis stroke="#9CA3AF" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                    cursor={{ fill: '#F3F4F6' }}
                                />
                                <Bar dataKey="value" fill="#6366F1" radius={[10, 10, 0, 0]} barSize={24} />
                            </BarChart>) as any}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Plan Distribution */}
                <div className="bg-white p-8 rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-xl font-black text-gray-900 tracking-tight">Subscription Mix</h4>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Market share per license type</p>
                        </div>
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                            <BarChart3 size={24} />
                        </div>
                    </div>
                    <div className="h-[300px] w-full flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            {(<PieChart>
                                <Pie
                                    data={data.plans}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="school_count"
                                    nameKey="name"
                                >
                                    {data.plans.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                />
                            </PieChart>) as any}
                        </ResponsiveContainer>
                        <div className="flex flex-col gap-3 pr-8">
                            {data.plans.map((plan, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-xs font-black text-gray-600 uppercase tracking-tight">{plan.name}</span>
                                    <span className="text-xs font-bold text-gray-400 ml-auto">{plan.school_count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mini Summary List */}
                <div className="bg-gray-900 text-white p-8 rounded-[40px] shadow-2xl shadow-gray-950/20 flex flex-col justify-between">
                    <div>
                        <h4 className="text-xl font-black tracking-tight mb-2">Platform Integrity</h4>
                        <p className="text-xs text-brand-400 font-bold uppercase tracking-wider mb-8">System reliability snapshots</p>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-sm font-bold opacity-60 uppercase tracking-wider">Payment Reliability</span>
                                <span className="text-lg font-black text-green-400 font-mono">99.9%</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-sm font-bold opacity-60 uppercase tracking-wider">Storage Availability</span>
                                <span className="text-lg font-black text-blue-400 font-mono">98.4%</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-sm font-bold opacity-60 uppercase tracking-wider">API Latency (Avg)</span>
                                <span className="text-lg font-black text-amber-400 font-mono">142ms</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 mt-8 border-t border-white/10 text-center">
                        <button className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-400 hover:text-brand-300 transition-colors">
                            Generate Full Audit PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
