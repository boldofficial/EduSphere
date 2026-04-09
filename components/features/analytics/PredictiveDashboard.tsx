'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useClasses, useSettings } from '@/lib/hooks/use-data';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/providers/toast-provider';
import {
    AlertTriangle, TrendingUp, TrendingDown, Shield,
    Loader2, Sparkles, ChevronDown, ChevronUp, Users, Target, BookOpen
} from 'lucide-react';

interface Prediction {
    risk_level: 'high' | 'medium' | 'low';
    predicted_average: number;
    confidence: number;
    key_concerns: string[];
    strengths: string[];
    recommendations: string[];
}

interface StudentPrediction {
    student_id: string;
    student_name: string;
    student_no: string;
    current_average: number;
    attendance_rate: number;
    prediction: Prediction;
}

interface InsightsData {
    class_name: string;
    session: string;
    term: string;
    summary: {
        total_students: number;
        high_risk: number;
        medium_risk: number;
        low_risk: number;
    };
    predictions: StudentPrediction[];
}

const RISK_CONFIG = {
    high: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle, label: 'High Risk', dot: 'bg-red-500' },
    medium: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: TrendingDown, label: 'Medium Risk', dot: 'bg-amber-500' },
    low: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Shield, label: 'Low Risk', dot: 'bg-emerald-500' },
};

export default function PredictiveDashboard() {
    const { data: classes = [] } = useClasses();
    const { data: settings } = useSettings();
    const { addToast } = useToast();

    const [selectedClass, setSelectedClass] = useState('');
    const [session, setSession] = useState(settings?.current_session || '');
    const [term, setTerm] = useState(settings?.current_term || '');
    const [data, setData] = useState<InsightsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchPredictions = async () => {
        if (!selectedClass) {
            addToast('Please select a class', 'error');
            return;
        }
        setLoading(true);
        try {
            const res = await apiClient.get(`academic/predictive-insights/`, {
                params: { class_id: selectedClass, session, term }
            });
            setData(res.data);
        } catch {
            addToast('Failed to fetch predictions', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                        Predictive Insights
                    </h1>
                    <p className="text-gray-500 mt-1">AI-powered early warning system for student performance</p>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Class</label>
                        <Select value={selectedClass} onChange={(e: any) => setSelectedClass(e.target.value)}>
                            <option value="">Select a class...</option>
                            {classes.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Session</label>
                        <Select value={session} onChange={(e: any) => setSession(e.target.value)}>
                            <option value={settings?.current_session}>{settings?.current_session}</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Term</label>
                        <Select value={term} onChange={(e: any) => setTerm(e.target.value)}>
                            <option value="First Term">First Term</option>
                            <option value="Second Term">Second Term</option>
                            <option value="Third Term">Third Term</option>
                        </Select>
                    </div>
                    <Button onClick={fetchPredictions} disabled={loading} className="gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Analyze Class
                    </Button>
                </div>
            </Card>

            {/* Summary Cards */}
            {data && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="p-5 text-center border-l-4 border-l-gray-300">
                            <Users className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                            <p className="text-3xl font-black text-gray-900">{data.summary.total_students}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Students</p>
                        </Card>
                        <Card className="p-5 text-center border-l-4 border-l-red-500">
                            <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                            <p className="text-3xl font-black text-red-600">{data.summary.high_risk}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">High Risk</p>
                        </Card>
                        <Card className="p-5 text-center border-l-4 border-l-amber-500">
                            <TrendingDown className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                            <p className="text-3xl font-black text-amber-600">{data.summary.medium_risk}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Medium Risk</p>
                        </Card>
                        <Card className="p-5 text-center border-l-4 border-l-emerald-500">
                            <Shield className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                            <p className="text-3xl font-black text-emerald-600">{data.summary.low_risk}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Low Risk</p>
                        </Card>
                    </div>

                    {/* Student Risk Table */}
                    <Card className="overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b font-bold text-sm text-gray-600 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Student Performance Predictions — {data.class_name}
                        </div>
                        <div className="divide-y">
                            {data.predictions
                                .sort((a, b) => {
                                    const order = { high: 0, medium: 1, low: 2 };
                                    return order[a.prediction.risk_level] - order[b.prediction.risk_level];
                                })
                                .map((sp) => {
                                    const risk = RISK_CONFIG[sp.prediction.risk_level];
                                    const RiskIcon = risk.icon;
                                    const isExpanded = expandedId === sp.student_id;

                                    return (
                                        <div key={sp.student_id} className="hover:bg-gray-50/50 transition-colors">
                                            <div
                                                className="px-6 py-4 flex items-center gap-4 cursor-pointer"
                                                onClick={() => setExpandedId(isExpanded ? null : sp.student_id)}
                                            >
                                                <div className={`w-3 h-3 rounded-full ${risk.dot} flex-shrink-0`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 truncate">{sp.student_name}</p>
                                                    <p className="text-xs text-gray-400">{sp.student_no}</p>
                                                </div>
                                                <div className="text-center hidden sm:block">
                                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Avg</p>
                                                    <p className="font-black text-gray-900">{sp.current_average.toFixed(1)}</p>
                                                </div>
                                                <div className="text-center hidden sm:block">
                                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Attendance</p>
                                                    <p className="font-black text-gray-900">{sp.attendance_rate}%</p>
                                                </div>
                                                <div className="text-center hidden md:block">
                                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Predicted</p>
                                                    <p className="font-black text-brand-600">{sp.prediction.predicted_average?.toFixed(1) ?? '—'}</p>
                                                </div>
                                                <Badge className={`${risk.color} border gap-1 text-[10px] font-black uppercase tracking-wider`}>
                                                    <RiskIcon className="w-3 h-3" />
                                                    {risk.label}
                                                </Badge>
                                                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                            </div>

                                            {isExpanded && (
                                                <div className="px-6 pb-5 pl-12 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    {sp.prediction.key_concerns.length > 0 && (
                                                        <div className="bg-red-50 rounded-xl p-4">
                                                            <h4 className="text-xs font-black text-red-600 uppercase tracking-wider mb-2">⚠ Concerns</h4>
                                                            <ul className="space-y-1">
                                                                {sp.prediction.key_concerns.map((c, i) => (
                                                                    <li key={i} className="text-sm text-red-700">• {c}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {sp.prediction.strengths.length > 0 && (
                                                        <div className="bg-emerald-50 rounded-xl p-4">
                                                            <h4 className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-2">✓ Strengths</h4>
                                                            <ul className="space-y-1">
                                                                {sp.prediction.strengths.map((s, i) => (
                                                                    <li key={i} className="text-sm text-emerald-700">• {s}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {sp.prediction.recommendations.length > 0 && (
                                                        <div className="bg-blue-50 rounded-xl p-4">
                                                            <h4 className="text-xs font-black text-blue-600 uppercase tracking-wider mb-2">💡 Recommendations</h4>
                                                            <ul className="space-y-1">
                                                                {sp.prediction.recommendations.map((r, i) => (
                                                                    <li key={i} className="text-sm text-blue-700">• {r}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    </Card>
                </>
            )}

            {!data && !loading && (
                <div className="text-center py-24 bg-gray-50 rounded-2xl border-2 border-dashed">
                    <Target className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Select a class to begin</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Choose a class, session, and term above, then click &quot;Analyze Class&quot; to generate AI-powered performance predictions.
                    </p>
                </div>
            )}
        </div>
    );
}
