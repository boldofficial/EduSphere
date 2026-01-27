export default function GradingLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Tab Navigation Skeleton */}
            <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-10 w-28 bg-gray-200 rounded-md mx-1"></div>
                ))}
            </div>

            {/* Controls Row */}
            <div className="flex gap-4">
                <div className="h-10 w-40 bg-gray-200 rounded-md"></div>
                <div className="h-10 w-40 bg-gray-200 rounded-md"></div>
                <div className="h-10 w-32 bg-gray-200 rounded-md ml-auto"></div>
            </div>

            {/* Main Table Area */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="space-y-3">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex gap-4 items-center">
                            <div className="h-8 w-8 bg-gray-200 rounded"></div>
                            <div className="h-4 flex-1 bg-gray-100 rounded"></div>
                            <div className="h-4 w-16 bg-gray-200 rounded"></div>
                            <div className="h-4 w-16 bg-gray-200 rounded"></div>
                            <div className="h-4 w-16 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
