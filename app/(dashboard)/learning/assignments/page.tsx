'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, ClipboardCheck } from 'lucide-react';
import { useAssignments } from '@/lib/hooks/use-data';
import { CreateAssignmentModal } from '@/components/features/learning/LearningModals';
import { SubmissionGradingView } from '@/components/features/learning/SubmissionGradingView';
import { useSchoolStore } from '@/lib/store';

export default function AssignmentsPage() {
    const { currentRole, currentUser } = useSchoolStore();
    const isStudent = currentRole === 'student';
    const { data: assignments = [], isLoading } = useAssignments();
    const [gradingAssignment, setGradingAssignment] = useState<any | null>(null);

    if (gradingAssignment) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => setGradingAssignment(null)}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Assignments
                    </Button>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Grading: <span className="text-brand-600">{gradingAssignment.title}</span>
                    </h1>
                </div>

                <SubmissionGradingView
                    assignmentId={gradingAssignment.id}
                    assignmentTitle={gradingAssignment.title}
                    maxPoints={gradingAssignment.points}
                />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Assignments</h1>
                {!isStudent && (
                    <CreateAssignmentModal>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Assignment
                        </Button>
                    </CreateAssignmentModal>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div>Loading assignments...</div>
                ) : assignments?.length === 0 ? (
                    <Card className="text-center col-span-full">
                        <div className="p-8 text-gray-500">
                            {isStudent
                                ? "No assignments have been assigned to your class yet."
                                : "No assignments found. Create one to get started."}
                        </div>
                    </Card>
                ) : (
                    assignments?.map((assignment: any) => (
                        <Card key={assignment.id} className="hover:shadow-md transition-shadow flex flex-col h-full">
                            <div className="p-5 flex-1">
                                <h3 className="font-bold text-lg mb-2">{assignment.title}</h3>
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{assignment.description}</p>
                                <div className="text-xs text-gray-400 space-y-1">
                                    <div className="flex justify-between">
                                        <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                                        <span className="font-bold text-brand-600">{assignment.points} Points</span>
                                    </div>
                                    <div className="mt-2 pt-2 border-t">
                                        Subject: {assignment.subject_name || 'General'}
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 border-t rounded-b-xl flex gap-2">
                                {isStudent ? (
                                    <Button
                                        className="flex-1 text-xs gap-2"
                                        variant="outline"
                                    >
                                        View Details
                                    </Button>
                                ) : (
                                    <Button
                                        className="flex-1 text-xs gap-2"
                                        onClick={() => setGradingAssignment(assignment)}
                                    >
                                        <ClipboardCheck className="w-3 h-3" />
                                        Grade Submissions
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
