"use client";

import BottomNav from "@/components/BottomNav";
import ProtectedRoute from "@/components/ProtectedRoute";
import { User, ChefHat, Clock, Trophy, Settings, Trash2, LogOut, Loader2 } from "lucide-react";
import { recipeCache } from "@/lib/cache";
import { authService } from "@/lib/auth-supabase";
import { useState, useEffect } from "react";
import type { User as UserType } from "@/lib/auth-supabase";

export default function ProfilePage() {
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const [user, setUser] = useState<UserType | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);

                // Fetch user stats from API
                const response = await fetch('/api/user/stats');
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                // Silently fail
            } finally {
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

    const handleSignOut = () => {
        authService.signOut();
    };

    const displayStats = [
        { 
            label: "Recipes Explored", 
            value: stats?.metrics?.total_recipes_viewed || "0", 
            icon: ChefHat 
        },
        { 
            label: "Collections", 
            value: stats?.collectionCount || "0", 
            icon: Trophy 
        },
        { 
            label: "Completed", 
            value: stats?.metrics?.total_recipes_completed || "0", 
            icon: Clock 
        },
    ];

    return (
        <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-b from-background-light to-background-muted pb-24">
            {loading ? (
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 size={40} className="animate-spin text-primary" />
                </div>
            ) : (
            <main className="max-w-md mx-auto px-6 pt-12 space-y-8">
                
                {/* Header */}
                <div className="text-center space-y-4">
                    {user?.picture ? (
                        <img
                            src={user.picture}
                            alt={user.name}
                            className="w-24 h-24 rounded-full border-2 border-primary/20 mx-auto object-cover"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto">
                            <User size={40} className="text-primary" strokeWidth={2} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-text-dark break-words px-4">
                            {user?.name || "Chef Profile"}
                        </h1>
                        <p className="text-text-medium text-sm mt-1 break-words px-4">
                            {user?.email || "Your culinary journey"}
                        </p>
                        {user?.provider && (
                            <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                {user.provider === "google" ? "Google Account" : "Demo Account"}
                            </span>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {displayStats.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-white border border-border-gray/30 rounded-2xl p-4 text-center space-y-2"
                        >
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                <stat.icon size={18} className="text-primary" strokeWidth={2} />
                            </div>
                            <div>
                                <div className="text-xl font-bold text-primary">{stat.value}</div>
                                <div className="text-xs text-text-medium mt-1">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Settings Section */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-text-medium uppercase tracking-wide px-1">
                        Settings
                    </h2>
                    
                    <div className="bg-white border border-border-gray/30 rounded-2xl overflow-hidden">
                        <button className="w-full p-5 flex items-center gap-4 hover:bg-background-muted/50 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Settings size={20} className="text-primary" strokeWidth={2} />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="font-semibold text-text-dark">Preferences</div>
                                <div className="text-sm text-text-medium">Dietary & cooking preferences</div>
                            </div>
                        </button>

                        <div className="border-t border-border-gray/30" />

                        <button 
                            onClick={() => setShowClearConfirm(true)}
                            className="w-full p-5 flex items-center gap-4 hover:bg-background-muted/50 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                                <Trash2 size={20} className="text-error" strokeWidth={2} />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="font-semibold text-text-dark">Clear Cache</div>
                                <div className="text-sm text-text-medium">Remove saved recipes</div>
                            </div>
                        </button>

                        <div className="border-t border-border-gray/30" />

                        <button 
                            onClick={() => setShowSignOutConfirm(true)}
                            className="w-full p-5 flex items-center gap-4 hover:bg-background-muted/50 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                                <LogOut size={20} className="text-warning" strokeWidth={2} />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="font-semibold text-text-dark">Sign Out</div>
                                <div className="text-sm text-text-medium">Exit your account</div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* About Section */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-text-medium uppercase tracking-wide px-1">
                        About
                    </h2>
                    
                    <div className="bg-white border border-border-gray/30 rounded-2xl p-6 space-y-3">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <div className="w-1 h-6 bg-primary rounded-full" />
                            <h3 className="text-2xl font-bold text-primary">ChefQuest</h3>
                            <div className="w-1 h-6 bg-primary rounded-full" />
                        </div>
                        <p className="text-sm text-text-medium text-center leading-relaxed">
                            Your AI-powered culinary companion. Discover recipes, master techniques, 
                            and embark on delicious cooking quests.
                        </p>
                        <div className="text-center pt-2">
                            <span className="text-xs text-text-medium">Version 1.0.0</span>
                        </div>
                    </div>
                </div>

            </main>
            )}

            {/* Clear Cache Confirmation Modal */}
            {showClearConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] px-6">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto">
                                <Trash2 size={24} className="text-error" strokeWidth={2} />
                            </div>
                            <h3 className="text-lg font-bold text-text-dark">Clear Cache?</h3>
                            <p className="text-sm text-text-medium">
                                This will remove all saved recipes and you'll need to search again.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="flex-1 py-3 rounded-2xl border border-border-gray/30 font-semibold text-text-dark hover:bg-background-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClearCache}
                                className="flex-1 py-3 rounded-2xl bg-error text-white font-semibold hover:bg-error/90 transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sign Out Confirmation Modal */}
            {showSignOutConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] px-6">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
                                <LogOut size={24} className="text-warning" strokeWidth={2} />
                            </div>
                            <h3 className="text-lg font-bold text-text-dark">Sign Out?</h3>
                            <p className="text-sm text-text-medium">
                                You'll need to sign in again to access ChefQuest.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSignOutConfirm(false)}
                                className="flex-1 py-3 rounded-2xl border border-border-gray/30 font-semibold text-text-dark hover:bg-background-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="flex-1 py-3 rounded-2xl bg-warning text-white font-semibold hover:bg-warning/90 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
        </ProtectedRoute>
    );
}

