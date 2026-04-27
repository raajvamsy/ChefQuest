import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getApiUserFromRequest } from "@/lib/api-auth";

type HistoryRow = {
  recipe_key: string;
  last_interacted_at: string | null;
};

function titleFromRecipeKey(recipeKey: string): string {
  const cleanedKey = recipeKey.replace(/-[a-f0-9]{12}$/i, "");
  return cleanedKey
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function GET(request: Request) {
  try {
    const authUser = await getApiUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: interactions, error: interactionsError } = await supabaseAdmin
      .from("user_recipe_interactions")
      .select("recipe_key, created_at, interaction_type")
      .eq("user_id", authUser.id)
      .in("interaction_type", ["viewed", "prepare_started", "cook_started", "completed"])
      .not("recipe_key", "is", null)
      .order("created_at", { ascending: false })
      .limit(300);

    if (interactionsError) throw interactionsError;

    const deduped = new Map<string, HistoryRow>();
    for (const row of interactions || []) {
      const recipeKey = row.recipe_key;
      if (!recipeKey || deduped.has(recipeKey)) continue;
      deduped.set(recipeKey, {
        recipe_key: recipeKey,
        last_interacted_at: row.created_at || null,
      });
    }

    const recipeKeys = Array.from(deduped.keys());
    if (recipeKeys.length === 0) {
      return NextResponse.json({ recipes: [] });
    }

    const { data: recipes } = await supabaseAdmin
      .from("recipes")
      .select("id, title, difficulty, time_minutes")
      .in("id", recipeKeys);

    const recipeById = new Map((recipes || []).map((recipe) => [recipe.id, recipe]));

    const history = Array.from(deduped.values()).map((entry) => {
      const recipe = recipeById.get(entry.recipe_key);
      return {
        id: entry.recipe_key,
        title: recipe?.title || titleFromRecipeKey(entry.recipe_key),
        difficulty: recipe?.difficulty || null,
        time_minutes: recipe?.time_minutes || null,
        last_interacted_at: entry.last_interacted_at,
      };
    });

    return NextResponse.json({ recipes: history });
  } catch (error) {
    return NextResponse.json(
      {
        error: String(error),
        message: "Failed to fetch explored recipe history",
      },
      { status: 500 }
    );
  }
}
