'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useClasses } from '@/lib/hooks/use-data';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/providers/toast-provider';
import { Sparkles, Loader2, Clock, BookOpen, ClipboardCopy, CheckCircle, Lightbulb } from 'lucide-react';

interface LessonSection {
    title: string;
    duration: string;
    activities: string[];
    teacher_notes: string;
}

interface LessonPlan {
    title: string;
    subject: string;
    class_name: string;
    duration: string;
    objectives: string[];
    materials: string[];
    sections: LessonSection[];
    assessment: string[];
    homework: string;
    differentiation: {
        advanced: string;
        struggling: string;
    };
}

export default function LessonPlanGenerator() {
    const { data: classes = [] } = useClasses();
    const { addToast } = useToast();

    const [subject, setSubject] = useState('');
    const [className, setClassName] = useState('');
    const [topic, setTopic] = useState('');
    const [duration, setDuration] = useState('45');
    const [objectives, setObjectives] = useState('');
    const [plan, setPlan] = useState<LessonPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const generatePlan = async () => {
        if (!subject || !className || !topic) {
            addToast('Please fill in Subject, Class, and Topic', 'error');
            return;
        }
        setLoading(true);
        setPlan(null);
        try {
            const res = await apiClient.post('academic/ai-lesson-plan/', {
                subject, class_name: className, topic,
                duration_minutes: parseInt(duration),
                objectives,
            });
            setPlan(res.data.plan);
            addToast('Lesson plan generated!', 'success');
        } catch {
            addToast('Failed to generate lesson plan', 'error');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!plan) return;
        const text = `
# ${plan.title}
Subject: ${plan.subject} | Class: ${plan.class_name} | Duration: ${plan.duration}

## Objectives
${plan.objectives.map(o => `- ${o}`).join('\n')}

## Materials
${plan.materials.map(m => `- ${m}`).join('\n')}

## Lesson Flow
${plan.sections.map(s => `### ${s.title} (${s.duration})\n${s.activities.map(a => `- ${a}`).join('\n')}\n_Teacher Notes: ${s.teacher_notes}_`).join('\n\n')}

## Assessment
${plan.assessment.map(a => `- ${a}`).join('\n')}

## Homework
${plan.homework}

## Differentiation
- Advanced Learners: ${plan.differentiation.advanced}
- Struggling Learners: ${plan.differentiation.struggling}
        `.trim();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-6 space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-white" />
                    </div>
                    Smart Lesson Planner
                </h1>
                <p className="text-gray-500 mt-1">Generate detailed, curriculum-aligned lesson plans with AI</p>
            </div>

            {/* Input Form */}
            <Card className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subject *</label>
                        <Input placeholder="e.g. Mathematics" value={subject} onChange={(e: any) => setSubject(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Class *</label>
                        <Select value={className} onChange={(e: any) => setClassName(e.target.value)}>
                            <option value="">Select class...</option>
                            {classes.map((c: any) => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </Select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Topic *</label>
                    <Input placeholder="e.g. Introduction to Quadratic Equations" value={topic} onChange={(e: any) => setTopic(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Duration (minutes)</label>
                        <Select value={duration} onChange={(e: any) => setDuration(e.target.value)}>
                            <option value="30">30 minutes</option>
                            <option value="35">35 minutes</option>
                            <option value="40">40 minutes</option>
                            <option value="45">45 minutes</option>
                            <option value="60">60 minutes</option>
                            <option value="80">80 minutes (Double)</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Learning Objectives (optional)</label>
                        <Input placeholder="e.g. Students should be able to solve x² + bx + c = 0" value={objectives} onChange={(e: any) => setObjectives(e.target.value)} />
                    </div>
                </div>
                <Button onClick={generatePlan} disabled={loading} className="w-full gap-2 h-12 text-base font-bold">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {loading ? 'Generating Plan...' : 'Generate Lesson Plan'}
                </Button>
            </Card>

            {/* Generated Plan Output */}
            {plan && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Plan Header */}
                    <Card className="p-6 bg-gradient-to-r from-brand-50 to-blue-50 border-brand-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">{plan.title}</h2>
                                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {plan.subject}</span>
                                    <span>|</span>
                                    <span>{plan.class_name}</span>
                                    <span>|</span>
                                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {plan.duration}</span>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2 flex-shrink-0">
                                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <ClipboardCopy className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy Plan'}
                            </Button>
                        </div>
                    </Card>

                    {/* Objectives & Materials */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-5">
                            <h3 className="text-xs font-black text-brand-600 uppercase tracking-wider mb-3">🎯 Learning Objectives</h3>
                            <ul className="space-y-2">
                                {plan.objectives.map((o, i) => (
                                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                        <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                                        {o}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                        <Card className="p-5">
                            <h3 className="text-xs font-black text-orange-600 uppercase tracking-wider mb-3">📦 Materials Needed</h3>
                            <ul className="space-y-1.5">
                                {plan.materials.map((m, i) => (
                                    <li key={i} className="text-sm text-gray-700">• {m}</li>
                                ))}
                            </ul>
                        </Card>
                    </div>

                    {/* Lesson Flow */}
                    <Card className="p-6">
                        <h3 className="text-xs font-black text-purple-600 uppercase tracking-wider mb-4">📋 Lesson Flow</h3>
                        <div className="space-y-4">
                            {plan.sections.map((s, i) => (
                                <div key={i} className="border rounded-xl p-4 hover:shadow-sm transition-shadow">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                                            {s.title}
                                        </h4>
                                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {s.duration}
                                        </span>
                                    </div>
                                    <ul className="space-y-1.5 mb-3">
                                        {s.activities.map((a, j) => (
                                            <li key={j} className="text-sm text-gray-600">• {a}</li>
                                        ))}
                                    </ul>
                                    {s.teacher_notes && (
                                        <p className="text-xs text-gray-400 italic border-t pt-2 mt-2">
                                            💡 {s.teacher_notes}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Assessment, Homework, Differentiation */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-5">
                            <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider mb-3">📝 Assessment</h3>
                            <ul className="space-y-1.5">
                                {plan.assessment.map((a, i) => (
                                    <li key={i} className="text-sm text-gray-700">• {a}</li>
                                ))}
                            </ul>
                        </Card>
                        <Card className="p-5">
                            <h3 className="text-xs font-black text-green-600 uppercase tracking-wider mb-3">🏠 Homework</h3>
                            <p className="text-sm text-gray-700">{plan.homework}</p>
                        </Card>
                        <Card className="p-5">
                            <h3 className="text-xs font-black text-violet-600 uppercase tracking-wider mb-3">🔀 Differentiation</h3>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs font-bold text-gray-400">Advanced:</p>
                                    <p className="text-sm text-gray-700">{plan.differentiation.advanced}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400">Struggling:</p>
                                    <p className="text-sm text-gray-700">{plan.differentiation.struggling}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
