"use client";

import React, { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Recipe } from "@/lib/gemini";
import { Clock, Flame, Loader2, ChefHat, AlertCircle, User } from "lucide-react";
import { recipeCache } from "@/lib/cache";
import { supabase } from "@/lib/supabase";

function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl border border-border-gray/20 p-4 animate-pulse space-y-3">
            <div className="space-y-2">
                <div className="h-3.5 bg-background-muted rounded-full w-5/6" />
                <div className="h-3.5 bg-background-muted rounded-full w-3/4" />
            </div>
            <div className="space-y-1.5">
                <div className="h-2.5 bg-background-muted rounded-full w-full" />
                <div className="h-2.5 bg-background-muted rounded-full w-5/6" />
                <div className="h-2.5 bg-background-muted rounded-full w-4/6" />
            </div>
            <div className="flex gap-3 pt-1">
                <div className="h-2.5 bg-background-muted rounded-full w-14" />
                <div className="h-2.5 bg-background-muted rounded-full w-16" />
            </div>
        </div>
    );
}

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
    const [recipeSearchQueryIds, setRecipeSearchQueryIds] = useState<Record<string, string>>({});
    const fetchedQuery = useRef<string | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const loadingMoreRef = useRef(false);

    // Responsive count: 6 on mobile (<640px), 12 on desktop
    const getCount = () => (typeof window !== "undefined" && window.innerWidth < 640 ? "6" : "12");
    const SKELETON_COUNT_INITIAL = typeof window !== "undefined" && window.innerWidth < 640 ? 6 : 12;

    useEffect(() => {
        if (!query) { setLoading(false); return; }

        const cacheKey = `${cacheQueryKey}-${diet}-${language}`;
        if (fetchedQuery.current === cacheKey) return;
        fetchedQuery.current = cacheKey;

        const fetchRecipes = async () => {
            try {
                setLoading(true);
                setError("");
                setHasMore(true);

                const cached = recipeCache.getRecipes(cacheQueryKey, diet || undefined, language);
                if (cached && cached.length > 0) {
                    setRecipes(cached);
                    setRecipeSearchQueryIds({});
                    setCurrentPage(recipeCache.getRecipesPage(cacheQueryKey, diet || undefined, language));
                    setLoading(false);
                    return;
                }

                const apiParams = new URLSearchParams({
                    q: query,
                    diet: diet || "veg",
                    lang: language,
                    count: getCount(),
                });
                if (mode) apiParams.set("mode", mode);
                if (ingredients) apiParams.set("ingredients", ingredients);

                const { data: { session } } = await supabase.auth.getSession();
                const response = await fetch(`/api/recipes/search?${apiParams.toString()}`, {
                    headers: session?.access_token
                        ? { Authorization: `Bearer ${session.access_token}` }
                        : {},
                });
                const data = await response.json();
                if (data.error) throw new Error(data.message || "Failed to fetch recipes");

                const results = data.recipes || [];
                setRecipes(results);
                const searchQueryId = typeof data.searchQueryId === "string" ? data.searchQueryId : null;
                setRecipeSearchQueryIds(
                    searchQueryId
                        ? Object.fromEntries(results.map((recipe: Recipe) => [recipe.id, searchQueryId]))
                        : {}
                );
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

    const handleLoadMore = useCallback(async () => {
        if (!query || loadingMoreRef.current || !hasMore) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);

        try {
            const apiParams = new URLSearchParams({
                q: query,
                diet: diet || "veg",
                lang: language,
                usePopular: "false",
                count: getCount(),
            });
            if (mode) apiParams.set("mode", mode);
            if (ingredients) apiParams.set("ingredients", ingredients);

            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/recipes/search?${apiParams.toString()}`, {
                headers: session?.access_token
                    ? { Authorization: `Bearer ${session.access_token}` }
                    : {},
            });
            const data = await response.json();
            if (data.error || !data.recipes) throw new Error("Failed to load more");

            const moreRecipes: Recipe[] = data.recipes;
            if (moreRecipes.length === 0) { setHasMore(false); return; }
            const searchQueryId = typeof data.searchQueryId === "string" ? data.searchQueryId : null;

            setRecipes((prev) => {
                const existingTitles = new Set(prev.map((r) => r.title.toLowerCase()));
                const unique = moreRecipes.filter((r) => !existingTitles.has(r.title.toLowerCase()));
                if (unique.length === 0) { setHasMore(false); return prev; }
                if (searchQueryId) {
                    setRecipeSearchQueryIds((prevMap) => ({
                        ...prevMap,
                        ...Object.fromEntries(unique.map((recipe) => [recipe.id, searchQueryId])),
                    }));
                }
                const updated = [...prev, ...unique];
                setCurrentPage((p) => {
                    recipeCache.setRecipes(cacheQueryKey, diet || undefined, updated, p + 1, language);
                    return p + 1;
                });
                return updated;
            });
        } catch {
            // silent — scroll will retry
        } finally {
            setLoadingMore(false);
            loadingMoreRef.current = false;
        }
    }, [query, diet, language, mode, ingredients, cacheQueryKey, hasMore]);

    // Infinite scroll
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMoreRef.current) {
                    handleLoadMore();
                }
            },
            { rootMargin: "300px" }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, handleLoadMore]);

    const dietLabel = diet === "veg" ? "Vegetarian" : diet === "non-veg" ? "Non-Vegetarian" : "All";

    const SKELETON_COUNT = SKELETON_COUNT_INITIAL;

    return (
        <div className="min-h-screen bg-background-muted flex flex-col">

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white border-b border-border-gray/15">
                <div className="w-full px-5 h-14 flex items-center gap-3">
                    <button
                        onClick={() => router.push("/home")}
                        className="text-lg font-bold text-primary tracking-tight shrink-0"
                    >
                        ChefQuest
                    </button>

                    {query && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background-muted rounded-full border border-border-gray/20 min-w-0 overflow-hidden">
                            <span className="text-xs font-medium text-text-medium shrink-0">{dietLabel}</span>
                            <span className="text-border-gray shrink-0">·</span>
                            <span className="text-xs font-semibold text-text-dark truncate">{query}</span>
                        </div>
                    )}

                    <div className="flex-1" />

                    <button
                        onClick={() => router.push("/profile")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-gray/30 text-xs font-semibold text-text-medium hover:text-text-dark hover:border-border-gray/60 transition-colors shrink-0"
                    >
                        <User size={14} strokeWidth={2} />
                        
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 w-full px-4 sm:px-6 py-5">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center min-h-[55vh] gap-4">
                        <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center">
                            <AlertCircle size={28} className="text-error" strokeWidth={2} />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-medium text-error">{error}</p>
                            <button onClick={() => window.location.reload()} className="text-sm text-primary font-medium hover:underline">
                                Try again
                            </button>
                        </div>
                    </div>
                ) : recipes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[55vh] gap-3">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                            <ChefHat size={26} className="text-primary" strokeWidth={2} />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-medium text-text-dark">No recipes found</p>
                            <p className="text-xs text-text-medium">Try a different search term</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-xs text-text-medium px-1 pb-3">
                            {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"} found
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {recipes.map((recipe) => (
                                <RecipeCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    language={language}
                                    searchQueryId={recipeSearchQueryIds[recipe.id]}
                                />
                            ))}
                            {loadingMore && Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                                <SkeletonCard key={`sk-${i}`} />
                            ))}
                        </div>

                        {/* Sentinel for infinite scroll pre-load */}
                        {hasMore && <div ref={sentinelRef} className="h-1 mt-1" />}

                        {/* Load More button */}
                        {hasMore && (
                            <div className="flex justify-center pt-6 pb-4">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-border-gray/25 rounded-full text-sm font-semibold text-primary shadow-sm hover:border-primary/40 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                                >
                                    {loadingMore ? (
                                        <><Loader2 size={15} className="animate-spin" strokeWidth={2} /><span>Loading...</span></>
                                    ) : (
                                        <span>Load more recipes</span>
                                    )}
                                </button>
                            </div>
                        )}

                        {!hasMore && (
                            <p className="text-center text-xs text-text-medium py-6">
                                You&apos;ve seen all results
                            </p>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

function RecipeCard({
    recipe,
    language,
    searchQueryId,
}: {
    recipe: Recipe;
    language?: string;
    searchQueryId?: string;
}) {
    const router = useRouter();

    return (
        <div
            onClick={() => {
                const params = new URLSearchParams();
                if (language) params.set("lang", language);
                if (searchQueryId) params.set("sq", searchQueryId);
                const queryString = params.toString();
                router.push(`/recipes/${recipe.id}${queryString ? `?${queryString}` : ""}`);
            }}
            className="bg-white rounded-2xl border border-border-gray/20 shadow-sm p-4 cursor-pointer hover:border-primary/30 hover:shadow-md active:scale-[0.98] transition-all duration-150 flex flex-col gap-2"
        >
            <h3 className="text-xs font-bold text-text-dark leading-snug line-clamp-2">
                {recipe.title}
            </h3>
            <p className="text-[11px] text-text-medium leading-relaxed line-clamp-3 flex-1">
                {recipe.description}
            </p>
            <div className="flex items-center gap-3 pt-1 border-t border-border-gray/15 mt-auto">
                <div className="flex items-center gap-1 text-[11px] text-text-medium">
                    <Clock size={11} className="text-primary shrink-0" strokeWidth={2} />
                    <span>{recipe.time}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-text-medium">
                    <Flame size={11} className="text-secondary-orange shrink-0" strokeWidth={2} />
                    <span>{recipe.calories}</span>
                </div>
            </div>
        </div>
    );
}

export default function RecipesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background-muted flex flex-col">
                <div className="w-full h-14 bg-white border-b border-border-gray/15" />
                <div className="w-full px-4 sm:px-6 py-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                </div>
            </div>
        }>
            <RecipesPageContent />
        </Suspense>
    );
}
