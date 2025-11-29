"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { geminiAgent, Recipe } from "@/lib/gemini";
import { ArrowLeft, Clock, Flame, Loader2, ChefHat, AlertCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { recipeCache } from "@/lib/cache";

export default function RecipesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get("q");
    const diet = searchParams.get("diet");

    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const fetchedQuery = React.useRef<string | null>(null);

    useEffect(() => {
        if (!query) {
            setLoading(false);
            return;
        }

        // Prevent double fetching in React Strict Mode
        const cacheKey = `${query}-${diet}`;
        if (fetchedQuery.current === cacheKey) {
            return;
        }
        fetchedQuery.current = cacheKey;

        const fetchRecipes = async () => {
            try {
                setLoading(true);
                setError("");
                
                // Check cache first
                const cached = recipeCache.getRecipes(query, diet || undefined);
                if (cached && cached.length > 0) {
                    setRecipes(cached);
                    setCurrentPage(recipeCache.getRecipesPage(query, diet || undefined));
                    setLoading(false);
                    return;
                }

                // Fetch from API if not cached
                const results = await geminiAgent.searchRecipes(query, diet || undefined, 6);
                setRecipes(results);
                setCurrentPage(1);
                
                // Cache the results
                recipeCache.setRecipes(query, diet || undefined, results, 1);
            } catch (err) {
                setError("Failed to fetch recipes. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchRecipes();
    }, [query, diet]);

    const handleLoadMore = async () => {
        if (!query || loadingMore) return;

        try {
            setLoadingMore(true);
            setError("");

            // Request more recipes
            const moreRecipes = await geminiAgent.searchRecipes(query, diet || undefined, 5);
            
            if (moreRecipes.length === 0) {
                setHasMore(false);
                return;
            }

            // Filter out duplicates based on title
            const existingTitles = new Set(recipes.map(r => r.title.toLowerCase()));
            const uniqueNewRecipes = moreRecipes.filter(
                r => !existingTitles.has(r.title.toLowerCase())
            );

            if (uniqueNewRecipes.length === 0) {
                setHasMore(false);
                return;
            }

            const updatedRecipes = [...recipes, ...uniqueNewRecipes];
            setRecipes(updatedRecipes);
            const newPage = currentPage + 1;
            setCurrentPage(newPage);

            // Update cache with new recipes
            recipeCache.setRecipes(query, diet || undefined, updatedRecipes, newPage);
        } catch (err) {
            setError("Failed to load more recipes. Please try again.");
        } finally {
            setLoadingMore(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background-light to-background-muted pb-24">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-border-gray/30 z-50 shadow-sm">
                <div className="max-w-md mx-auto px-6 py-4">
                    <div className="flex items-start gap-3 min-w-0">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-full hover:bg-background-muted/50 text-text-dark transition-all active:scale-95 flex-shrink-0 mt-0.5"
                        >
                            <ArrowLeft size={20} strokeWidth={2} />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg font-semibold text-primary break-words leading-tight">
                                {query ? `"${query}"` : "Recipes"}
                            </h1>
                            <p className="text-xs text-text-medium mt-0.5 break-words">
                                {diet === "veg" ? "Vegetarian" : diet === "non-veg" ? "Non-Vegetarian" : "All"} recipes
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto px-6 pt-6">

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                        <div className="relative flex items-center justify-center w-16 h-16">
                            <Loader2 size={40} className="animate-spin text-primary absolute" strokeWidth={2.5} />
                            <ChefHat size={20} className="text-primary relative z-10" strokeWidth={2} />
                        </div>
                        <p className="text-text-medium">Curating recipes just for you...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                            <AlertCircle size={32} className="text-error" strokeWidth={2} />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-error font-medium">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="text-primary font-medium hover:underline text-sm"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : recipes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <ChefHat size={28} className="text-primary" strokeWidth={2} />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-text-dark font-medium">No recipes found</p>
                            <p className="text-text-medium text-sm">Try a different search term</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 pb-8">
                        <p className="text-sm text-text-medium px-1">
                            Found {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
                        </p>
                        {recipes.map((recipe) => (
                            <RecipeCard key={recipe.id} recipe={recipe} />
                        ))}
                        
                        {/* Load More Button */}
                        {hasMore && recipes.length > 0 && (
                            <div className="pt-4">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="w-full py-4 bg-white border border-border-gray/30 rounded-2xl text-primary font-semibold hover:border-primary hover:shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" strokeWidth={2} />
                                            <span>Loading more recipes...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ChefHat size={20} strokeWidth={2} />
                                            <span>Load More Recipes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* No More Results */}
                        {!hasMore && recipes.length > 0 && (
                            <div className="pt-4 text-center">
                                <p className="text-sm text-text-medium">
                                    You've reached the end of the results
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
    const router = useRouter();

    return (
        <div
            onClick={() => router.push(`/recipes/${recipe.id}`)}
            className="bg-white border border-border-gray/30 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]"
        >
            <div className="p-6 space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-text-dark leading-tight mb-2 line-clamp-2">
                        {recipe.title}
                    </h3>
                    <p className="text-text-medium text-sm leading-relaxed line-clamp-2">
                        {recipe.description}
                    </p>
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-border-gray/30">
                    <div className="flex items-center gap-1.5 text-sm text-text-medium">
                        <Clock size={16} className="text-primary" strokeWidth={2} />
                        <span>{recipe.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-text-medium">
                        <Flame size={16} className="text-secondary-orange" strokeWidth={2} />
                        <span>{recipe.calories}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
