import { TableSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function StaffLoading() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-4 w-72 opacity-60" />
                </div>
                <Skeleton className="h-11 w-40 rounded-xl" />
            </div>

            <div className="bg-white dark:bg-gray-800 p-1 border border-gray-100 dark:border-gray-800 rounded-2xl">
                <TableSkeleton rows={8} />
            </div>
        </div>
    );
}
