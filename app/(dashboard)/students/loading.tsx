export default function StudentsLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <div className="h-6 w-32 bg-gray-200 rounded"></div>
                    <div className="h-4 w-48 bg-gray-100 rounded"></div>
                </div>
                <div className="h-10 w-32 bg-gray-200 rounded"></div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="h-10 w-48 bg-gray-200 rounded"></div>
                <div className="h-10 flex-1 bg-gray-100 rounded"></div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="h-12 bg-gray-50 border-b"></div>
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b">
                        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                            <div className="h-3 w-1/4 bg-gray-100 rounded"></div>
                        </div>
                        <div className="h-6 w-20 bg-gray-100 rounded"></div>
                        <div className="h-8 w-8 bg-gray-100 rounded"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
