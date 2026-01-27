'use client';
import { CardSkeleton } from '@/components/ui/skeleton';
import {
    useTeachers,
    useCreateTeacher,
    useUpdateTeacher,
    useDeleteTeacher
} from '@/lib/hooks/use-data';
import { TeachersView } from '@/components/features/TeachersView';
import * as Types from '@/lib/types';

export default function TeachersPage() {
    const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
    const { mutate: addTeacher } = useCreateTeacher();
    const { mutate: performUpdate } = useUpdateTeacher();
    const { mutate: deleteTeacher } = useDeleteTeacher();

    if (teachersLoading) {
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

    const updateTeacher = (params: { id: string, updates: Partial<Types.Teacher> }, options?: any) => {
        performUpdate(params, options);
    };

    const addTeacherHandler = (teacher: Types.Teacher, options?: any) => {
        addTeacher(teacher, options);
    };

    return <TeachersView
        teachers={teachers}
        onAdd={addTeacherHandler}
        onUpdate={updateTeacher}
        onDelete={deleteTeacher}
    />;
}
