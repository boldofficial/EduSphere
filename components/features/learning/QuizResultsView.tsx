'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAttempts, useAIGradeQuizTheory } from '@/lib/hooks/use-learning';
import { Loader2, Sparkles, CheckCircle, User, Award, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '@/components/providers/toast-provider';
import * as Types from '@/lib/types';

interface QuizResultsViewProps {
    quizId: string;
}

export const QuizResultsView: React.FC<QuizResultsViewProps> = ({ quizId }) => {
    const { data: attempts = [], isLoading, refetch } = useAttempts(quizId);
    const aiGradeMutation = useAIGradeQuizTheory();
    const { addToast } = useToast();
    const [gradingAttemptId, setGradingAttemptId] = useState<string | null>(null);

    const handleAIGrade = async (attemptId: string) => {
        setGradingAttemptId(attemptId);
        try {
            await aiGradeMutation.mutateAsync(attemptId);
            addToast('AI graded all theory questions successfully!', 'success');
            refetch();
        } catch (e) {
            addToast('AI grading failed for this attempt', 'error');
        } finally {
            setGradingAttemptId(null);
        }
    };

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Quiz Attempts & Results</h3>
                <Badge variant="outline">{attempts.length} Total Attempts</Badge>
            </div>

            <div className="grid gap-4">
                {attempts.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed">
                        <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No attempts yet</h3>
                        <p className="text-gray-500">Students haven't started this quiz yet.</p>
                    </div>
                ) : (
                    attempts.map((attempt) => {
                        const hasTheory = attempt.answers.some(a => !a.is_graded); // Simple heuristic

                        return (
                            <Card key={attempt.id} className="p-5 hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                                            {attempt.student_name?.[0] || 'S'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{attempt.student_name || 'Student'}</h4>
                                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                                <Clock size={12} />
                                                Finished: {attempt.end_time ? new Date(attempt.end_time).toLocaleString() : 'In Progress'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Score</p>
                                            <div className="flex items-center gap-1 font-black text-xl text-brand-600">
                                                <Award size={20} />
                                                {attempt.total_score.toFixed(1)}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            {hasTheory && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-brand-500 text-brand-600 hover:bg-brand-50 gap-2"
                                                    onClick={() => handleAIGrade(attempt.id)}
                                                    disabled={gradingAttemptId === attempt.id}
                                                >
                                                    {gradingAttemptId === attempt.id ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <Sparkles className="w-3 h-3" />
                                                    )}
                                                    AI Grade Theory
                                                </Button>
                                            )}
                                            <Button size="sm" variant="secondary">View Details</Button>
                                        </div>
                                    </div>
                                </div>
                                {attempt.answers.some(a => a.score === 0 && !a.is_graded) && (
                                    <div className="mt-4 p-2 bg-yellow-50 rounded-lg flex items-center gap-2 text-[10px] text-yellow-700 font-medium">
                                        <AlertCircle size={14} />
                                        This attempt has ungraded theory questions.
                                    </div>
                                )}
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
};
