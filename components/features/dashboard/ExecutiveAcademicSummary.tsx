import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingDown, Target, Zap, Activity, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import apiClient from '@/lib/api-client';
import { useSettings } from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';

interface AIInsightData {
    insights: string;
    summary: {
        at_risk_count: number;
        average_attendance: number;
        top_subjects: string[];
        trends: {
            average_score: number;
        }
    };
    term_info: {
        session: string;
        term: string;
    }
}

export const ExecutiveAcademicSummary: React.FC = () => {
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();
    const [data, setData] = useState<AIInsightData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get('/ai-insights/', {
                    params: {
                        session: settings.current_session,
                        term: settings.current_term
                    }
                });
                setData(res.data);
            } catch (error) {
                console.error('Failed to fetch AI insights:', error);
            } finally {
                setLoading(false);
            }
        };

        if (settings.current_session && settings.current_term) {
            fetchInsights();
        }
    }, [settings.current_session, settings.current_term]);

    if (loading) {
        return (
            <Card className="animate-pulse h-64 flex flex-col items-center justify-center space-y-4">
                <Sparkles className="h-8 w-8 text-brand-200" />
                <div className="h-4 w-48 bg-gray-100 rounded"></div>
            </Card>
        );
    }

    if (!data) return null;

    return (
        <Card className="overflow-hidden border-brand-100 shadow-xl shadow-brand-500/5">
            <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-900 p-4 lg:p-6 text-white relative">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Zap className="h-24 w-24" />
                </div>

                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-brand-400/20 backdrop-blur-md rounded-lg">
                        <Sparkles className="h-5 w-5 text-brand-300" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-200">Executive Performance Insights</span>
                </div>

                <h2 className="text-xl lg:text-3xl font-black mb-1">
                    {settings.current_term} Overview
                </h2>
                <p className="text-brand-200/80 text-sm font-medium">
                    AI-Powered analysis of {data.summary.at_risk_count + 10} active student files.
                </p>
            </div>

            <div className="p-4 lg:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase">At-Risk Students</span>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-black ${data.summary.at_risk_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {data.summary.at_risk_count}
                            </span>
                            <TrendingDown className="h-4 w-4 text-gray-300" />
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed italic">
                            Requires immediate intervention in Core Subjects.
                        </p>
                    </div>

                    <div className="space-y-1 border-x border-gray-100 px-0 md:px-6">
                        <span className="text-xs font-bold text-gray-400 uppercase">Avg. Attendance</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-900">
                                {data.summary.average_attendance}%
                            </span>
                            <Activity className="h-4 w-4 text-brand-400" />
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed italic">
                            Performance remains stable compared to last term.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase">Term Average</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-indigo-600">
                                {data.summary.trends.average_score.toFixed(1)}%
                            </span>
                            <Target className="h-4 w-4 text-indigo-400" />
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed italic">
                            Targeting 75% for overall academic excellence.
                        </p>
                    </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 lg:p-6 relative">
                    <h3 className="flex items-center gap-2 text-indigo-900 font-bold mb-4 text-sm">
                        <Info className="h-4 w-4" />
                        AI Strategic Recommendations
                    </h3>

                    <div className="prose prose-sm prose-indigo whitespace-pre-wrap text-indigo-800 leading-relaxed font-medium italic">
                        {data.insights}
                    </div>
                </div>
            </div>
        </Card>
    );
};
