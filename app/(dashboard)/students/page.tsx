'use client';

import React from 'react';
import { useStudents, useClasses, useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/lib/hooks/use-data';
import { CardSkeleton } from '@/components/ui/skeleton';
import { StudentsView } from '@/components/features/StudentsView';

export default function StudentsPage() {
    const { data: students = [], isLoading: studentsLoading } = useStudents();
    const { data: classes = [] } = useClasses();
    const createStudentMutation = useCreateStudent();
    const updateStudentMutation = useUpdateStudent();
    const deleteStudentMutation = useDeleteStudent();

    if (studentsLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
                        <div className="h-4 w-64 bg-gray-100 animate-pulse rounded" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <CardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <StudentsView
            students={students}
            classes={classes}
            onAdd={(student) => createStudentMutation.mutateAsync(student)}
            onUpdate={(student, options) => updateStudentMutation.mutate(
                { id: student.id, updates: student },
                options
            )}
            onDelete={(id) => deleteStudentMutation.mutate(id)}
        />
    );
}
