import { TableSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function BursaryLoading() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-4 w-80 opacity-60" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-24 rounded-xl" />
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
            </div>

            {/* Financial Stats Overlays */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 p-1 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                <TableSkeleton rows={10} />
            </div>
        </div>
    );
}
