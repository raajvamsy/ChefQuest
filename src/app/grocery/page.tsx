"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    ShoppingCart, Check, Trash2, Plus, ChefHat, Loader2,
    ArrowLeft, Leaf, Beef, Milk, Wheat, FlameKindling, Package, HelpCircle, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface GroceryItem {
    id: string;
    ingredient_name: string;
    quantity: string | null;
    unit: string | null;
    category: string;
    is_checked: boolean;
    recipe_key: string | null;
    recipe_title: string | null;
}

interface GroceryList {
    id: string;
    name: string;
    total_items: number;
    completed_items: number;
}

const CATEGORY_ORDER = ["Produce", "Meat", "Dairy", "Grains", "Spices", "Pantry", "Other"];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    Produce: Leaf,
    Meat: Beef,
    Dairy: Milk,
    Grains: Wheat,
    Spices: FlameKindling,
    Pantry: Package,
    Other: HelpCircle,
};

const CATEGORY_COLORS: Record<string, string> = {
    Produce: "text-green-600 bg-green-50",
    Meat: "text-red-600 bg-red-50",
    Dairy: "text-blue-600 bg-blue-50",
    Grains: "text-amber-600 bg-amber-50",
    Spices: "text-orange-600 bg-orange-50",
    Pantry: "text-purple-600 bg-purple-50",
    Other: "text-gray-600 bg-gray-50",
};

type ViewMode = "category" | "recipe";

