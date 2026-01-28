export default function DashboardLoading() {
    return (
        <main className="min-h-screen bg-gray-50/50 pb-20">
            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <div className="h-8 w-48 bg-emerald-100/50 rounded-lg animate-pulse mb-2" />
                        <div className="h-4 w-64 bg-emerald-100/30 rounded-lg animate-pulse" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-32 bg-emerald-100/50 rounded-xl animate-pulse" />
                    </div>
                </div>

                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-4 w-24 bg-emerald-50 rounded animate-pulse" />
                                <div className="h-9 w-9 bg-emerald-50 rounded-lg animate-pulse" />
                            </div>
                            <div className="h-8 w-32 bg-emerald-100/50 rounded animate-pulse mb-1" />
                            <div className="h-4 w-40 bg-emerald-50 rounded animate-pulse" />
                        </div>
                    ))}
                </div>

                {/* Filter Bar Skeleton */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 bg-emerald-50 rounded-lg animate-pulse" />
                    <div className="h-9 w-20 bg-emerald-100/50 rounded-lg animate-pulse" />
                    <div className="h-9 w-20 bg-white border border-emerald-100 rounded-lg animate-pulse" />
                    <div className="h-9 w-20 bg-white border border-emerald-100 rounded-lg animate-pulse" />
                </div>

                {/* Ticket List Skeleton */}
                <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="border-b border-emerald-100/50 bg-emerald-50/30 px-6 py-4">
                        <div className="flex gap-4">
                            <div className="h-4 w-16 bg-emerald-100/30 rounded animate-pulse" />
                            <div className="h-4 w-16 bg-emerald-100/30 rounded animate-pulse" />
                            <div className="h-4 w-16 bg-emerald-100/30 rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="divide-y divide-emerald-100/50">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-6 flex-1">
                                    <div className="h-6 w-20 bg-emerald-50 rounded-full animate-pulse" />
                                    <div className="h-5 w-24 bg-emerald-50 rounded animate-pulse" />
                                    <div className="h-4 w-32 bg-emerald-50 rounded animate-pulse" />
                                </div>
                                <div className="h-5 w-16 bg-emerald-50 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
