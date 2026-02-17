'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubmissions, useUpdateSubmission, useAIEvaluateSubmission } from '@/lib/hooks/use-learning';
import { Loader2, Sparkles, CheckCircle, Clock, User, FileText } from 'lucide-react';
import { useToast } from '@/components/providers/toast-provider';
import * as Types from '@/lib/types';

interface SubmissionGradingViewProps {
    assignmentId: string;
    assignmentTitle: string;
    maxPoints: number;
}

export const SubmissionGradingView: React.FC<SubmissionGradingViewProps> = ({
    assignmentId,
    assignmentTitle,
    maxPoints
}) => {
    const { data: submissions = [], isLoading } = useSubmissions(assignmentId);
    const updateMutation = useUpdateSubmission();
    const aiEvaluateMutation = useAIEvaluateSubmission();
    const { addToast } = useToast();

    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
    const [score, setScore] = useState<string>('');
    const [feedback, setFeedback] = useState<string>('');

    const selectedSubmission = submissions.find(s => s.id === selectedSubmissionId);

    const handleSelect = (s: Types.Submission) => {
        setSelectedSubmissionId(s.id);
        setScore(s.score?.toString() || '');
        setFeedback(s.teacher_feedback || '');
    };

    const handleAIEvaluate = async () => {
        if (!selectedSubmissionId) return;

        try {
            const res = await aiEvaluateMutation.mutateAsync(selectedSubmissionId);
            if (res.suggestion) {
                setScore(res.suggestion.score.toString());
                setFeedback(res.suggestion.feedback);
                addToast('AI evaluation generated!', 'success');
            }
        } catch (e) {
            addToast('AI evaluation failed', 'error');
        }
    };

    const handleSave = async () => {
        if (!selectedSubmissionId) return;

        try {
            await updateMutation.mutateAsync({
                id: selectedSubmissionId,
                data: {
                    score: parseFloat(score),
                    teacher_feedback: feedback,
                    is_graded: true
                }
            });
            addToast('Grade saved successfully', 'success');
        } catch (e) {
            addToast('Failed to save grade', 'error');
        }
    };

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-600" /></div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* Sidebar: Submission List */}
            <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-bold text-gray-900">Submissions</h3>
                    <p className="text-xs text-gray-500">{submissions.length} total students</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {submissions.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No submissions yet</div>
                    ) : (
                        submissions.map(s => (
                            <div
                                key={s.id}
                                onClick={() => handleSelect(s)}
                                className={`p-4 border-b cursor-pointer transition-colors hover:bg-gray-50 ${selectedSubmissionId === s.id ? 'bg-brand-50 border-l-4 border-l-brand-500' : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                            {s.student_name?.[0] || 'S'}
                                        </div>
                                        <span className="font-medium text-sm text-gray-900">{s.student_name || 'Student'}</span>
                                    </div>
                                    <Badge variant={s.is_graded ? "success" : "secondary"} className="text-[10px]">
                                        {s.is_graded ? "Graded" : "Pending"}
                                    </Badge>
                                </div>
                                <div className="mt-2 flex items-center text-[10px] text-gray-400 gap-2">
                                    <Clock size={10} />
                                    {new Date(s.submitted_at).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content: Grading Panel */}
            <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2">
                {selectedSubmission ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        {/* Student Answer */}
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">Student Submission</h3>
                                {selectedSubmission.file_url && (
                                    <Button variant="outline" size="sm" onClick={() => window.open(selectedSubmission.file_url)}>
                                        <FileText className="w-4 h-4 mr-2" />
                                        View Attachment
                                    </Button>
                                )}
                            </div>
                            <div className="bg-gray-50 rounded-lg p-5 border border-gray-100 min-h-[150px] whitespace-pre-wrap text-gray-800 leading-relaxed">
                                {selectedSubmission.submission_text || "No text provided (check attachment)."}
                            </div>
                        </Card>

                        {/* Grading Section */}
                        <Card className="p-6 border-brand-100 bg-brand-50/20">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="text-brand-600 w-5 h-5" />
                                    <h3 className="font-bold text-lg text-gray-900">Grading & Feedback</h3>
                                </div>
                                <Button
                                    onClick={handleAIEvaluate}
                                    disabled={aiEvaluateMutation.isPending}
                                    variant="outline"
                                    className="border-brand-500 text-brand-600 hover:bg-brand-50 gap-2"
                                >
                                    {aiEvaluateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Auto-Grade with AI
                                </Button>
                            </div>

                            <div className="grid grid-cols-4 gap-6">
                                <div className="col-span-1 space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Score</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={score}
                                            onChange={e => setScore(e.target.value)}
                                            className="w-full p-2.5 border rounded-lg bg-white font-bold text-center text-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                            placeholder="0"
                                        />
                                        <span className="text-gray-400 font-medium">/ {maxPoints}</span>
                                    </div>
                                </div>
                                <div className="col-span-3 space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Teacher Feedback</label>
                                    <textarea
                                        value={feedback}
                                        onChange={e => setFeedback(e.target.value)}
                                        className="w-full p-3 border rounded-lg bg-white min-h-[100px] focus:ring-2 focus:ring-brand-500 outline-none"
                                        placeholder="Enter feedback for the student..."
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-brand-100">
                                <Button variant="ghost" onClick={() => setSelectedSubmissionId(null)}>Cancel</Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={updateMutation.isPending || !score}
                                    className="bg-brand-900 hover:bg-black text-white px-8"
                                >
                                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    Save & Finalize Grade
                                </Button>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 border-2 border-dashed rounded-2xl p-12">
                        <FileText className="w-16 h-16 mb-4 opacity-20" />
                        <h3 className="font-bold text-lg">Select a submission to grade</h3>
                        <p className="text-sm">Click a student on the left to review their work.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
