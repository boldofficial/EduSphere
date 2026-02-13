'use client';

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Star, Zap, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCreateConductEntry } from '@/lib/hooks/use-data';
import { useToast } from '@/components/providers/toast-provider';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';

interface ConductLogWidgetProps {
    students: Types.Student[];
    onSuccess?: () => void;
}

export const ConductLogWidget: React.FC<ConductLogWidgetProps> = ({ students, onSuccess }) => {
    const { mutate: createEntry, isPending } = useCreateConductEntry();
    const { addToast } = useToast();

    const [selectedStudent, setSelectedStudent] = useState('');
    const [category, setCategory] = useState<'positive' | 'negative'>('positive');
    const [behavior, setBehavior] = useState('');
    const [points, setPoints] = useState(5);
    const [remark, setRemark] = useState('');

    const presetBehaviors = {
        positive: [
            { label: 'Participation', icon: Star, points: 5 },
            { label: 'Leadership', icon: Zap, points: 10 },
            { label: 'Helpfulness', icon: ThumbsUp, points: 5 },
            { label: 'Good Homework', icon: Save, points: 5 },
        ],
        negative: [
            { label: 'Disturbing Class', icon: ThumbsDown, points: -5 },
            { label: 'Late Arrival', icon: ClockIcon, points: -2 },
            { label: 'Incomplete Work', icon: MessageSquare, points: -5 },
            { label: 'Disobedience', icon: AlertIcon, points: -10 },
        ]
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent || !behavior) {
            addToast('Please select a student and behavior', 'error');
            return;
        }

        createEntry({
            student: selectedStudent,
            behavior_type: behavior,
            category: category,
            points: points,
            remark: remark,
            date: Utils.getTodayString()
        }, {
            onSuccess: () => {
                addToast('Behavior logged successfully', 'success');
                setBehavior('');
                setRemark('');
                onSuccess?.();
            }
        });
    };

    return (
        <Card className="p-6 border-none shadow-sm bg-white rounded-[32px]">
            <div className="flex items-center gap-2 mb-6">
                <div className={`p-2 rounded-xl ${category === 'positive' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {category === 'positive' ? <Star size={18} strokeWidth={3} /> : <ThumbsDown size={18} strokeWidth={3} />}
                </div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Log Conduct</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
                        <button
                            type="button"
                            onClick={() => { setCategory('positive'); setPoints(5); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${category === 'positive' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <ThumbsUp size={14} />
                            Positive
                        </button>
                        <button
                            type="button"
                            onClick={() => { setCategory('negative'); setPoints(-5); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${category === 'negative' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <ThumbsDown size={14} />
                            Negative
                        </button>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Select Student</p>
                        <select
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        >
                            <option value="">Select a student...</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.names}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Quick Behaviors</p>
                        <div className="grid grid-cols-2 gap-2">
                            {presetBehaviors[category].map((b, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => { setBehavior(b.label); setPoints(b.points); }}
                                    className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${behavior === b.label ? (category === 'positive' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700') : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <b.icon size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">{b.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Custom Note (Optional)</p>
                        <textarea
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            placeholder="Add more context..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 min-h-[80px]"
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={isPending}
                    className={`w-full py-6 rounded-2xl font-black uppercase tracking-wider ${category === 'positive' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
                >
                    {isPending ? 'Logging...' : `Log ${behavior || 'Behavior'} (${points > 0 ? '+' : ''}${points})`}
                </Button>
            </form>
        </Card>
    );
};

// Simple Fallback Icons - Using function declarations for hoisting
function ClockIcon({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
};

function AlertIcon({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
};
