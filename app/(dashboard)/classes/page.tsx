'use client';

import React from 'react';
import { useClasses, useTeachers, useCreateClass, useUpdateClass, useDeleteClass } from '@/lib/hooks/use-data';
import { CardSkeleton } from '@/components/ui/skeleton';
import { ClassesView } from '@/components/features/ClassesView';

export default function ClassesPage() {
    const { data: classes = [], isLoading: classesLoading } = useClasses();
    const { data: teachers = [] } = useTeachers();
    const createClassMutation = useCreateClass();
    const updateClassMutation = useUpdateClass();
    const deleteClassMutation = useDeleteClass();

    if (classesLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
                        <div className="h-4 w-64 bg-gray-100 animate-pulse rounded" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <CardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <ClassesView
            classes={classes}
            teachers={teachers}
            onUpdate={(cls) => updateClassMutation.mutate({ id: cls.id, updates: cls })}
            onCreate={async (cls) => { await createClassMutation.mutateAsync(cls); }}
            onDelete={async (id) => { await deleteClassMutation.mutateAsync(id); }}
        />
    );
}
