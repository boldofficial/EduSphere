'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Send, ShieldAlert } from 'lucide-react';
import { useQuestions, useLogViolation, useSubmitAttempt } from '@/lib/hooks/use-learning';
import { useToast } from '@/components/providers/toast-provider';
import * as Types from '@/lib/types';
import apiClient from '@/lib/api-client';

interface TakeQuizViewProps {
    quiz: Types.Quiz;
}

export function TakeQuizView({ quiz }: TakeQuizViewProps) {
    const { addToast } = useToast();
    const { data: questions = [], isLoading } = useQuestions(quiz.id.toString());
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(quiz.duration_minutes * 60);
    const [violationCount, setViolationCount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [attempt, setAttempt] = useState<any>(null);

    const logViolationMutation = useLogViolation();
    const submitMutation = useSubmitAttempt();

    // Start Attempt on Mount
    useEffect(() => {
        const startAttempt = async () => {
            try {
                const res = await apiClient.post(`learning/quizzes/${quiz.id}/start_attempt/`);
                setAttempt(res.data);
            } catch (err: any) {
                console.error("Failed to start attempt:", err);
                if (err.response?.data?.detail?.includes("already")) {
                   // Possible already started, try to fetch active attempt
                   const attemptsRes = await apiClient.get(`learning/attempts/?quiz_id=${quiz.id}`);
                   if (attemptsRes.data.length > 0) {
                       setAttempt(attemptsRes.data[0]);
                   }
                }
            }
        };
        startAttempt();
    }, [quiz.id]);

    const handleAutoSubmit = useCallback(async () => {
        if (isSubmitting || isCompleted) return;
        setIsSubmitting(true);
        try {
            const formattedAnswers = Object.entries(answers).map(([qId, val]) => {
                const q = questions.find(qu => qu.id.toString() === qId);
                return {
                    question_id: qId,
                    selected_option_id: q?.question_type === 'mcq' ? val : null,
                    text_answer: q?.question_type === 'theory' ? val : '',
                };
            });
            await submitMutation.mutateAsync({ quizId: quiz.id, answers: formattedAnswers });
            setIsCompleted(true);
            addToast("Exam submitted automatically due to security violation or timeout.", "warning");
        } catch (err) {
            addToast("Failed to auto-submit exam. Please contact your instructor.", "error");
        } finally {
            setIsSubmitting(false);
        }
    }, [answers, questions, quiz.id, submitMutation, addToast, isSubmitting, isCompleted]);

    // Timer logic
    useEffect(() => {
        if (timeLeft <= 0) {
            handleAutoSubmit();
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, handleAutoSubmit]);

    // TAB SWITCH DETECTION
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && !isCompleted && attempt) {
                const newCount = violationCount + 1;
                setViolationCount(newCount);
                
                logViolationMutation.mutate({ attemptId: attempt.id, count: newCount });

                if (newCount >= 3) { // Threshold
                    handleAutoSubmit();
                } else {
                    addToast(`Warning: Tab switch detected! Violation ${newCount}/3. Exam will auto-submit on 3rd violation.`, "error", 30000);
                }
            }
        };

        const handleBlur = () => {
            // Optional: Also detect when window loses focus (but not just tab switch)
            // handleVisibilityChange(); // Might be too aggressive
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, [violationCount, isCompleted, attempt, logViolationMutation, handleAutoSubmit, addToast]);

    const handleOptionSelect = (questionId: string, optionId: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const handleTextChange = (questionId: string, text: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: text }));
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading || !attempt) return <div className="p-12 text-center">Initializing Exam Session...</div>;

    const isAlreadySubmitted = !!attempt.submit_time || isCompleted;

    if (isAlreadySubmitted) {
        return (
            <Card className="max-w-2xl mx-auto p-12 text-center space-y-6">
                <div className={`w-20 h-20 ${attempt.is_violated ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} rounded-full flex items-center justify-center mx-auto`}>
                    {attempt.is_violated ? <ShieldAlert className="w-10 h-10" /> : <Send className="w-10 h-10" />}
                </div>
                <h2 className="text-3xl font-bold">{attempt.is_violated ? 'Exam Terminated' : 'Exam Submitted'}</h2>
                <p className="text-gray-500">
                    {attempt.is_violated 
                        ? 'This session was terminated due to security violations (tab switching). Your current progress has been recorded.'
                        : 'Your attempt has been recorded. You can view your results once the instructor releases them.'}
                </p>
                <Button onClick={() => window.location.href = '/learning/cbt'} className="w-full">Return to Dashboard</Button>
            </Card>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            {/* Header / HUD */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md p-4 rounded-xl border shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-lg py-1 px-3 font-mono bg-gray-50">
                        <Clock className="w-4 h-4 mr-2 text-brand-600" />
                        {formatTime(timeLeft)}
                    </Badge>
                    <div className="hidden md:block">
                        <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Progress</span>
                        <div className="w-32 h-2 bg-gray-100 rounded-full mt-1">
                            <div 
                                className="h-full bg-brand-500 rounded-full transition-all duration-500" 
                                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {violationCount > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                            <ShieldAlert className="w-3 h-3 mr-1" />
                            Violations: {violationCount}/3
                        </Badge>
                    )}
                    <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => {
                            if (confirm("Are you sure you want to submit your exam now?")) {
                                handleAutoSubmit();
                            }
                        }}
                    >
                        Submit Exam
                    </Button>
                </div>
            </div>

            {/* Question Card */}
            {currentQuestion && (
                <Card className="p-8 shadow-lg border-t-4 border-t-brand-500">
                    <div className="flex justify-between items-start mb-6">
                        <span className="text-sm font-bold text-brand-600 uppercase tracking-[0.2em]">
                            Question {currentQuestionIndex + 1} of {questions.length}
                        </span>
                        <Badge variant="secondary">{currentQuestion.points} Points</Badge>
                    </div>

                    <h2 className="text-xl md:text-2xl font-semibold mb-8 leading-relaxed">
                        {currentQuestion.text}
                    </h2>

                    <div className="space-y-3">
                        {currentQuestion.question_type === 'mcq' ? (
                            currentQuestion.options?.map((opt: any) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleOptionSelect(currentQuestion.id.toString(), opt.id.toString())}
                                    className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-center gap-4 group
                                        ${answers[currentQuestion.id.toString()] === opt.id.toString() 
                                            ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-200' 
                                            : 'border-gray-100 hover:border-brand-200 hover:bg-gray-50'}
                                    `}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                        ${answers[currentQuestion.id.toString()] === opt.id.toString() 
                                            ? 'border-brand-500' 
                                            : 'border-gray-300 group-hover:border-brand-400'}
                                    `}>
                                        {answers[currentQuestion.id.toString()] === opt.id.toString() && (
                                            <div className="w-3 h-3 bg-brand-500 rounded-full" />
                                        )}
                                    </div>
                                    <span className="font-medium">{opt.text}</span>
                                </button>
                            ))
                        ) : (
                            <textarea 
                                className="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all outline-none min-h-[200px]"
                                placeholder="Type your answer here..."
                                value={answers[currentQuestion.id.toString()] || ''}
                                onChange={(e) => handleTextChange(currentQuestion.id.toString(), e.target.value)}
                            />
                        )}
                    </div>
                </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center">
                <Button 
                    variant="outline" 
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                >
                    Previous Question
                </Button>
                
                <div className="space-x-2">
                    {currentQuestionIndex < questions.length - 1 ? (
                        <Button 
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        >
                            Next Question
                        </Button>
                    ) : (
                        <Button 
                            variant="primary"
                            onClick={() => {
                                if (confirm("Ready to submit?")) {
                                    handleAutoSubmit();
                                }
                            }}
                        >
                            Complete Exam
                        </Button>
                    )}
                </div>
            </div>

            {/* Warning Footer */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-3 text-amber-800 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>
                    <strong>Security Notice:</strong> This exam is monitored. Switching tabs, opening developer tools, or losing focus may result in automatic submission. Ensure a stable internet connection.
                </p>
            </div>
        </div>
    );
}
