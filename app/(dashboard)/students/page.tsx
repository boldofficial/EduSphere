'use client';

import React from 'react';
import { usePaginatedStudents, useClasses, useCreateStudent, useUpdateStudent, useDeleteStudent, useScores } from '@/lib/hooks/use-data';
import { CardSkeleton } from '@/components/ui/skeleton';
import { StudentsView } from '@/components/features/StudentsView';
import { Pagination } from '@/components/ui/pagination';

export default function StudentsPage() {
    const [page, setPage] = React.useState(1);
    const [search, setSearch] = React.useState('');
    const [classId, setClassId] = React.useState('all');
    const pageSize = 20;

    const { data: studentResponse, isLoading: studentsLoading } = usePaginatedStudents(
        page,
        pageSize,
        search,
        classId === 'all' ? '' : classId
    );
    const { data: classes = [] } = useClasses();
    const { data: scores = [] } = useScores();

    const students = studentResponse?.results || [];
    const totalPages = studentResponse ? Math.ceil(studentResponse.count / pageSize) : 0;

    const createStudentMutation = useCreateStudent();
    const updateStudentMutation = useUpdateStudent();
    const deleteStudentMutation = useDeleteStudent();

    // Reset to page 1 when filters change
    const handleSearchChange = (s: string) => {
        setSearch(s);
        setPage(1);
    };

    const handleClassChange = (c: string) => {
        setClassId(c);
        setPage(1);
    };

    if (studentsLoading && !studentResponse) {
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
        <div className="space-y-4 pb-12">
            <StudentsView
                students={students}
                classes={classes}
                onAdd={(student) => createStudentMutation.mutateAsync(student)}
                onUpdate={(student, options) => updateStudentMutation.mutate(
                    { id: student.id, updates: student },
                    options
                )}
                onDelete={(id) => deleteStudentMutation.mutate(id)}
                onSearchChange={handleSearchChange}
                onFilterClassChange={handleClassChange}
                isLoading={studentsLoading}
                scores={scores}
            />

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                isLoading={studentsLoading}
            />
        </div>
    );
}
