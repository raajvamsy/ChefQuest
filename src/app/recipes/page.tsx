"use client";

import React, { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Recipe } from "@/lib/gemini";
import { Clock, Flame, Loader2, ChefHat, AlertCircle, User } from "lucide-react";
import { recipeCache } from "@/lib/cache";

// Subtle pastel tones that rotate across cards
const CARD_ACCENTS = [
  "bg-emerald-50",
  "bg-amber-50",
  "bg-sky-50",
  "bg-rose-50",
  "bg-violet-50",
  "bg-lime-50",
];

function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl border border-border-gray/20 overflow-hidden animate-pulse">
            <div className="h-32 bg-background-muted" />
            <div className="p-3 space-y-2.5">
                <div className="h-3 bg-background-muted rounded-full w-4/5" />
                <div className="h-3 bg-background-muted rounded-full w-3/5" />
                <div className="h-2.5 bg-background-muted rounded-full w-full" />
                <div className="h-2.5 bg-background-muted rounded-full w-4/5" />
                <div className="flex gap-3 pt-1">
                    <div className="h-2.5 bg-background-muted rounded-full w-12" />
                    <div className="h-2.5 bg-background-muted rounded-full w-14" />
                </div>
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
    const fetchedQuery = useRef<string | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const loadingMoreRef = useRef(false);

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
                    setCurrentPage(recipeCache.getRecipesPage(cacheQueryKey, diet || undefined, language));
                    setLoading(false);
                    return;
                }

                const apiParams = new URLSearchParams({ q: query, diet: diet || "veg", lang: language });
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

    const handleLoadMore = useCallback(async () => {
        if (!query || loadingMoreRef.current || !hasMore) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);

        try {
            const apiParams = new URLSearchParams({ q: query, diet: diet || "veg", lang: language, usePopular: "false" });
            if (mode) apiParams.set("mode", mode);
            if (ingredients) apiParams.set("ingredients", ingredients);

            const response = await fetch(`/api/recipes/search?${apiParams.toString()}`);
            const data = await response.json();
            if (data.error || !data.recipes) throw new Error("Failed to load more");

            const moreRecipes: Recipe[] = data.recipes;
            if (moreRecipes.length === 0) { setHasMore(false); return; }

            setRecipes((prev) => {
                const existingTitles = new Set(prev.map((r) => r.title.toLowerCase()));
                const unique = moreRecipes.filter((r) => !existingTitles.has(r.title.toLowerCase()));
                if (unique.length === 0) { setHasMore(false); return prev; }
                const updated = [...prev, ...unique];
                const newPage = currentPage + 1;
                setCurrentPage(newPage);
                recipeCache.setRecipes(cacheQueryKey, diet || undefined, updated, newPage, language);
                return updated;
            });
        } catch {
            // silently fail — user can scroll up/down to retry
        } finally {
            setLoadingMore(false);
            loadingMoreRef.current = false;
        }
    }, [query, diet, language, mode, ingredients, cacheQueryKey, currentPage, hasMore]);

    // Infinite scroll sentinel
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMoreRef.current) {
                    handleLoadMore();
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, handleLoadMore]);

    const dietLabel = diet === "veg" ? "Vegetarian" : diet === "non-veg" ? "Non-Vegetarian" : "All";

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
                        <span className="hidden sm:inline">Profile</span>
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-5">
                {loading ? (
                    /* Initial skeleton grid */
                    <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
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

                        {/* 2-column grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {recipes.map((recipe, idx) => (
                                <RecipeCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    language={language}
                                    accentClass={CARD_ACCENTS[idx % CARD_ACCENTS.length]}
                                />
                            ))}

                            {/* Skeleton cards appended while loading more */}
                            {loadingMore && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
                        </div>

                        {/* Sentinel for IntersectionObserver */}
                        {hasMore && <div ref={sentinelRef} className="h-4 mt-2" />}

                        {!hasMore && recipes.length > 0 && (
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

function RecipeCard({ recipe, language, accentClass }: { recipe: Recipe; language?: string; accentClass: string }) {
    const router = useRouter();

    return (
        <div
            onClick={() => router.push(`/recipes/${recipe.id}${language ? `?lang=${language}` : ""}`)}
            className="bg-white rounded-2xl border border-border-gray/20 shadow-sm overflow-hidden cursor-pointer hover:border-primary/25 hover:shadow-md active:scale-[0.98] transition-all duration-150 flex flex-col"
        >
            {/* Visual area */}
            <div className={`${accentClass} h-28 flex items-center justify-center shrink-0`}>
                <ChefHat size={32} className="text-text-medium/30" strokeWidth={1.5} />
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col gap-1.5 flex-1">
                <h3 className="text-xs font-semibold text-text-dark leading-snug line-clamp-2">
                    {recipe.title}
                </h3>
                <p className="text-[11px] text-text-medium leading-relaxed line-clamp-2 flex-1">
                    {recipe.description}
                </p>
                <div className="flex items-center gap-3 pt-1">
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
        </div>
    );
}

export default function RecipesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background-muted flex flex-col">
                <div className="w-full h-14 bg-white border-b border-border-gray/15" />
                <div className="w-full max-w-2xl mx-auto px-4 py-5">
                    <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                </div>
            </div>
        }>
            <RecipesPageContent />
        </Suspense>
    );
}
