export function toRecipeKey(recipeId: string | null | undefined): string | null {
  if (!recipeId) return null;
  const normalized = recipeId.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

