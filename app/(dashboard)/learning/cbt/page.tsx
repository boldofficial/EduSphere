'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useQuizzes } from '@/lib/hooks/use-data';
import { CreateQuizModal } from '@/components/features/learning/LearningModals';
import { useRouter } from 'next/navigation';
import { useSchoolStore } from '@/lib/store';

export default function CBTPage() {
    const router = useRouter();
    const { currentRole, currentUser } = useSchoolStore();
    const isStudent = currentRole === 'student';
    const { data: quizzes = [], isLoading } = useQuizzes();

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
                    quizzes?.map((quiz: any) => (
                        <div
                            key={quiz.id}
                            onClick={() => router.push(`/learning/cbt/${quiz.id}`)}
                            className="cursor-pointer"
                        >
                            <Card title={quiz.title} className="hover:shadow-md transition-shadow">
                                <div className="text-sm text-gray-600 mb-2">
                                    <span className={`px-2 py-1 rounded-full text-xs ${quiz.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {quiz.is_published ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-400">
                                    Duration: {quiz.duration_minutes} mins | Start: {new Date(quiz.start_time).toLocaleDateString()}
                                </div>
                            </Card>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
