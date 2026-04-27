"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { User, ChefHat, Clock, Trophy, Settings, Trash2, LogOut, Loader2, ArrowLeft } from "lucide-react";
import { recipeCache } from "@/lib/cache";
import { authService } from "@/lib/auth-supabase";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User as UserType } from "@/lib/auth-supabase";

export default function ProfilePage() {
    const router = useRouter();
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [user, setUser] = useState<UserType | null>(null);
    const [stats, setStats] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);
                const { data: { session } } = await supabase.auth.getSession();
                const response = await fetch('/api/user/stats', {
                    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
                });
                if (response.ok) setStats(await response.json());
            } catch { /* silent */ } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleClearCache = () => {
        recipeCache.clearAll();
        setShowClearConfirm(false);
        window.location.reload();
    };

    const handleSignOut = () => authService.signOut();

    const handleDeleteAccount = async () => {
        try {
            setDeletingAccount(true);
            setActionError(null);
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/user/account", {
                method: "DELETE",
                headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error((payload as { message?: string })?.message || "Failed to delete account.");
            recipeCache.clearAll();
            await supabase.auth.signOut();
            window.location.href = "/login";
        } catch (error) {
            setActionError(error instanceof Error ? error.message : "Failed to delete account.");
        } finally {
            setDeletingAccount(false);
            setShowDeleteAccountConfirm(false);
        }
    };

    const statsData = [
        { label: "Recipes Explored", value: (stats as { metrics?: { total_recipes_viewed?: number } })?.metrics?.total_recipes_viewed ?? 0, icon: ChefHat, onClick: () => router.push("/profile/history") },
        { label: "Collections", value: (stats as { collectionCount?: number })?.collectionCount ?? 0, icon: Trophy, onClick: undefined },
        { label: "Completed", value: (stats as { metrics?: { total_recipes_completed?: number } })?.metrics?.total_recipes_completed ?? 0, icon: Clock, onClick: undefined },
    ];

    const settingsItems = [
        { label: "Preferences", description: "Dietary & cooking preferences", icon: Settings, iconBg: "bg-primary/10", iconColor: "text-primary", onClick: undefined },
        { label: "Clear Cache", description: "Remove saved recipes", icon: Trash2, iconBg: "bg-error/10", iconColor: "text-error", onClick: () => setShowClearConfirm(true) },
        { label: "Sign Out", description: "Exit your account", icon: LogOut, iconBg: "bg-warning/10", iconColor: "text-warning", onClick: () => setShowSignOutConfirm(true) },
        { label: "Delete Account", description: "Permanently remove account and all your data", icon: Trash2, iconBg: "bg-error/10", iconColor: "text-error", labelColor: "text-error", onClick: () => setShowDeleteAccountConfirm(true) },
    ];

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background-muted flex flex-col">

                {/* Header */}
                <header className="sticky top-0 z-40 bg-white border-b border-border-gray/15">
                    <div className="w-full px-4 h-14 flex items-center gap-3">
                        <button
                            onClick={() => router.push("/home")}
                            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-background-muted text-text-dark transition-colors shrink-0"
                        >
                            <ArrowLeft size={18} strokeWidth={2} />
                        </button>
                        <button
                            onClick={() => router.push("/home")}
                            className="text-lg font-bold text-primary tracking-tight shrink-0"
                        >
                            ChefQuest
                        </button>
                        <div className="flex-1" />
                    </div>
                </header>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 size={36} className="animate-spin text-primary" strokeWidth={2} />
                    </div>
                ) : (
                    <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

                            {/* Left column: Profile card */}
                            <div className="bg-white rounded-2xl border border-border-gray/20 shadow-sm p-8 flex flex-col items-center gap-4 text-center">
                                {user?.picture ? (
                                    <img src={user.picture} alt={user.name} className="w-24 h-24 rounded-full border-2 border-primary/20 object-cover" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                                        <User size={40} className="text-primary" strokeWidth={2} />
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <h1 className="text-xl font-bold text-text-dark">{user?.name || "Chef Profile"}</h1>
                                    <p className="text-sm text-text-medium">{user?.email || "Your culinary journey"}</p>
                                    {user?.provider && (
                                        <span className="inline-block mt-1 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                                            {user.provider === "google" ? "Google Account" : "Demo Account"}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Right column: Stats + Settings + About */}
                            <div className="space-y-4">

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3">
                                    {statsData.map((stat) => (
                                        <button
                                            key={stat.label}
                                            onClick={stat.onClick}
                                            className={`bg-white rounded-2xl border border-border-gray/20 shadow-sm p-4 flex flex-col items-center gap-2 transition-colors ${stat.onClick ? "hover:border-primary/30 hover:bg-primary/5 cursor-pointer" : "cursor-default"}`}
                                        >
                                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                                <stat.icon size={16} className="text-primary" strokeWidth={2} />
                                            </div>
                                            <div className="text-2xl font-bold text-primary tabular-nums">{stat.value}</div>
                                            <div className="text-[11px] text-text-medium leading-tight text-center">{stat.label}</div>
                                        </button>
                                    ))}
                                </div>

                                {/* Settings */}
                                <div className="space-y-2">
                                    <p className="text-[11px] font-semibold text-text-medium uppercase tracking-widest px-1">Settings</p>
                                    <div className="bg-white rounded-2xl border border-border-gray/20 shadow-sm overflow-hidden divide-y divide-border-gray/15">
                                        {settingsItems.map((item) => (
                                            <button
                                                key={item.label}
                                                onClick={item.onClick}
                                                disabled={!item.onClick}
                                                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-background-muted/60 disabled:hover:bg-transparent transition-colors"
                                            >
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${item.iconBg}`}>
                                                    <item.icon size={17} className={item.iconColor} strokeWidth={2} />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className={`text-sm font-semibold ${(item as { labelColor?: string }).labelColor || "text-text-dark"}`}>{item.label}</div>
                                                    <div className="text-xs text-text-medium mt-0.5">{item.description}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* About */}
                                <div className="space-y-2">
                                    <p className="text-[11px] font-semibold text-text-medium uppercase tracking-widest px-1">About</p>
                                    <div className="bg-white rounded-2xl border border-border-gray/20 shadow-sm p-5 text-center space-y-2">
                                        <p className="text-lg font-bold text-primary">ChefQuest</p>
                                        <p className="text-sm text-text-medium leading-relaxed">
                                            Your AI-powered culinary companion. Discover recipes, master techniques, and embark on delicious cooking quests.
                                        </p>
                                        <p className="text-xs text-text-medium pt-1">Version 1.0.0</p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </main>
                )}

                {/* Modals */}
                {showClearConfirm && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] px-6">
                        <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-xl">
                            <div className="text-center space-y-2">
                                <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto">
                                    <Trash2 size={22} className="text-error" strokeWidth={2} />
                                </div>
                                <h3 className="text-base font-bold text-text-dark">Clear Cache?</h3>
                                <p className="text-sm text-text-medium">This will remove all saved recipes and you&apos;ll need to search again.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-border-gray/30 text-sm font-semibold text-text-dark hover:bg-background-muted transition-colors">Cancel</button>
                                <button onClick={handleClearCache} className="flex-1 py-2.5 rounded-xl bg-error text-white text-sm font-semibold hover:bg-error/90 transition-colors">Clear</button>
                            </div>
                        </div>
                    </div>
                )}

                {showDeleteAccountConfirm && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] px-6">
                        <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-xl">
                            <div className="text-center space-y-2">
                                <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto">
                                    <Trash2 size={22} className="text-error" strokeWidth={2} />
                                </div>
                                <h3 className="text-base font-bold text-text-dark">Delete Account?</h3>
                                <p className="text-sm text-text-medium">This is permanent and cannot be undone. Your profile, sessions, collections, and all data will be removed.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowDeleteAccountConfirm(false)} disabled={deletingAccount} className="flex-1 py-2.5 rounded-xl border border-border-gray/30 text-sm font-semibold text-text-dark hover:bg-background-muted transition-colors disabled:opacity-50">Cancel</button>
                                <button onClick={handleDeleteAccount} disabled={deletingAccount} className="flex-1 py-2.5 rounded-xl bg-error text-white text-sm font-semibold hover:bg-error/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2">
                                    {deletingAccount ? <><Loader2 size={14} className="animate-spin" />Deleting...</> : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showSignOutConfirm && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] px-6">
                        <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-xl">
                            <div className="text-center space-y-2">
                                <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
                                    <LogOut size={22} className="text-warning" strokeWidth={2} />
                                </div>
                                <h3 className="text-base font-bold text-text-dark">Sign Out?</h3>
                                <p className="text-sm text-text-medium">You&apos;ll need to sign in again to access ChefQuest.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowSignOutConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-border-gray/30 text-sm font-semibold text-text-dark hover:bg-background-muted transition-colors">Cancel</button>
                                <button onClick={handleSignOut} className="flex-1 py-2.5 rounded-xl bg-warning text-white text-sm font-semibold hover:bg-warning/90 transition-colors">Sign Out</button>
                            </div>
                        </div>
                    </div>
                )}

                {actionError && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[210] px-4 py-3 bg-error text-white text-sm rounded-xl shadow-lg max-w-sm text-center">
                        {actionError}
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
