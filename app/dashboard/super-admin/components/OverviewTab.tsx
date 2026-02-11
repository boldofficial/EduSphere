'use client';

import React from 'react';
import {
    Activity, Users, Zap, Server, Shield, CheckCircle2, AlertCircle,
    GraduationCap, TrendingUp, ScrollText, CreditCard, Clock, Plus
} from 'lucide-react';
import { School as SchoolIcon } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { AIPlatformInsights } from '@/components/features/AIPlatformInsights';

export function StatCard({ title, value, icon: Icon, color, trend }: any) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4 hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white shadow-lg opacity-90 group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
                </div>
            </div>
            {trend && (
                <div className="pt-3 border-t border-gray-50 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">{trend}</p>
                </div>
            )}
        </div>
    );
}

export function HealthCard({ title, status, message, icon: Icon }: any) {
    const isHealthy = status === 'healthy';

    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
                <div className={`p-2 rounded-lg ${isHealthy ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <Icon size={18} />
                </div>
                <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${isHealthy ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700 font-bold'
                    }`}>
                    {isHealthy ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                    {status}
                </span>
            </div>
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
                <p className="text-lg font-black text-gray-900 leading-tight">{message}</p>
            </div>
        </div>
    );
}

export function OverviewTab({ schools, plans, revenue, health, strategic, governance, onImpersonate }: any) {
    const stats = health?.platform_stats || {};
    const activities = governance?.activities || [];

    const registrationData = strategic?.registrations || [
        { name: 'Jan', value: 4 },
        { name: 'Feb', value: 7 },
        { name: 'Mar', value: 12 },
    ];

    const revenueData = strategic?.revenue || [
        { name: 'Jan', value: 150000 },
        { name: 'Feb', value: 280000 },
        { name: 'Mar', value: 450000 },
    ];

    const planData = strategic?.plans?.map((p: any) => ({
        name: p.name,
        value: p.school_count
    })) || [
            { name: 'Basic', value: 10 },
            { name: 'Pro', value: 5 },
            { name: 'Enterprise', value: 2 },
        ];

    const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b'];

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">System Overview</h2>
                    <p className="text-gray-500 mt-1">Cross-tenant performance and infrastructure health.</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Last Updated</p>
                    <p className="text-sm font-medium text-brand-600">{health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : '---'}</p>
                </div>
            </div>

            {/* AI Insights & Infrastructure Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <AIPlatformInsights schools={schools} health={health} revenue={revenue} />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-6">
                    <HealthCard
                        title="Redis Cache"
                        status={health?.redis_status === 'connected' ? 'healthy' : 'error'}
                        message={health?.redis_status === 'connected' ? 'Operational' : 'Disconnected'}
                        icon={Zap}
                    />
                    <HealthCard
                        title="Celery Workers"
                        status={health?.celery_status === 'active' ? 'healthy' : 'error'}
                        message={health?.celery_status === 'active' ? 'Active' : 'Offline'}
                        icon={Server}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <HealthCard
                    title="DB Latency"
                    status="healthy"
                    message={health?.db_latency || '---'}
                    icon={Activity}
                />
                <HealthCard
                    title="Security Shield"
                    status="healthy"
                    message="Hardened"
                    icon={Shield}
                />
            </div>

            {/* Global Aggregates */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Total Schools"
                    value={stats.total_schools || schools.length}
                    icon={SchoolIcon}
                    color="bg-blue-500"
                    trend="+2 new this week"
                />
                <StatCard
                    title="Global Students"
                    value={stats.total_students || 0}
                    icon={Users}
                    color="bg-indigo-500"
                />
                <StatCard
                    title="Total Teachers"
                    value={stats.total_teachers || 0}
                    icon={GraduationCap}
                    color="bg-orange-500"
                />
                <StatCard
                    title="Annual Revenue"
                    value={`₦${parseFloat(revenue?.total_revenue || 0).toLocaleString()}`}
                    icon={CreditCard}
                    color="bg-emerald-500"
                    trend="On track"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Registration Growth Chart */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-8">
                        <TrendingUp className="text-blue-600" size={20} />
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">Registration Growth</h3>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={registrationData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#0ea5e9"
                                    strokeWidth={4}
                                    dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue Performance Chart */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-8">
                        <CreditCard className="text-emerald-600" size={20} />
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">Revenue Trends</h3>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`₦${value.toLocaleString()}`, 'Revenue']}
                                />
                                <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Subscription Mix (Pie Chart) */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm lg:col-span-2">
                    <div className="flex items-center gap-2 mb-8">
                        <Zap className="text-brand-600" size={20} />
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">Subscription Plan Mix</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={planData}
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {planData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-4">
                            {planData.map((item: any, index: number) => (
                                <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="font-bold text-gray-900">{item.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-black text-gray-900">{item.value}</span>
                                        <span className="text-xs text-gray-400 ml-1">Schools</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Activity Stream */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mt-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <ScrollText className="text-slate-600" size={20} />
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">Live Activity Stream</h3>
                    </div>
                </div>
                <div className="space-y-4">
                    {activities.slice(0, 5).map((log: any) => (
                        <div key={log.id} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-brand-200 transition-all">
                            <div className="mt-1">
                                {log.action.includes('PAYMENT') ? <CreditCard className="text-emerald-500" size={16} /> :
                                    log.action.includes('SIGNUP') ? <Plus className="text-blue-500" size={16} /> :
                                        <Activity className="text-slate-400" size={16} />}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{log.description}</p>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-[10px] font-bold text-brand-600 uppercase bg-brand-50 px-2 py-0.5 rounded-full">{log.school_name}</span>
                                    <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                                        <Clock size={10} />
                                        {new Date(log.created_at).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {activities.length === 0 && <p className="text-center py-10 text-gray-400">No activity recorded yet.</p>}
                </div>
            </div>
        </div>
    );
}
