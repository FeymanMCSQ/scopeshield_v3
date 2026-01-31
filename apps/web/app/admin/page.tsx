
import { getCurrentUser } from '@/lib/auth';
import { adminRepo } from '@scopeshield/db';
import { redirect, notFound } from 'next/navigation';
import { Users, CreditCard, TrendingDown, DollarSign } from 'lucide-react';

// Helper for formatting
const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default async function AdminPage() {
    const user = await getCurrentUser();

    // AUTH GUARD:
    // Replace this email check with your actual admin email or process.env.ADMIN_EMAIL
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!user || !adminEmail || user.email !== adminEmail) {
        // Return 404 to hide existence of this page from snoopers
        notFound();
    }

    // Fetch Data
    const [stats, feedbackResult] = await Promise.all([
        adminRepo.getStats(),
        adminRepo.getFeedbackFeed()
    ]);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b border-emerald-100 shadow-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        🛡️ Admin Dashboard
                    </h1>
                    <span className="text-xs font-mono text-gray-400">admin-view</span>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Analytics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                    <StatCard
                        label="Total Users"
                        value={stats.totalUsers}
                        icon={<Users className="w-5 h-5 text-blue-600" />}
                        bg="bg-blue-50"
                    />
                    <StatCard
                        label="Active Subs"
                        value={stats.activeSubs}
                        icon={<CreditCard className="w-5 h-5 text-emerald-600" />}
                        bg="bg-emerald-50"
                    />
                    <StatCard
                        label="Gross Revenue"
                        value={fmt.format(stats.totalRevenueCents / 100)}
                        icon={<DollarSign className="w-5 h-5 text-amber-600" />}
                        bg="bg-amber-50"
                    />
                    <StatCard
                        label="Churned"
                        value={stats.churned}
                        icon={<TrendingDown className="w-5 h-5 text-red-600" />}
                        bg="bg-red-50"
                    />
                </div>

                {/* Feedback Feed */}
                <h2 className="text-lg font-bold text-gray-900 mb-6">Feedback / Complaints</h2>

                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    {feedbackResult.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">No feedback yet.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {feedbackResult.map((item) => (
                                <div key={item.id} className="p-6 hover:bg-gray-50 transition">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide mr-3 ${item.type === 'complaint' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {item.type}
                                            </span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {item.user.name || item.user.email}
                                            </span>
                                            <span className="text-xs text-gray-400 ml-2">
                                                ({item.user.email})
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed">
                                        {item.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, bg }: { label: string, value: string | number, icon: React.ReactNode, bg: string }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
            </div>
            <div className={`p-3 rounded-lg ${bg}`}>
                {icon}
            </div>
        </div>
    );
}
