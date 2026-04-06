'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useQuizzes } from '@/lib/hooks/use-data';
import { CreateQuizModal } from '@/components/features/learning/LearningModals';
import { useRouter } from 'next/navigation';
import { useSchoolStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export default function CBTPage() {
    const router = useRouter();
    const { currentRole, currentUser } = useSchoolStore();
    const isStudent = currentRole === 'student';
    const { data: quizzes = [], isLoading: quizzesLoading } = useQuizzes();
    
    // Fetch attempts for the student to show status
    const { data: attemptsData, isLoading: attemptsLoading } = useQuery({
        queryKey: ['my_quiz_attempts'],
        queryFn: async () => {
            const res = await apiClient.get('learning/attempts/');
            return res.data;
        },
        enabled: isStudent
    });

    const attempts = Array.isArray(attemptsData) ? attemptsData : (attemptsData?.results || []);
    const isLoading = quizzesLoading || (isStudent && attemptsLoading);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Computer Based Tests (CBT)</h1>
                {!isStudent && (
                    <CreateQuizModal>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Quiz
                        </Button>
                    </CreateQuizModal>
                )}
            </div>

            <div className="grid gap-4">
                {isLoading ? (
                    <div>Loading quizzes...</div>
                ) : quizzes?.length === 0 ? (
                    <Card className="text-center">
                        <div className="p-8 text-gray-500">
                            {isStudent
                                ? "No quizzes are available for your class at the moment."
                                : "No quizzes found. Create one to get started."}
                        </div>
                    </Card>
                ) : (
                    quizzes?.map((quiz: any) => {
                        const attempt = attempts.find((a: any) => a.quiz === quiz.id);
                        const isFinished = attempt?.submit_time;
                        const isViolated = attempt?.is_violated;

                        return (
                            <div
                                key={quiz.id}
                                onClick={() => !isFinished && router.push(`/learning/cbt/${quiz.id}`)}
                                className={isFinished ? "cursor-not-allowed opacity-75" : "cursor-pointer"}
                            >
                                <Card className={`hover:shadow-md transition-all group relative overflow-hidden ${isViolated ? 'border-red-200' : ''}`}>
                                    {isViolated && (
                                        <div className="absolute top-0 right-0 p-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-md z-10 animate-pulse">
                                            Security Violation
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-1">
                                        <h3 className="font-bold text-lg group-hover:text-brand-600 transition-colors uppercase tracking-tight">
                                            {quiz.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${quiz.is_published ? 'bg-green-100 text-green-700 font-black' : 'bg-yellow-100 text-yellow-700 font-black'}`}>
                                                {quiz.is_published ? 'Published' : 'Draft'}
                                            </span>
                                            {isFinished && (
                                                <span className={`${isViolated ? 'bg-red-100 text-red-700' : 'bg-brand-100 text-brand-700'} px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ml-2`}>
                                                    {isViolated ? 'Terminated' : 'Submitted'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                                            Duration: {quiz.duration_minutes} mins | Start: {new Date(quiz.start_time).toLocaleDateString()}
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
