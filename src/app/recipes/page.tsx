"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Recipe } from "@/lib/gemini";
import { ArrowLeft, Clock, Flame, Loader2, ChefHat, AlertCircle } from "lucide-react";
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
                    <button
                        onClick={() => router.back()}
                        className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-background-muted transition-colors shrink-0"
                    >
                        <ArrowLeft size={18} strokeWidth={2} className="text-text-dark" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-text-dark truncate leading-tight">
                            {query ? `"${query}"` : "Recipes"}
                        </p>
                        <p className="text-xs text-text-medium">{dietLabel} recipes</p>
                    </div>
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

                        {/* Recipe list — single white container with dividers */}
                        <div className="bg-white rounded-2xl border border-border-gray/20 shadow-sm overflow-hidden">
                            {recipes.map((recipe, idx) => (
                                <RecipeRow
                                    key={recipe.id}
                                    recipe={recipe}
                                    language={language}
                                    isLast={idx === recipes.length - 1}
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

function RecipeRow({ recipe, language, isLast }: { recipe: Recipe; language?: string; isLast: boolean }) {
    const router = useRouter();

    return (
        <div
            onClick={() => router.push(`/recipes/${recipe.id}${language ? `?lang=${language}` : ""}`)}
            className={`px-5 py-4 cursor-pointer hover:bg-background-muted/50 active:bg-background-muted transition-colors duration-100 ${
                !isLast ? "border-b border-border-gray/15" : ""
            }`}
        >
            <h3 className="text-sm font-semibold text-text-dark leading-snug mb-1">
                {recipe.title}
            </h3>
            <p className="text-xs text-text-medium leading-relaxed line-clamp-2 mb-3">
                {recipe.description}
            </p>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-xs text-text-medium">
                    <Clock size={13} className="text-primary" strokeWidth={2} />
                    <span>{recipe.time}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-text-medium">
                    <Flame size={13} className="text-secondary-orange" strokeWidth={2} />
                    <span>{recipe.calories}</span>
                </div>
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
