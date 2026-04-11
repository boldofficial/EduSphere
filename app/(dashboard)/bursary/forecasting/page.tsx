'use client';

import React, { useState } from 'react';
import { 
    TrendingUp, 
    Calendar, 
    DollarSign, 
    Target, 
    AlertCircle, 
    ArrowUpRight,
    Loader2,
    PieChart as PieChartIcon,
    Zap
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Area,
    Line
} from 'recharts';
import * as Utils from '@/lib/utils';
import { 
    useAcademicTerms, 
    useRevenueSummary, 
    useRevenueChart 
} from '@/lib/hooks/use-bursary';
import { useSettings } from '@/lib/hooks/use-data';

export default function RevenueForecastingPage() {
    const { data: settings } = useSettings();
    const { data: terms, isLoading: termsLoading } = useAcademicTerms();
    const [selectedTerm, setSelectedTerm] = useState<string | undefined>(undefined);

    // Default to a term if one exists and we haven't selected one
    const activeTermId = selectedTerm || terms?.find(t => t.is_current)?.id || terms?.[0]?.id;

    const { data: summary, isLoading: summaryLoading } = useRevenueSummary(activeTermId?.toString());
    const { data: chartData, isLoading: chartLoading } = useRevenueChart(activeTermId?.toString());

    if (termsLoading || !settings) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
        );
    }

    const currentTerm = terms?.find(t => t.id.toString() === activeTermId?.toString());

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-700">
            {/* Header section with term selection */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Revenue Forecasting</h1>
                    <p className="text-gray-500 font-medium">Predictive financial insights for {currentTerm?.name || 'Current Term'}</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                    <div className="pl-3 text-gray-400">
                        <Calendar size={18} />
                    </div>
                    <select 
                        className="bg-transparent border-none text-sm font-bold text-gray-700 pr-8 focus:ring-0 cursor-pointer"
                        value={activeTermId}
                        onChange={(e) => setSelectedTerm(e.target.value)}
                    >
                        {terms?.map(term => (
                            <option key={term.id} value={term.id}>
                                {term.name} ({term.session})
                            </option>
                        ))}
                        {(!terms || terms.length === 0) && (
                            <option>No Academic Terms Defined</option>
                        )}
                    </select>
                </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-indigo-600 to-blue-800 text-white p-6">
                    <div className="absolute top-[-10%] right-[-10%] h-24 w-24 bg-white/10 rounded-full blur-2xl" />
                    <div className="flex items-center justify-between relative z-10 gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-blue-100/70 text-xs font-bold uppercase tracking-wider truncate">Expected Revenue</p>
                            <p className="text-2xl font-black mt-1 leading-none">
                                {summary ? Utils.formatCurrency(summary.expected) : '---'}
                            </p>
                            <div className="flex items-center mt-3 bg-white/20 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm">
                                <Target size={12} className="mr-1" />
                                <span>TERM TARGET</span>
                            </div>
                        </div>
                        <div className="shrink-0 h-12 w-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                            <Target size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-6">
                    <div className="absolute top-[-10%] right-[-10%] h-24 w-24 bg-white/10 rounded-full blur-2xl" />
                    <div className="flex items-center justify-between relative z-10 gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-emerald-50/70 text-xs font-bold uppercase tracking-wider truncate">Collected To Date</p>
                            <p className="text-2xl font-black mt-1 leading-none">
                                {summary ? Utils.formatCurrency(summary.collected) : '---'}
                            </p>
                            <div className="flex items-center mt-3 bg-white/20 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm">
                                <ArrowUpRight size={12} className="mr-1" />
                                <span>{summary ? summary.collection_rate.toFixed(1) : 0}% COMPLETE</span>
                            </div>
                        </div>
                        <div className="shrink-0 h-12 w-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                            <DollarSign size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-amber-500 to-orange-700 text-white p-6">
                    <div className="absolute top-[-10%] right-[-10%] h-24 w-24 bg-white/10 rounded-full blur-2xl" />
                    <div className="flex items-center justify-between relative z-10 gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-amber-50/70 text-xs font-bold uppercase tracking-wider truncate">Outstanding Feed</p>
                            <p className="text-2xl font-black mt-1 leading-none">
                                {summary ? Utils.formatCurrency(summary.outstanding) : '---'}
                            </p>
                            <div className="flex items-center mt-3 bg-white/20 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm">
                                <AlertCircle size={12} className="mr-1" />
                                <span>ARREARS</span>
                            </div>
                        </div>
                        <div className="shrink-0 h-12 w-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                            <AlertCircle size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-violet-600 to-purple-800 text-white p-6">
                    <div className="absolute top-[-10%] right-[-10%] h-24 w-24 bg-white/10 rounded-full blur-2xl" />
                    <div className="flex items-center justify-between relative z-10 gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-violet-50/70 text-xs font-bold uppercase tracking-wider truncate">Revenue Forecast</p>
                            <p className="text-2xl font-black mt-1 leading-none">
                                {summary ? Utils.formatCurrency(summary.forecast) : '---'}
                            </p>
                            <div className="flex items-center mt-3 bg-white/20 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm">
                                <Zap size={12} className="mr-1" />
                                <span>PREDICTED OUTCOME</span>
                            </div>
                        </div>
                        <div className="shrink-0 h-12 w-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-8 shadow-sm border-gray-100 bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Collection Velocity</h3>
                            <p className="text-sm text-gray-400 font-medium italic">Tracking collection pace vs expected baseline</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 items-center self-start bg-gray-50 p-2 rounded-lg border border-gray-100">
                             <div className="flex items-center text-[10px] font-black uppercase text-gray-500">
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mr-1.5 shadow-sm" /> Target
                            </div>
                            <div className="flex items-center text-[10px] font-black uppercase text-gray-500">
                                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-1.5 shadow-sm" /> Actual
                            </div>
                            <div className="flex items-center text-[10px] font-black uppercase text-gray-500">
                                <div className="w-2.5 h-2.5 border-2 border-purple-400 rounded-full mr-1.5 shadow-sm" /> Forecast
                            </div>
                        </div>
                    </div>

                    <div className="h-[350px] w-full mt-4">
                        {chartLoading ? (
                             <div className="h-full flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                             </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData?.labels.map((label, index) => ({
                                    name: label,
                                    expected: chartData.expected[index],
                                    collected: chartData.collected[index],
                                    forecast: chartData.forecast[index]
                                }))}>
                                    <defs>
                                        <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                                        tickFormatter={(val) => `₦${(val/1000).toFixed(0)}k`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            borderRadius: '16px', 
                                            border: 'none', 
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            fontWeight: 700,
                                            fontSize: '12px'
                                        }}
                                        formatter={(val: string | number | undefined) => [Utils.formatCurrency(Number(val ?? 0)), '']}
                                    />
                                    <Area type="monotone" dataKey="forecast" stroke="#a78bfa" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorForecast)" />
                                    <Bar dataKey="collected" fill="url(#colorCollected)" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Line type="monotone" dataKey="expected" stroke="#3b82f6" strokeWidth={3} dot={false} strokeOpacity={0.5} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="p-8 shadow-sm border-gray-100 bg-white h-full relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 p-4 opacity-5 pointer-events-none">
                            <PieChartIcon size={120} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-6 underline decoration-brand-500/30 underline-offset-8">Insights</h3>
                        
                        <div className="space-y-6 relative z-10">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Collection Pace</span>
                                    <span className="text-sm font-black text-emerald-600">
                                        {summary?.collection_rate.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${summary?.collection_rate || 0}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Term Completion</span>
                                    <span className="text-sm font-black text-blue-600">
                                        {summary ? Math.min(100, (summary.days_elapsed / summary.days_total) * 100).toFixed(0) : 0}%
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5">
                                    <div 
                                        className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${summary ? (summary.days_elapsed / summary.days_total) * 100 : 0}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 font-bold italic translate-x-1">
                                    {summary?.days_elapsed} of {summary?.days_total} expected term days passed.
                                </p>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <div className="bg-brand-50/50 p-4 rounded-2xl border border-brand-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-6 w-6 bg-brand-500 rounded-lg flex items-center justify-center text-white">
                                            <Zap size={14} />
                                        </div>
                                        <h4 className="text-sm font-black text-brand-900 uppercase">Analysis</h4>
                                    </div>
                                    <p className="text-xs text-brand-800/80 font-medium leading-relaxed">
                                        Based on Current Velocity (₦{summary && summary.days_elapsed > 0 ? (summary.collected / summary.days_elapsed).toLocaleString() : '0'}/day), 
                                        collection is trending {summary && summary.forecast >= summary.expected ? 'above' : 'below'} initial targets.
                                        {summary && summary.outstanding > 0 && ` Actionable arrears of ${Utils.formatCurrency(summary.outstanding)} remain.`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Verification Footer */}
            <div className="flex justify-center pt-8">
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-emerald-400 animate-pulse rounded-full" /> 
                  Real-time Predictive Engine Active
               </p>
            </div>
        </div>
    );
}
