import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export async function Navbar() {
    const user = await getCurrentUser();
    const isSubscribed = user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing';

    return (
        <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-emerald-100 sticky top-0 z-50">
            <div className="text-xl font-bold text-emerald-950 tracking-tight">
                <Link href="/">scopeshield</Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <SignedIn>
                    {!isSubscribed && (
                        <Link
                            href="/pricing"
                            className="px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                        >
                            Pricing
                        </Link>
                    )}
                    <Link
                        href="/dashboard/new"
                        className="px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                        Create Ticket
                    </Link>
                    <Link
                        href="/dashboard"
                        className="px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                        Dashboard
                    </Link>
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: "w-9 h-9 border border-emerald-200",
                            },
                        }}
                        afterSignOutUrl="/"
                    />
                </SignedIn>

                <SignedOut>
                    <Link
                        href="/pricing"
                        className="px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                        Pricing
                    </Link>
                    <Link
                        href="/sign-in"
                        className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
                    >
                        Sign In
                    </Link>
                </SignedOut>
            </div>
        </nav>
    );
}
