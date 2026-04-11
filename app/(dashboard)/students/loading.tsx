import { Skeleton, TableSkeleton } from '@/components/ui/skeleton';

export default function StudentsLoading() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Module Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-4 w-80 opacity-60" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-32 rounded-xl" />
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
            </div>

            {/* Top Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-5">
                        <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-7 w-12" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Search/Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Skeleton className="h-11 flex-1 rounded-xl" />
                <Skeleton className="h-11 w-40 rounded-xl" />
                <Skeleton className="h-11 w-40 rounded-xl" />
            </div>

            {/* Table Area */}
            <TableSkeleton rows={10} />
        </div>
    );
}
