"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { geminiAgent, RecipeDetails } from "@/lib/gemini";
import { ArrowLeft, Clock, Users, ChefHat, Loader2, Play, AlertCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { recipeCache } from "@/lib/cache";

export default function RecipeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchRecipe = async () => {
            try {
                setLoading(true);
                setError("");
                
                // Check cache first
                const cached = recipeCache.getRecipeDetails(id);
                if (cached) {
                    setRecipe(cached);
                    setLoading(false);
                    return;
                }

                // Fetch from API if not cached
                // For now, we'll use the ID as the title since we don't have a way to pass the title
                // In a real app, you'd store recipes or pass the title via query params
                const details = await geminiAgent.getRecipeDetails(id, decodeURIComponent(id));
                setRecipe(details);
                
                // Cache the details
                recipeCache.setRecipeDetails(id, details);
            } catch (err) {
                setError("Failed to load recipe. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchRecipe();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background-light to-background-muted flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative flex items-center justify-center w-16 h-16">
                        <Loader2 size={40} className="animate-spin text-primary absolute" strokeWidth={2.5} />
                        <ChefHat size={20} className="text-primary relative z-10" strokeWidth={2} />
                    </div>
                    <p className="text-text-medium">Loading recipe...</p>
                </div>
            </div>
        );
    }

    if (error || !recipe) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background-light to-background-muted flex items-center justify-center px-6">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto">
                        <AlertCircle size={32} className="text-error" strokeWidth={2} />
                    </div>
                    <div className="space-y-2">
                        <p className="text-error font-medium">{error || "Recipe not found"}</p>
                        <button
                            onClick={() => router.back()}
                            className="text-primary font-medium hover:underline text-sm"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background-light to-background-muted pb-24">
            {/* Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-border-gray/30 z-10 shadow-sm">
                <div className="max-w-2xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-full hover:bg-background-muted/50 text-text-dark transition-all active:scale-95 flex-shrink-0"
                        >
                            <ArrowLeft size={20} strokeWidth={2} />
                        </button>
                        <h1 className="text-base font-semibold text-primary text-wrap min-w-0 flex-1">{recipe.title}</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
                {/* Hero Image */}
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-border-gray/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background-muted relative group">
                    {recipe.image_prompt ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background-muted">
                            <div className="text-center p-6 text-primary/40">
                                <ChefHat size={48} className="mx-auto mb-2" strokeWidth={1.5} />
                                <p className="text-sm font-medium">{recipe.title}</p>
                                <p className="text-xs mt-2 text-text-medium/60 max-w-xs">
                                    {recipe.image_prompt.slice(0, 100)}...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ChefHat size={48} className="text-primary/40" strokeWidth={1.5} />
                        </div>
                    )}
                </div>

                {/* Title and Metadata */}
                <div className="space-y-4">
                    <div>
                        <h2 className="text-3xl font-bold text-text-dark mb-3 break-words">{recipe.title}</h2>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5 text-text-medium">
                                <Clock size={16} className="text-primary" strokeWidth={2} />
                                <span>{recipe.time}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-text-medium">
                                <Users size={16} className="text-primary" strokeWidth={2} />
                                <span>{recipe.servings}</span>
                            </div>
                            <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide">
                                {recipe.difficulty}
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => router.push(`/recipes/${id}/prepare`)}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-semibold hover:bg-primary-dark transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <Play size={18} strokeWidth={2.5} fill="white" />
                        Start Cooking
                    </button>
                </div>

                {/* Description */}
                {recipe.description && (
                    <div className="bg-white border border-border-gray/30 rounded-2xl p-6 space-y-2">
                        <h3 className="text-sm font-semibold text-text-medium uppercase tracking-wide">About</h3>
                        <p className="text-text-dark leading-relaxed">{recipe.description}</p>
                    </div>
                )}

                {/* Ingredients */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-text-dark">Ingredients</h3>
                    <div className="bg-white border border-border-gray/30 rounded-2xl p-6">
                        <ul className="space-y-3.5">
                            {recipe.ingredients.map((ingredient, index) => (
                                <li key={index} className="flex items-start gap-3 group">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0 group-hover:scale-150 transition-transform" />
                                    <div className="flex-1">
                                        <span className="text-text-dark font-semibold">{ingredient.quantity}</span>
                                        <span className="text-text-medium"> {ingredient.item}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-text-dark">Instructions</h3>
                    <div className="space-y-3">
                        {recipe.steps.map((step) => (
                            <div
                                key={step.step_number}
                                className="bg-white border border-border-gray/30 rounded-2xl p-6 hover:border-primary/30 transition-all duration-200"
                            >
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        {step.step_number}
                                    </div>
                                    <p className="text-text-dark leading-relaxed flex-1 pt-0.5">
                                        {step.instruction}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
