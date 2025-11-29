"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth-supabase";
import { ChefHat, Sparkles, Zap, Camera, Brain } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check if already logged in
        const checkAuth = async () => {
            try {
                const isAuth = await authService.isAuthenticated();
                if (isAuth) {
            router.push("/");
                }
            } catch (err) {
                // Continue to login page even if check fails
            } finally {
                setCheckingAuth(false);
            }
        };

        checkAuth();
    }, [router]);

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            setError(null);
            const { error } = await authService.signInWithGoogle();
            if (error) {
                setError(error.message);
            }
        } catch (err) {
            setError("Failed to sign in with Google");
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async () => {
        try {
            setLoading(true);
            setError(null);
            await authService.demoLogin();
            router.push("/");
        } catch (err) {
            setError("Failed to create demo account");
        } finally {
            setLoading(false);
        }
    };

    // Remove old Google Sign-In script loading
    /*useEffect(() => {
        // Old Google Sign-In implementation removed

    }, [router]); */

    // Show loading spinner while checking auth
    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background-light to-background-muted flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
                    <p className="text-text-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background-light to-background-muted flex items-center justify-center px-6">
            <div className="w-full max-w-md space-y-8">
                {/* Logo & Header */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <ChefHat size={32} className="text-primary" strokeWidth={2} />
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-1 h-10 bg-primary rounded-full" />
                        <h1 className="text-4xl font-bold text-primary tracking-tight">ChefQuest</h1>
                        <div className="w-1 h-10 bg-primary rounded-full" />
                    </div>
                    
                    <p className="text-text-medium text-lg">
                        Your AI-powered culinary companion
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white border border-border-gray/30 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-text-dark">Welcome</h2>
                        <p className="text-text-medium text-sm">
                            Sign in to start your cooking journey
                        </p>
                    </div>

                    {/* Google Sign-In Button */}
                    <div className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                {error}
                            </div>
                        )}
                        
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full py-4 bg-white border-2 border-border-gray/30 text-text-dark rounded-2xl font-semibold hover:border-primary/50 transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span>Continue with Google</span>
                        </button>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border-gray/30"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-text-medium">OR</span>
                            </div>
                        </div>

                        {/* Demo Login Button */}
                        <button
                            onClick={handleDemoLogin}
                            disabled={loading}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-semibold hover:bg-primary-dark transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} strokeWidth={2} />
                                    <span>Continue as Demo User</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Brain size={24} className="text-primary" strokeWidth={2} />
                        </div>
                        <p className="text-xs text-text-medium font-medium">AI Recipes</p>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Camera size={24} className="text-primary" strokeWidth={2} />
                        </div>
                        <p className="text-xs text-text-medium font-medium">Visual Validation</p>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Zap size={24} className="text-primary" strokeWidth={2} />
                        </div>
                        <p className="text-xs text-text-medium font-medium">Smart Guidance</p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-text-medium">
                    By signing in, you agree to our{" "}
                    <a href="/terms" className="text-primary hover:underline">
                        Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                    </a>
                </p>
            </div>
        </div>
    );
}

