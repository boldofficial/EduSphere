'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAssignments } from '@/lib/hooks/use-data';
import { CreateAssignmentModal } from '@/components/features/learning/LearningModals';

export default function AssignmentsPage() {
    const { data: assignments = [], isLoading } = useAssignments();

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Assignments</h1>
                <CreateAssignmentModal>
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Assignment
                    </Button>
                </CreateAssignmentModal>
            </div>

            <div className="grid gap-4">
                {isLoading ? (
                    <div>Loading assignments...</div>
                ) : assignments?.length === 0 ? (
                    <Card className="text-center">
                        <div className="p-8 text-gray-500">
                            No assignments found. Create one to get started.
                        </div>
                    </Card>
                ) : (
                    assignments?.map((assignment: any) => (
                        <Card key={assignment.id} title={assignment.title} className="hover:shadow-md transition-shadow">
                            <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                            <div className="text-xs text-gray-400">
                                Due: {new Date(assignment.due_date).toLocaleDateString()} | Points: {assignment.points}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
