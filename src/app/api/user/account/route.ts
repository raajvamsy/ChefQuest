import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getApiUserFromRequest } from "@/lib/api-auth";

const USER_SCOPED_TABLES = [
  "user_session_metadata",
  "user_recipe_interactions",
  "search_queries",
  "recipe_serving_adjustments",
  "recipe_modifications",
  "recipe_failure_feedback",
  "shopping_lists",
  "user_kitchen_inventory",
  "user_preferences",
  "nutrition_log_entries",
  "daily_nutrition_log",
  "ingredient_substitutions",
  "kitchen_tools_identified",
  "cooking_step_times",
  "cooking_sessions",
] as const;

export async function DELETE(request: Request) {
  try {
    const authUser = await getApiUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authUser.id;

    // Cleanup collection items first since they are tied to user-owned collections.
    const { data: collections, error: collectionsError } = await supabaseAdmin
      .from("recipe_collections")
      .select("id")
      .eq("user_id", userId);
    if (collectionsError) throw collectionsError;

    const collectionIds = (collections || []).map((row) => row.id).filter(Boolean);
    if (collectionIds.length > 0) {
      const { error: collectionItemsError } = await supabaseAdmin
        .from("recipe_collection_items")
        .delete()
        .in("collection_id", collectionIds);
      if (collectionItemsError) throw collectionItemsError;
    }

    // step_validations does not carry user_id; clear by user's cooking sessions.
    const { data: sessionsForValidation, error: sessionLookupError } = await supabaseAdmin
      .from("cooking_sessions")
      .select("id")
      .eq("user_id", userId);
    if (sessionLookupError) throw sessionLookupError;

    const sessionIds = (sessionsForValidation || []).map((row) => row.id).filter(Boolean);
    if (sessionIds.length > 0) {
      const { error: validationDeleteError } = await supabaseAdmin
        .from("step_validations")
        .delete()
        .in("cooking_session_id", sessionIds);
      if (validationDeleteError) throw validationDeleteError;
    }

    // Delete rows from all user-scoped tables.
    for (const table of USER_SCOPED_TABLES) {
      const { error } = await supabaseAdmin.from(table).delete().eq("user_id", userId);
      if (error) throw error;
    }

    // Metrics/profile rows are keyed by user id.
    const { error: metricsError } = await supabaseAdmin
      .from("user_engagement_metrics")
      .delete()
      .eq("id", userId);
    if (metricsError) throw metricsError;

    const { error: userRowError } = await supabaseAdmin.from("users").delete().eq("id", userId);
    if (userRowError) throw userRowError;

    // Finally remove the auth user account itself.
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authDeleteError) throw authDeleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: String(error),
        message: "Failed to delete account",
      },
      { status: 500 }
    );
  }
}
