"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChefHat, Clock, Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from "@/lib/supabase";

type HistoryRecipe = {
  id: string;
  title: string;
  difficulty: string | null;
  time_minutes: number | null;
  last_interacted_at: string | null;
};

function formatLastSeen(timestamp: string | null): string {
  if (!timestamp) return "Recently explored";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Recently explored";
  return `Last explored ${date.toLocaleDateString()}`;
}

export default function RecipeHistoryPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<HistoryRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setError(null);
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch("/api/user/history", {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.message || "Failed to load recipe history");
        }

        setRecipes(Array.isArray(payload?.recipes) ? payload.recipes : []);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load recipe history");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-background-light to-background-muted pb-24">
        <main className="max-w-md mx-auto px-6 pt-8 space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/profile")}
              className="w-10 h-10 rounded-full bg-white border border-border-gray/30 flex items-center justify-center"
              aria-label="Back to profile"
            >
              <ArrowLeft size={18} className="text-text-dark" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-text-dark">Recipes Explored</h1>
              <p className="text-sm text-text-medium">Your cooking history</p>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="bg-white border border-error/30 rounded-2xl p-4 text-sm text-error">
              {error}
            </div>
          ) : recipes.length === 0 ? (
            <div className="bg-white border border-border-gray/30 rounded-2xl p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <ChefHat size={20} className="text-primary" />
              </div>
              <h2 className="font-semibold text-text-dark">No explored recipes yet</h2>
              <p className="text-sm text-text-medium">Search and open recipes to build your history.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => router.push(`/recipes/${recipe.id}`)}
                  className="w-full bg-white border border-border-gray/30 rounded-2xl p-4 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-semibold text-text-dark truncate">{recipe.title}</h2>
                      <p className="text-xs text-text-medium mt-1">{formatLastSeen(recipe.last_interacted_at)}</p>
                    </div>
                    {recipe.time_minutes ? (
                      <div className="inline-flex items-center gap-1 text-xs text-text-medium shrink-0">
                        <Clock size={12} />
                        {recipe.time_minutes}m
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-text-medium capitalize">
                      {recipe.difficulty || "Recipe"}
                    </span>
                    <span className="text-xs font-semibold text-primary">Open Recipe</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
