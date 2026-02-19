'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, MonitorPlay, FileText, Sparkles, Target } from 'lucide-react';

import { useSchoolStore } from '@/lib/store';

export default function LearningCenterPage() {
    const router = useRouter();
    const { currentRole, currentUser } = useSchoolStore();

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                Learning Center
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Assignments Module Card */}
                <div onClick={() => router.push('/learning/assignments')} className="cursor-pointer h-full">
                    <Card title="Assignments" className="hover:shadow-lg transition-all group h-full">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <p className="text-sm text-gray-500">Manage homework, create tasks, and track submissions.</p>
                            </div>
                            <Button variant="outline" className="w-full mt-2">Open Assignments</Button>
                        </div>
                    </Card>
                </div>

                {/* CBT Module Card */}
                <div onClick={() => router.push('/learning/cbt')} className="cursor-pointer h-full">
                    <Card title="CBT / Quizzes" className="hover:shadow-lg transition-all group h-full">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <MonitorPlay className="w-6 h-6" />
                                </div>
                                <p className="text-sm text-gray-500">Create computer-based tests, quizzes, and exams.</p>
                            </div>
                            <Button variant="outline" className="w-full mt-2">Open CBT</Button>
                        </div>
                    </Card>
                </div>

                {/* AI Lesson Planner - Staff Only */}
                {(currentRole === 'teacher' || currentRole === 'admin' || currentRole === 'super_admin') && (
                    <div onClick={() => router.push('/learning/lesson-planner')} className="cursor-pointer h-full">
                        <Card title="AI Lesson Planner" className="hover:shadow-lg transition-all group h-full border-amber-200">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 group-hover:from-amber-500 group-hover:to-orange-500 group-hover:text-white transition-all">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm text-gray-500">Generate structured lesson plans with AI assistance.</p>
                                </div>
                                <Button variant="outline" className="w-full mt-2 border-amber-300 text-amber-700 hover:bg-amber-50">Open Planner</Button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Predictive Insights - Staff Only */}
                {(currentRole === 'teacher' || currentRole === 'admin' || currentRole === 'super_admin') && (
                    <div onClick={() => router.push('/analytics/predictive')} className="cursor-pointer h-full">
                        <Card title="Predictive Insights" className="hover:shadow-lg transition-all group h-full border-violet-200">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 group-hover:from-violet-500 group-hover:to-purple-500 group-hover:text-white transition-all">
                                        <Target className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm text-gray-500">AI-powered early warning for at-risk students.</p>
                                </div>
                                <Button variant="outline" className="w-full mt-2 border-violet-300 text-violet-700 hover:bg-violet-50">View Insights</Button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Digital Library Placeholder */}
                <div className="cursor-not-allowed opacity-60 h-full">
                    <Card title="Digital Library" className="h-full">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <p className="text-sm text-gray-500">Coming Soon: Access books and resources.</p>
                            </div>
                            <Button variant="ghost" disabled className="w-full mt-2">Coming Soon</Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
