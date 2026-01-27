export default function AnalyticsLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <div className="h-6 w-48 bg-gray-200 rounded"></div>
                    <div className="h-4 w-64 bg-gray-100 rounded"></div>
                </div>
                <div className="h-10 w-40 bg-gray-200 rounded"></div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="h-3 w-20 bg-gray-100 rounded"></div>
                                <div className="h-6 w-16 bg-gray-200 rounded"></div>
                            </div>
                            <div className="h-12 w-12 bg-gray-100 rounded-lg"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 w-28 bg-gray-200 rounded-md mx-1"></div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-4 border border-gray-100 h-80">
                    <div className="h-4 w-40 bg-gray-200 rounded mb-4"></div>
                    <div className="h-64 bg-gray-50 rounded-lg"></div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 h-80">
                    <div className="h-4 w-40 bg-gray-200 rounded mb-4"></div>
                    <div className="h-64 bg-gray-50 rounded-lg"></div>
                </div>
            </div>
        </div>
    );
}
