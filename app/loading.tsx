export default function RootLoading() {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                <p className="text-gray-500 font-medium animate-pulse">Loading SchoolSync...</p>
            </div>
        </div>
    );
}