export default function GroceryPage() {
    const router = useRouter();
    const [list, setList] = useState<GroceryList | null>(null);
    const [items, setItems] = useState<GroceryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [removingRecipe, setRemovingRecipe] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("category");

    const getAuthHeaders = async (): Promise<Record<string, string>> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) return { Authorization: `Bearer ${session.access_token}` };
        return {};
    };

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch("/api/grocery/lists", { headers });
            if (res.status === 401) { router.push("/login"); return; }
            const data = await res.json();
            setList(data.list);
            setItems(data.items || []);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchList(); }, [fetchList]);

    const toggleItem = async (item: GroceryItem) => {
        setTogglingId(item.id);
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_checked: !i.is_checked } : i));
        try {
            const headers = await getAuthHeaders();
            await fetch(`/api/grocery/items/${item.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", ...headers },
                body: JSON.stringify({ isChecked: !item.is_checked }),
            });
        } catch {
            setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_checked: item.is_checked } : i));
        } finally {
            setTogglingId(null);
        }
    };

    const removeItem = async (itemId: string) => {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        try {
            const headers = await getAuthHeaders();
            await fetch(`/api/grocery/items/${itemId}`, { method: "DELETE", headers });
        } catch {
            fetchList();
        }
    };

    const removeRecipe = async (recipeKey: string) => {
        setRemovingRecipe(recipeKey);
        setItems((prev) => prev.filter((i) => i.recipe_key !== recipeKey));
        try {
            const headers = await getAuthHeaders();
            await fetch(`/api/grocery/lists?recipeKey=${encodeURIComponent(recipeKey)}`, {
                method: "DELETE",
                headers,
            });
        } catch {
            fetchList();
        } finally {
            setRemovingRecipe(null);
        }
    };

    const clearCompleted = async () => {
        setClearing(true);
        try {
            const headers = await getAuthHeaders();
            await fetch("/api/grocery/lists?completed=true", { method: "DELETE", headers });
            setItems((prev) => prev.filter((i) => !i.is_checked));
        } finally {
            setClearing(false);
        }
    };

    const clearAll = async () => {
        if (!confirm("Clear your entire grocery list?")) return;
        setClearing(true);
        try {
            const headers = await getAuthHeaders();
            await fetch("/api/grocery/lists", { method: "DELETE", headers });
            setList(null);
            setItems([]);
        } finally {
            setClearing(false);
        }
    };

    // Derive unique recipes from items
    const recipes = Array.from(
        items.reduce((map, item) => {
            if (item.recipe_key && !map.has(item.recipe_key)) {
                map.set(item.recipe_key, {
                    key: item.recipe_key,
                    title: item.recipe_title || item.recipe_key,
                    count: 0,
                    checkedCount: 0,
                });
            }
            if (item.recipe_key) {
                const r = map.get(item.recipe_key)!;
                r.count++;
                if (item.is_checked) r.checkedCount++;
            }
            return map;
        }, new Map<string, { key: string; title: string; count: number; checkedCount: number }>())
        .values()
    );

    // Group by category
    const groupedByCategory = CATEGORY_ORDER.reduce<Record<string, GroceryItem[]>>((acc, cat) => {
        const catItems = items.filter((i) => i.category === cat);
        if (catItems.length > 0) acc[cat] = catItems;
        return acc;
    }, {});

    // Group by recipe
    const groupedByRecipe = recipes.map((r) => ({
        ...r,
        items: items.filter((i) => i.recipe_key === r.key),
    }));

    const checkedCount = items.filter((i) => i.is_checked).length;
    const totalCount = items.length;
    const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
    const hasChecked = checkedCount > 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-background-muted flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-primary" strokeWidth={2} />
            </div>
        );
    }

    const renderItem = (item: GroceryItem, showRecipe = false) => (
        <li
            key={item.id}
            className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${item.is_checked ? "bg-gray-50" : "hover:bg-background-muted/40"}`}
        >
            <button
                onClick={() => toggleItem(item)}
                disabled={togglingId === item.id}
                className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    item.is_checked
                        ? "bg-primary border-primary"
                        : "border-border-gray/50 hover:border-primary"
                }`}
            >
                {item.is_checked && <Check size={13} className="text-white" strokeWidth={3} />}
            </button>

            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-tight ${item.is_checked ? "line-through text-text-medium" : "text-text-dark"}`}>
                    {item.ingredient_name}
                </p>
                {showRecipe && item.recipe_title && (
                    <p className="text-[11px] text-text-medium mt-0.5 truncate">{item.recipe_title}</p>
                )}
            </div>

            {item.quantity && (
                <span className={`text-xs font-semibold shrink-0 ${item.is_checked ? "text-text-medium/60" : "text-text-medium"}`}>
                    {item.quantity}
                </span>
            )}

            <button
                onClick={() => removeItem(item.id)}
                className="shrink-0 p-1 rounded-lg text-text-medium/40 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
                <Trash2 size={14} strokeWidth={2} />
            </button>
        </li>
    );

    return (
        <div className="min-h-screen bg-background-muted flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white border-b border-border-gray/15">
                <div className="w-full px-5 h-14 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-1.5 rounded-lg text-text-medium hover:text-text-dark transition-colors"
                    >
                        <ArrowLeft size={20} strokeWidth={2} />
                    </button>
                    <div className="flex items-center gap-2 flex-1">
                        <ShoppingCart size={18} className="text-primary shrink-0" strokeWidth={2} />
                        <h1 className="text-base font-bold text-text-dark">Grocery List</h1>
                        {totalCount > 0 && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                                {checkedCount}/{totalCount}
                            </span>
                        )}
                    </div>

                    {/* View toggle */}
                    {totalCount > 0 && (
                        <div className="flex items-center bg-background-muted rounded-lg p-0.5 text-xs font-semibold">
                            <button
                                onClick={() => setViewMode("category")}
                                className={`px-2.5 py-1 rounded-md transition-all ${viewMode === "category" ? "bg-white text-text-dark shadow-sm" : "text-text-medium"}`}
                            >
                                Category
                            </button>
                            <button
                                onClick={() => setViewMode("recipe")}
                                className={`px-2.5 py-1 rounded-md transition-all ${viewMode === "recipe" ? "bg-white text-text-dark shadow-sm" : "text-text-medium"}`}
                            >
                                Recipe
                            </button>
                        </div>
                    )}

                    {hasChecked && (
                        <button
                            onClick={clearCompleted}
                            disabled={clearing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-gray/30 text-xs font-semibold text-text-medium hover:text-text-dark hover:border-border-gray/60 transition-colors"
                        >
                            {clearing ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} strokeWidth={2.5} />}
                            Clear done
                        </button>
                    )}
                </div>

                {/* Progress bar */}
                {totalCount > 0 && (
                    <div className="h-1 bg-border-gray/20">
                        <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Recipe source pills — quick-remove a whole recipe */}
                {recipes.length > 1 && (
                    <div className="flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide border-t border-border-gray/10">
                        {recipes.map((r) => (
                            <div
                                key={r.key}
                                className="flex items-center gap-1.5 shrink-0 pl-3 pr-1.5 py-1 bg-background-muted border border-border-gray/20 rounded-full text-xs font-medium text-text-dark"
                            >
                                <span className="max-w-[140px] truncate">{r.title}</span>
                                <span className="text-text-medium">({r.count})</span>
                                <button
                                    onClick={() => removeRecipe(r.key)}
                                    disabled={removingRecipe === r.key}
                                    title={`Remove all items from ${r.title}`}
                                    className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-red-100 hover:text-red-500 text-text-medium/60 transition-colors ml-0.5"
                                >
                                    {removingRecipe === r.key
                                        ? <Loader2 size={10} className="animate-spin" />
                                        : <X size={10} strokeWidth={2.5} />
                                    }
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 pb-28">
                {totalCount === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                            <ShoppingCart size={36} className="text-primary" strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1.5">
                            <h2 className="text-xl font-bold text-text-dark">Your list is empty</h2>
                            <p className="text-sm text-text-medium max-w-xs">
                                Open any recipe and tap <span className="font-semibold">"Add to Grocery"</span> to get started.
                            </p>
                        </div>
                        <button
                            onClick={() => router.push("/home")}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark active:scale-[0.98] transition-all shadow-sm"
                        >
                            <ChefHat size={16} strokeWidth={2} />
                            Browse Recipes
                        </button>
                    </div>
                ) : viewMode === "category" ? (
                    /* ── Category view ── */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
                        {Object.entries(groupedByCategory).map(([category, catItems]) => {
                            const Icon = CATEGORY_ICONS[category] || HelpCircle;
                            const colorClass = CATEGORY_COLORS[category] || "text-gray-600 bg-gray-50";
                            const allChecked = catItems.every((i) => i.is_checked);

                            return (
                                <div key={category} className="bg-white rounded-2xl border border-border-gray/15 shadow-sm overflow-hidden">
                                    <div className={`flex items-center gap-2.5 px-4 py-3 border-b border-border-gray/10 ${allChecked ? "opacity-50" : ""}`}>
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorClass.split(" ")[1]}`}>
                                            <Icon size={14} className={colorClass.split(" ")[0]} strokeWidth={2} />
                                        </div>
                                        <span className="text-sm font-bold text-text-dark">{category}</span>
                                        <span className="text-xs text-text-medium ml-auto">
                                            {catItems.filter((i) => i.is_checked).length}/{catItems.length}
                                        </span>
                                    </div>
                                    <ul className="divide-y divide-border-gray/10">
                                        {catItems.map((item) => renderItem(item, recipes.length > 1))}
                                    </ul>
                                </div>
                            );
                        })}

                        <div className="md:col-span-2 lg:col-span-3">
                            <button
                                onClick={clearAll}
                                disabled={clearing}
                                className="w-full py-3 text-sm font-semibold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                            >
                                Clear entire list
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── Recipe view ── */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
                        {groupedByRecipe.map((r) => {
                            const allChecked = r.items.every((i) => i.is_checked);
                            return (
                                <div key={r.key} className="bg-white rounded-2xl border border-border-gray/15 shadow-sm overflow-hidden">
                                    <div className={`flex items-center gap-2.5 px-4 py-3 border-b border-border-gray/10 ${allChecked ? "opacity-50" : ""}`}>
                                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <ChefHat size={14} className="text-primary" strokeWidth={2} />
                                        </div>
                                        <span className="text-sm font-bold text-text-dark flex-1 min-w-0 truncate">{r.title}</span>
                                        <span className="text-xs text-text-medium shrink-0 mr-1">
                                            {r.checkedCount}/{r.count}
                                        </span>
                                        <button
                                            onClick={() => removeRecipe(r.key)}
                                            disabled={removingRecipe === r.key}
                                            title="Remove all items from this recipe"
                                            className="shrink-0 p-1 rounded-lg text-text-medium/40 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            {removingRecipe === r.key
                                                ? <Loader2 size={14} className="animate-spin" />
                                                : <Trash2 size={14} strokeWidth={2} />
                                            }
                                        </button>
                                    </div>
                                    <ul className="divide-y divide-border-gray/10">
                                        {r.items.map((item) => renderItem(item, false))}
                                    </ul>
                                </div>
                            );
                        })}

                        <div className="md:col-span-2 lg:col-span-3">
                            <button
                                onClick={clearAll}
                                disabled={clearing}
                                className="w-full py-3 text-sm font-semibold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                            >
                                Clear entire list
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Floating "Add more recipes" button — only when list has items */}
            {totalCount > 0 && (
                <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none">
                    <button
                        onClick={() => router.push("/home")}
                        className="pointer-events-auto flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-full font-semibold shadow-lg hover:bg-primary-dark active:scale-[0.98] transition-all"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        Add more recipes
                    </button>
                </div>
            )}
        </div>
    );
}
