"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Recipe } from "@/lib/gemini";
import { Clock, Flame, Loader2, ChefHat, AlertCircle, User, ChevronRight } from "lucide-react";
import { recipeCache } from "@/lib/cache";

function RecipesPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get("q");
    const diet = searchParams.get("diet");
    const language = searchParams.get("lang") || "en";
    const mode = searchParams.get("mode");
    const ingredients = searchParams.get("ingredients");
    const cacheQueryKey = `${query || ""}|mode=${mode || "query_only"}|ingredients=${ingredients || ""}`;

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

        const cacheKey = `${cacheQueryKey}-${diet}-${language}`;
        if (fetchedQuery.current === cacheKey) return;
        fetchedQuery.current = cacheKey;

        const fetchRecipes = async () => {
            try {
                setLoading(true);
                setError("");

                const cached = recipeCache.getRecipes(cacheQueryKey, diet || undefined, language);
                if (cached && cached.length > 0) {
                    setRecipes(cached);
                    setCurrentPage(recipeCache.getRecipesPage(cacheQueryKey, diet || undefined, language));
                    setLoading(false);
                    return;
                }

                const apiParams = new URLSearchParams({
                    q: query,
                    diet: diet || "veg",
                    lang: language,
                });
                if (mode) apiParams.set("mode", mode);
                if (ingredients) apiParams.set("ingredients", ingredients);

                const response = await fetch(`/api/recipes/search?${apiParams.toString()}`);
                const data = await response.json();

                if (data.error) throw new Error(data.message || "Failed to fetch recipes");

                const results = data.recipes || [];
                setRecipes(results);
                setCurrentPage(1);
                recipeCache.setRecipes(cacheQueryKey, diet || undefined, results, 1, language);
            } catch {
                setError("Failed to fetch recipes. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchRecipes();
    }, [query, diet, language, mode, ingredients, cacheQueryKey]);

    const handleLoadMore = async () => {
        if (!query || loadingMore) return;

        try {
            setLoadingMore(true);
            setError("");

            const apiParams = new URLSearchParams({
                q: query,
                diet: diet || "veg",
                lang: language,
                usePopular: "false",
            });
            if (mode) apiParams.set("mode", mode);
            if (ingredients) apiParams.set("ingredients", ingredients);

            const response = await fetch(`/api/recipes/search?${apiParams.toString()}`);
            const data = await response.json();

            if (data.error || !data.recipes) throw new Error(data.message || "Failed to load more");

            const moreRecipes = data.recipes;
            if (moreRecipes.length === 0) { setHasMore(false); return; }

            const existingTitles = new Set(recipes.map((r: Recipe) => r.title.toLowerCase()));
            const uniqueNewRecipes = moreRecipes.filter(
                (r: Recipe) => !existingTitles.has(r.title.toLowerCase())
            );

            if (uniqueNewRecipes.length === 0) { setHasMore(false); return; }

            const updatedRecipes = [...recipes, ...uniqueNewRecipes];
            setRecipes(updatedRecipes);
            const newPage = currentPage + 1;
            setCurrentPage(newPage);
            recipeCache.setRecipes(cacheQueryKey, diet || undefined, updatedRecipes, newPage, language);
        } catch {
            setError("Failed to load more recipes. Please try again.");
        } finally {
            setLoadingMore(false);
        }
    };

    const dietLabel = diet === "veg" ? "Vegetarian" : diet === "non-veg" ? "Non-Vegetarian" : "All";

    return (
        <div className="min-h-screen bg-background-muted flex flex-col">

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white border-b border-border-gray/15">
                <div className="w-full px-5 h-14 flex items-center gap-3">
                    {/* Logo */}
                    <button
                        onClick={() => router.push("/home")}
                        className="text-lg font-bold text-primary tracking-tight shrink-0"
                    >
                        ChefQuest
                    </button>

                    {/* Search query pill */}
                    {query && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background-muted rounded-full border border-border-gray/20 min-w-0 overflow-hidden">
                            <span className="text-xs font-medium text-text-medium truncate">{dietLabel}</span>
                            <span className="text-border-gray/60">·</span>
                            <span className="text-xs font-semibold text-text-dark truncate">{query}</span>
                        </div>
                    )}

                    <div className="flex-1" />

                    {/* Profile */}
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
            <main className="flex-1 w-full max-w-lg mx-auto px-5 py-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[55vh] gap-3">
                        <div className="relative flex items-center justify-center w-14 h-14">
                            <Loader2 size={36} className="animate-spin text-primary absolute" strokeWidth={2} />
                            <ChefHat size={18} className="text-primary relative z-10" strokeWidth={2} />
                        </div>
                        <p className="text-sm text-text-medium">Curating recipes just for you...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center min-h-[55vh] gap-4">
                        <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center">
                            <AlertCircle size={28} className="text-error" strokeWidth={2} />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-medium text-error">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="text-sm text-primary font-medium hover:underline"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                ) : recipes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[55vh] gap-3">
                        <div className="w-14 h-14 rounded-full bg-primary/8 flex items-center justify-center">
                            <ChefHat size={26} className="text-primary" strokeWidth={2} />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-medium text-text-dark">No recipes found</p>
                            <p className="text-xs text-text-medium">Try a different search term</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-xs text-text-medium px-1 pb-1">
                            Found {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
                        </p>

                        {/* Recipe cards */}
                        <div className="space-y-3">
                            {recipes.map((recipe) => (
                                <RecipeCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    language={language}
                                />
                            ))}
                        </div>

                        {/* Load More */}
                        {hasMore && (
                            <button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="w-full py-3.5 bg-white border border-border-gray/20 rounded-2xl text-sm font-semibold text-primary hover:border-primary/30 hover:shadow-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                            >
                                {loadingMore ? (
                                    <><Loader2 size={16} className="animate-spin" strokeWidth={2} /><span>Loading more...</span></>
                                ) : (
                                    <span>Load more recipes</span>
                                )}
                            </button>
                        )}

                        {!hasMore && recipes.length > 0 && (
                            <p className="text-center text-xs text-text-medium py-4">
                                You&apos;ve seen all results
                            </p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

function RecipeCard({ recipe, language }: { recipe: Recipe; language?: string }) {
    const router = useRouter();

    return (
        <div
            onClick={() => router.push(`/recipes/${recipe.id}${language ? `?lang=${language}` : ""}`)}
            className="bg-white rounded-2xl border border-border-gray/20 shadow-sm px-5 py-4 cursor-pointer hover:border-primary/25 hover:shadow-md active:scale-[0.99] transition-all duration-150"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                    <h3 className="text-sm font-semibold text-text-dark leading-snug">
                        {recipe.title}
                    </h3>
                    <p className="text-xs text-text-medium leading-relaxed line-clamp-2">
                        {recipe.description}
                    </p>
                    <div className="flex items-center gap-4 pt-1">
                        <div className="flex items-center gap-1 text-xs text-text-medium">
                            <Clock size={12} className="text-primary shrink-0" strokeWidth={2} />
                            <span>{recipe.time}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-text-medium">
                            <Flame size={12} className="text-secondary-orange shrink-0" strokeWidth={2} />
                            <span>{recipe.calories}</span>
                        </div>
                    </div>
                </div>
                <ChevronRight size={16} className="text-border-gray shrink-0 mt-0.5" strokeWidth={2} />
            </div>
        </div>
    );
}

export default function RecipesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background-muted flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative flex items-center justify-center w-14 h-14">
                        <Loader2 size={36} className="animate-spin text-primary absolute" strokeWidth={2} />
                        <ChefHat size={18} className="text-primary relative z-10" strokeWidth={2} />
                    </div>
                    <p className="text-sm text-text-medium">Loading...</p>
                </div>
            </div>
        }>
            <RecipesPageContent />
        </Suspense>
    );
}
