"use client";

import React, { useEffect, useState, useRef, useCallback, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Recipe } from "@/lib/gemini";
import { Clock, Flame, Loader2, ChefHat, AlertCircle, User, Search, X } from "lucide-react";
import { recipeCache } from "@/lib/cache";
import { supabase } from "@/lib/supabase";

function normalizeDietType(recipe: Recipe): "veg" | "non-veg" {
    if (recipe.diet_type === "veg" || recipe.diet_type === "non-veg") return recipe.diet_type;
    const text = `${recipe.title} ${recipe.description}`.toLowerCase();
    const nonVegKeywords = ["non-veg", "chicken", "mutton", "fish", "egg", "prawn", "shrimp"];
    return nonVegKeywords.some((keyword) => text.includes(keyword)) ? "non-veg" : "veg";
}

function normalizeRecipe(recipe: Recipe): Recipe {
    return { ...recipe, diet_type: normalizeDietType(recipe) };
}

// Module-level registry: search fetches survive component unmount so results
// are stored in sessionStorage cache even if the user navigates away early.
type SearchFetchResult = { recipes: Recipe[]; searchQueryId: string | null; correctedQuery: string | null; suggestions: string[] };
const searchFetchRegistry = new Map<string, Promise<SearchFetchResult>>();

async function getOrFetchSearchResults(
    registryKey: string,
    fetchFn: () => Promise<SearchFetchResult>,
    onResult: (result: SearchFetchResult) => void
): Promise<void> {
    let promise = searchFetchRegistry.get(registryKey);
    if (!promise) {
        promise = fetchFn().finally(() => searchFetchRegistry.delete(registryKey));
        searchFetchRegistry.set(registryKey, promise);
    }
    const result = await promise;
    onResult(result);
}

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
    const [correctedQuery, setCorrectedQuery] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [recipeSearchQueryIds, setRecipeSearchQueryIds] = useState<Record<string, string>>({});
    const [localSearch, setLocalSearch] = useState("");
    const [showLocalSearch, setShowLocalSearch] = useState(false);
    const fetchedQuery = useRef<string | null>(null);
    const loadingMoreRef = useRef(false);
    const activeChip = diet === "veg" || diet === "non-veg" ? diet : "all";
    const [hasMoreByChip, setHasMoreByChip] = useState<Record<"all" | "veg" | "non-veg", boolean>>({
        all: true,
        veg: true,
        "non-veg": true,
    });
    const [loadingMoreByChip, setLoadingMoreByChip] = useState<Record<"all" | "veg" | "non-veg", boolean>>({
        all: false,
        veg: false,
        "non-veg": false,
    });

    // Responsive count: 6 on mobile (<640px), 12 on desktop
    const getCount = () => (typeof window !== "undefined" && window.innerWidth < 640 ? "6" : "12");
    const SKELETON_COUNT_INITIAL = typeof window !== "undefined" && window.innerWidth < 640 ? 6 : 12;

    useEffect(() => {
        if (!query) { setLoading(false); return; }

        const cacheKey = `${cacheQueryKey}-${language}`;
        if (fetchedQuery.current === cacheKey) return;
        fetchedQuery.current = cacheKey;

        setLoading(true);
        setError("");
        setHasMore(true);
        setHasMoreByChip({ all: true, veg: true, "non-veg": true });

        // Check sessionStorage first
        const cached = recipeCache.getRecipes(cacheQueryKey, undefined, language);
        if (cached && cached.length > 0) {
            setRecipes(cached.map(normalizeRecipe));
            setRecipeSearchQueryIds({});
            setCurrentPage(recipeCache.getRecipesPage(cacheQueryKey, undefined, language));
            setLoading(false);
            return;
        }

        // Use module-level registry so this fetch continues even if user navigates away.
        // Results are stored in sessionStorage when the fetch completes regardless.
        const registryKey = cacheKey;

        const doFetch = async (): Promise<SearchFetchResult> => {
            const apiParams = new URLSearchParams({ q: query, lang: language, count: getCount() });
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

            const results = ((data.recipes || []) as Recipe[]).map(normalizeRecipe);
            const searchQueryId = typeof data.searchQueryId === "string" ? data.searchQueryId : null;
            const corrected = typeof data.correctedQuery === "string" ? data.correctedQuery : null;
            const fetchedSuggestions: string[] = Array.isArray(data.suggestions) ? data.suggestions : [];

            // Persist to sessionStorage regardless of whether component is still mounted
            recipeCache.setRecipes(cacheQueryKey, undefined, results, 1, language);
            return { recipes: results, searchQueryId, correctedQuery: corrected, suggestions: fetchedSuggestions };
        };

        getOrFetchSearchResults(registryKey, doFetch, ({ recipes: results, searchQueryId, correctedQuery: corrected, suggestions: fetchedSuggestions }) => {
            setRecipes(results);
            setRecipeSearchQueryIds(
                searchQueryId
                    ? Object.fromEntries(results.map((r) => [r.id, searchQueryId]))
                    : {}
            );
            if (corrected) setCorrectedQuery(corrected);
            if (fetchedSuggestions.length > 0) setSuggestions(fetchedSuggestions);
            setCurrentPage(1);
            setLoading(false);
        }).catch(() => {
            setError("Failed to fetch recipes. Please try again.");
            setLoading(false);
        });
    }, [query, language, mode, ingredients, cacheQueryKey]);

    const handleLoadMore = useCallback(async () => {
        if (!query || !hasMoreByChip[activeChip] || loadingMoreByChip[activeChip]) return;
        // Capture the chip at call-time so request runs to completion even if user switches chips
        const chipForRequest = activeChip;

        setLoadingMoreByChip((prev) => ({ ...prev, [chipForRequest]: true }));
        setLoadingMore(true);
        loadingMoreRef.current = true;

        try {
            const apiParams = new URLSearchParams({
                q: query,
                lang: language,
                usePopular: "false",
                count: getCount(),
            });
            if (chipForRequest !== "all") apiParams.set("diet", chipForRequest);
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

            const moreRecipes: Recipe[] = ((data.recipes || []) as Recipe[]).map(normalizeRecipe);
            if (moreRecipes.length === 0) {
                setHasMoreByChip((prev) => ({ ...prev, [chipForRequest]: false }));
                return;
            }
            const searchQueryId = typeof data.searchQueryId === "string" ? data.searchQueryId : null;

            // Read current pool from sessionStorage (source of truth), merge and persist immediately.
            // This runs regardless of whether the component is still mounted after navigation.
            const currentPool = recipeCache.getRecipes(cacheQueryKey, undefined, language) || [];
            const existingIds = new Set(currentPool.map((r) => r.id));
            const unique = moreRecipes.filter((r) => !existingIds.has(r.id));

            if (unique.length === 0) return;

            const merged = [...currentPool, ...unique];
            recipeCache.setRecipes(cacheQueryKey, undefined, merged, currentPage + 1, language);

            // Update React state (no-op if component unmounted, but cache is already persisted above)
            setRecipes(merged);
            setCurrentPage((p) => p + 1);
            if (searchQueryId) {
                setRecipeSearchQueryIds((prevMap) => ({
                    ...prevMap,
                    ...Object.fromEntries(unique.map((r) => [r.id, searchQueryId])),
                }));
            }
        } catch {
            // silent
        } finally {
            setLoadingMoreByChip((prev) => ({ ...prev, [chipForRequest]: false }));
            setLoadingMore(false);
            loadingMoreRef.current = false;
        }
    }, [query, language, mode, ingredients, cacheQueryKey, hasMoreByChip, loadingMoreByChip, activeChip, currentPage]);

    const filteredRecipes = useMemo(() => {
        let list = recipes;
        if (diet === "veg") list = list.filter((r) => r.diet_type === "veg");
        else if (diet === "non-veg") list = list.filter((r) => r.diet_type === "non-veg");
        if (localSearch.trim()) {
            const term = localSearch.trim().toLowerCase();
            list = list.filter((r) =>
                r.title.toLowerCase().includes(term) || r.description.toLowerCase().includes(term)
            );
        }
        return list;
    }, [recipes, diet, localSearch]);

    useEffect(() => {
        setHasMore(hasMoreByChip[activeChip]);
    }, [activeChip, hasMoreByChip]);

    const SKELETON_COUNT = SKELETON_COUNT_INITIAL;

    const DIET_CHIPS = [
        { value: null, label: "All" },
        { value: "veg", label: "Veg" },
        { value: "non-veg", label: "Non-Veg" },
    ] as const;

    const handleDietChip = (value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set("diet", value);
        } else {
            params.delete("diet");
        }
        // replace instead of push so chip switches don't pollute back-stack
        router.replace(`/recipes?${params.toString()}`);
    };

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
                            <span className="text-xs font-semibold text-text-dark truncate">
                                {correctedQuery || query}
                            </span>
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

                {/* Diet filter chips + inline search */}
                <div className="flex items-center gap-2 px-5 pb-3 pt-0">
                    {DIET_CHIPS.map((chip) => {
                        const isActive = (chip.value === null && !diet) || diet === chip.value;
                        return (
                            <button
                                key={chip.label}
                                onClick={() => handleDietChip(chip.value ?? null)}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 shrink-0 ${
                                    isActive
                                        ? "bg-primary text-white border-primary shadow-sm"
                                        : "bg-white text-text-medium border-border-gray/30 hover:border-primary/40 hover:text-text-dark"
                                }`}
                            >
                                {chip.label}
                            </button>
                        );
                    })}

                    {/* Inline keyword filter — only when ≥15 recipes loaded */}
                    {recipes.length >= 15 && (
                        <div className="flex items-center gap-2 ml-auto">
                            {showLocalSearch ? (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background-muted border border-border-gray/25 rounded-full">
                                    <Search size={11} className="text-text-medium shrink-0" strokeWidth={2} />
                                    <input
                                        autoFocus
                                        type="text"
                                        value={localSearch}
                                        onChange={(e) => setLocalSearch(e.target.value)}
                                        placeholder="Filter results…"
                                        className="text-xs text-text-dark placeholder:text-text-medium/60 bg-transparent focus:outline-none w-32 sm:w-44"
                                    />
                                    <button
                                        onClick={() => { setLocalSearch(""); setShowLocalSearch(false); }}
                                        className="text-text-medium hover:text-text-dark transition-colors"
                                    >
                                        <X size={11} strokeWidth={2.5} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowLocalSearch(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-gray/30 text-xs font-semibold text-text-medium hover:border-primary/40 hover:text-text-dark transition-all duration-150 shrink-0"
                                >
                                    <Search size={11} strokeWidth={2} />
                                    <span>Filter</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* Did you mean / spelling correction banner */}
            {(correctedQuery || suggestions.length > 0) && (
                <div className="w-full px-5 py-2 bg-amber-50 border-b border-amber-100 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-xs text-amber-700">
                        {correctedQuery
                            ? <>Showing results for <span className="font-semibold">&ldquo;{correctedQuery}&rdquo;</span> instead of &ldquo;{query}&rdquo;</>
                            : <>Did you mean</>}
                    </span>
                    {suggestions.map((s) => (
                        <button
                            key={s}
                            onClick={() => router.push(`/recipes?q=${encodeURIComponent(s)}&lang=${language}`)}
                            className="text-xs font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900 transition-colors"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

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
                ) : filteredRecipes.length === 0 ? (
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
                            {filteredRecipes.length} {filteredRecipes.length === 1 ? "recipe" : "recipes"} found
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredRecipes.map((recipe) => (
                                <RecipeCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    language={language}
                                    searchQueryId={recipeSearchQueryIds[recipe.id]}
                                />
                            ))}
                            {Object.values(loadingMoreByChip).some(Boolean) && Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                                <SkeletonCard key={`sk-${i}`} />
                            ))}
                        </div>

                        {/* Load More button */}
                        {hasMoreByChip[activeChip] && (
                            <div className="flex justify-center pt-6 pb-4">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={Object.values(loadingMoreByChip).some(Boolean)}
                                    className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-border-gray/25 rounded-full text-sm font-semibold text-primary shadow-sm hover:border-primary/40 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                                >
                                    {Object.values(loadingMoreByChip).some(Boolean) ? (
                                        <><Loader2 size={15} className="animate-spin" strokeWidth={2} /><span>Loading...</span></>
                                    ) : (
                                        <span>Load more recipes</span>
                                    )}
                                </button>
                            </div>
                        )}

                        {!hasMoreByChip[activeChip] && filteredRecipes.length > 0 && (
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
                <div className="w-full bg-white border-b border-border-gray/15">
                    <div className="h-14" />
                    <div className="flex items-center gap-2 px-5 pb-3">
                        {["All", "Veg", "Non-Veg"].map((l) => (
                            <div key={l} className="px-4 py-1.5 rounded-full text-xs bg-background-muted animate-pulse w-16 h-7" />
                        ))}
                    </div>
                </div>
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
