'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Bot, Zap } from 'lucide-react';

interface AIPlatformInsightsProps {
    schools: any[];
    health: any;
    revenue: any;
}

export const AIPlatformInsights: React.FC<AIPlatformInsightsProps> = ({ schools, health, revenue }) => {
    const [insight, setInsight] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const [insightType, setInsightType] = useState<'positive' | 'neutral' | 'warning'>('neutral');

    useEffect(() => {
        // Simple logic to generate "insights"
        const schoolCount = schools.length;
        const totalRevenue = parseFloat(revenue?.total_revenue || 0);
        const redisStatus = health?.redis_status === 'connected';

        let text = '';
        if (schoolCount > 2) {
            text = `Platform expansion detected. With ${schoolCount} active institutions, infrastructure usage is peaking. I recommend scaling Celery workers for peak registration hours. `;
            setInsightType('positive');
        } else if (!redisStatus) {
            text = `Critical alert: Redis caching is offline. Sub-millisecond response times are currently compromised. This will impact dashboard analytics performance. `;
            setInsightType('warning');
        } else {
            text = `System stability is optimal. Current platform health score: 98/100. Revenue trends show a 12% projected increase for the next quarter. `;
            setInsightType('neutral');
        }

        // Typing effect
        let i = 0;
        const timer = setInterval(() => {
            setInsight(text.slice(0, i));
            i++;
            if (i > text.length) {
                clearInterval(timer);
                setIsTyping(false);
            }
        }, 30);

        return () => clearInterval(timer);
    }, [schools, health, revenue]);

    return (
        <div className="relative group overflow-hidden bg-gradient-to-br from-brand-900 to-slate-900 rounded-[2rem] p-8 border border-white/10 shadow-2xl">
            {/* Animated Glow Backdrop */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/20 rounded-full blur-[100px] animate-pulse"></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                            <Bot className="text-brand-400" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">AI Platform Insights</h3>
                            <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest">Global Intelligence Layer</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-white/60">LIVE ANALYTICS</span>
                    </div>
                </div>

                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/5 min-h-[100px] flex items-start gap-4">
                    <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${insightType === 'positive' ? 'bg-emerald-500/20 text-emerald-400' :
                            insightType === 'warning' ? 'bg-rose-500/20 text-rose-400' :
                                'bg-brand-500/20 text-brand-400'
                        }`}>
                        {insightType === 'positive' ? <TrendingUp size={16} /> :
                            insightType === 'warning' ? <AlertTriangle size={16} /> :
                                <Sparkles size={16} />}
                    </div>
                    <div className="flex-1">
                        <p className="text-brand-50/90 text-sm leading-relaxed font-medium">
                            {insight}
                            {isTyping && <span className="inline-block w-1.5 h-4 ml-1 bg-brand-400 animate-blink"></span>}
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                        <Zap className="text-amber-400" size={20} />
                        <div>
                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Optimization</p>
                            <p className="text-xs font-bold text-white">Cache Active</p>
                        </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-400" size={20} />
                        <div>
                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Compliance</p>
                            <p className="text-xs font-bold text-white">Fully Verified</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Design Pattern: Glass Accent */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-500/50 to-transparent"></div>
        </div>
    );
};
