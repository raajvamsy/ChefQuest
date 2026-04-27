"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { RecipeDetails } from "@/lib/gemini";
import { ArrowLeft, Clock, Users, ChefHat, Loader2, Play, AlertCircle, User } from "lucide-react";
import { recipeCache } from "@/lib/cache";
import { supabase } from "@/lib/supabase";

function RecipeDetailContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const language = searchParams.get("lang") || "en";

    const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const logViewedInteraction = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) return;
                await fetch('/api/recipes/interaction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                    body: JSON.stringify({ recipeId: id, interactionType: 'viewed', source: 'recipe_detail_page' }),
                });
            } catch { /* non-blocking */ }
        };

        const fetchRecipe = async () => {
            try {
                setLoading(true);
                setError("");
                const cached = recipeCache.getRecipeDetails(id);
                if (cached) {
                    setRecipe(cached);
                    await logViewedInteraction();
                    setLoading(false);
                    return;
                }
                const { data: { session } } = await supabase.auth.getSession();
                const response = await fetch(`/api/recipes/${id}?lang=${language}`, {
                    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
                });
                const data = await response.json();
                if (data.error) throw new Error(data.message || 'Failed to fetch recipe');
                setRecipe(data.recipe);
                await logViewedInteraction();
                recipeCache.setRecipeDetails(id, data.recipe);
            } catch {
                setError("Failed to load recipe. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchRecipe();
    }, [id, language]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background-muted flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative flex items-center justify-center w-14 h-14">
                        <Loader2 size={36} className="animate-spin text-primary absolute" strokeWidth={2} />
                        <ChefHat size={18} className="text-primary relative z-10" strokeWidth={2} />
                    </div>
                    <p className="text-sm text-text-medium">Loading recipe...</p>
                </div>
            </div>
        );
    }

    if (error || !recipe) {
        return (
            <div className="min-h-screen bg-background-muted flex items-center justify-center px-6">
                <div className="text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center mx-auto">
                        <AlertCircle size={28} className="text-error" strokeWidth={2} />
                    </div>
                    <p className="text-sm font-medium text-error">{error || "Recipe not found"}</p>
                    <button onClick={() => router.back()} className="text-sm text-primary font-medium hover:underline">Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-muted flex flex-col">

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white border-b border-border-gray/15">
                <div className="w-full px-4 h-14 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
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

                    <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-text-medium truncate block">{recipe.title}</span>
                    </div>

                    <button
                        onClick={() => router.push("/profile")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-gray/30 text-xs font-semibold text-text-medium hover:text-text-dark hover:border-border-gray/60 transition-colors shrink-0"
                    >
                        <User size={14} strokeWidth={2} />
                        <span className="hidden sm:inline">Profile</span>
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">

                {/* Hero card — full width */}
                <div className="bg-white rounded-2xl border border-border-gray/20 shadow-sm p-6 space-y-5">
                    <div className="space-y-3">
                        <h1 className="text-2xl font-bold text-text-dark leading-tight">{recipe.title}</h1>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5 text-sm text-text-medium">
                                <Clock size={14} className="text-primary shrink-0" strokeWidth={2} />
                                <span>{recipe.time}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-text-medium">
                                <Users size={14} className="text-primary shrink-0" strokeWidth={2} />
                                <span>{recipe.servings}</span>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-wide">
                                {recipe.difficulty}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push(`/recipes/${id}/prepare`)}
                        className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <Play size={16} strokeWidth={2.5} fill="white" />
                        Start Cooking
                    </button>
                </div>

                {/* 2-column layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 items-start">

                    {/* Left: About + Ingredients */}
                    <div className="space-y-4">
                        {recipe.description && (
                            <div className="bg-white rounded-2xl border border-border-gray/20 shadow-sm p-5 space-y-2">
                                <h2 className="text-[11px] font-semibold text-text-medium uppercase tracking-widest">About</h2>
                                <p className="text-sm text-text-dark leading-relaxed">{recipe.description}</p>
                            </div>
                        )}
                        <div className="bg-white rounded-2xl border border-border-gray/20 shadow-sm p-5 space-y-4">
                            <h2 className="text-base font-bold text-text-dark">Ingredients</h2>
                            <ul className="space-y-3">
                                {recipe.ingredients.map((ingredient, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                        <span className="text-sm text-text-dark">
                                            <span className="font-semibold">{ingredient.quantity}</span>
                                            <span className="text-text-medium"> {ingredient.item}</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right: Instructions */}
                    <div className="space-y-3">
                        <h2 className="text-base font-bold text-text-dark px-1">Instructions</h2>
                        {recipe.steps.map((step) => (
                            <div
                                key={step.step_number}
                                className="bg-white rounded-2xl border border-border-gray/20 shadow-sm p-5 flex gap-4 hover:border-primary/20 transition-colors"
                            >
                                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                    {step.step_number}
                                </div>
                                <p className="text-sm text-text-dark leading-relaxed flex-1">{step.instruction}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function RecipeDetailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background-muted flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative flex items-center justify-center w-14 h-14">
                        <Loader2 size={36} className="animate-spin text-primary absolute" strokeWidth={2} />
                        <ChefHat size={18} className="text-primary relative z-10" strokeWidth={2} />
                    </div>
                    <p className="text-sm text-text-medium">Loading recipe...</p>
                </div>
            </div>
        }>
            <RecipeDetailContent />
        </Suspense>
    );
}
