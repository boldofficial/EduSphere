'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useQuestions } from '@/lib/hooks/use-data';
import { CreateQuestionModal } from '@/components/features/learning/LearningModals';
import { Badge } from '@/components/ui/badge';
import { QuizResultsView } from '@/components/features/learning/QuizResultsView';

export default function QuizEditorPage() {
    const params = useParams();
    const router = useRouter();
    const quizId = params.id as string;
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'questions' | 'results'>('questions');

    // Fetch quiz details
    const { data: quiz, isLoading: quizLoading } = useQuery({
        queryKey: ['quiz', quizId],
        queryFn: async () => {
            const res = await apiClient.get(`/learning/quizzes/${quizId}/`);
            return res.data;
        }
    });

    // Fetch questions specifically for this quiz
    const { data: questions = [], isLoading: questionsLoading } = useQuestions(quizId);

    const deleteMutation = useMutation({
        mutationFn: async (questionId: string) => {
            await apiClient.delete(`/learning/questions/${questionId}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions', quizId] });
        }
    });

    if (quizLoading) return <div className="p-8">Loading Quiz...</div>;
    if (!quiz) return <div className="p-8">Quiz not found</div>;

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{quiz.title}</h1>
                    <p className="text-gray-500 text-sm">{quiz.description}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Badge variant="outline">{quiz.duration_minutes} Mins</Badge>
                    <Badge variant={quiz.is_published ? "success" : "secondary"}>
                        {quiz.is_published ? "Published" : "Draft"}
                    </Badge>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
                <button
                    onClick={() => setActiveTab('questions')}
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'questions' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    Questions
                </button>
                <button
                    onClick={() => setActiveTab('results')}
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'results' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    Results & Grading
                </button>
            </div>

            {activeTab === 'results' ? (
                <QuizResultsView quizId={quizId} />
            ) : (
                <>
                    <div className="flex justify-between items-center border-b pb-4">
                        <h2 className="text-xl font-semibold">Questions ({questions?.length || 0})</h2>
                        <CreateQuestionModal quizId={quizId}>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Question
                            </Button>
                        </CreateQuestionModal>
                    </div>

                    <div className="space-y-4">
                        {questionsLoading ? (
                            <div>Loading questions...</div>
                        ) : questions?.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                                No questions added yet. Click "Add Question" to start.
                            </div>
                        ) : (
                            questions?.map((q: any, i: number) => (
                                <Card key={q.id} className="relative group">
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this question?')) {
                                                    deleteMutation.mutate(q.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600 font-mono text-sm">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <p className="font-medium text-lg leading-tight">{q.text}</p>

                                            {q.question_type === 'mcq' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                                    {q.options?.map((opt: any) => (
                                                        <div
                                                            key={opt.id}
                                                            className={`p-3 rounded-md border text-sm flex items-center gap-2
                                                                ${opt.is_correct ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white border-gray-200'}
                                                            `}
                                                        >
                                                            <div className={`w-3 h-3 rounded-full border ${opt.is_correct ? 'bg-green-500 border-green-500' : 'border-gray-300'}`} />
                                                            {opt.text}
                                                            {opt.is_correct && <span className="ml-auto text-xs font-bold uppercase tracking-wider text-green-600">Correct</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex gap-4 text-xs text-gray-400 mt-2">
                                                <span className="uppercase tracking-wider font-semibold">Type: {q.question_type === 'mcq' ? 'Multiple Choice' : 'Essay'}</span>
                                                <span className="uppercase tracking-wider font-semibold">Points: {q.points}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
