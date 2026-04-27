"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChefHat, Clock, Loader2, AlertCircle } from "lucide-react";
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
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.message || "Failed to load recipe history");
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
      <div className="min-h-screen bg-background-muted flex flex-col">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-border-gray/15">
          <div className="w-full px-4 h-14 flex items-center gap-3">
            <button
              onClick={() => router.push("/profile")}
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
              <span className="text-xs font-medium text-text-medium truncate block">Recipes Explored</span>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-10">
          {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <Loader2 size={32} className="animate-spin text-primary" strokeWidth={2} />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
                <AlertCircle size={22} className="text-error" strokeWidth={2} />
              </div>
              <p className="text-sm text-error font-medium">{error}</p>
            </div>
          ) : recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <ChefHat size={26} className="text-primary" strokeWidth={2} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-text-dark">No explored recipes yet</p>
                <p className="text-xs text-text-medium">Search and open recipes to build your history.</p>
              </div>
              <button
                onClick={() => router.push("/home")}
                className="mt-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary-dark transition-colors"
              >
                Explore Recipes
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-text-medium px-1 pb-3">{recipes.length} {recipes.length === 1 ? "recipe" : "recipes"} explored</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => router.push(`/recipes/${recipe.id}`)}
                    className="bg-white rounded-2xl border border-border-gray/20 shadow-sm p-4 text-left hover:border-primary/30 hover:shadow-md active:scale-[0.98] transition-all duration-150 flex flex-col gap-2"
                  >
                    <h2 className="text-sm font-bold text-text-dark leading-snug line-clamp-2">{recipe.title}</h2>
                    <p className="text-xs text-text-medium flex-1">{formatLastSeen(recipe.last_interacted_at)}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-border-gray/15 mt-auto">
                      <span className="text-xs text-text-medium capitalize">
                        {recipe.difficulty || "Recipe"}
                        {recipe.time_minutes ? ` · ${recipe.time_minutes}m` : ""}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                        {recipe.time_minutes && <Clock size={11} strokeWidth={2} />}
                        <span>Open</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
