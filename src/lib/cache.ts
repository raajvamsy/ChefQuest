/**
 * Cache utility for storing and retrieving recipes data
 * Uses sessionStorage to persist data during the browsing session
 */

import { Recipe, RecipeDetails } from "./gemini";

const CACHE_PREFIX = "chefquest_";
const RECIPES_CACHE_KEY = `${CACHE_PREFIX}recipes`;
const RECIPE_DETAILS_CACHE_KEY = `${CACHE_PREFIX}recipe_details`;

interface RecipesCache {
  [key: string]: {
    recipes: Recipe[];
    timestamp: number;
    page: number;
  };
}

interface RecipeDetailsCache {
  [id: string]: {
    recipe: RecipeDetails;
    timestamp: number;
  };
}

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const recipeCache = {
  /**
   * Get cached recipes for a search query
   */
  getRecipes(query: string, diet?: string, language?: string): Recipe[] | null {
    if (typeof window === "undefined") return null;

    try {
      const cacheKey = this.getRecipesCacheKey(query, diet, language);
      const cached = sessionStorage.getItem(RECIPES_CACHE_KEY);
      
      if (!cached) return null;

      const cache: RecipesCache = JSON.parse(cached);
      const entry = cache[cacheKey];

      if (!entry) return null;

      // Check if cache is still valid
      if (Date.now() - entry.timestamp > CACHE_DURATION) {
        delete cache[cacheKey];
        sessionStorage.setItem(RECIPES_CACHE_KEY, JSON.stringify(cache));
        return null;
      }

      return entry.recipes;
    } catch (error) {
      return null;
    }
  },

  /**
   * Set cached recipes for a search query
   */
  setRecipes(query: string, diet: string | undefined, recipes: Recipe[], page: number = 1, language?: string): void {
    if (typeof window === "undefined") return;

    try {
      const cacheKey = this.getRecipesCacheKey(query, diet, language);
      const cached = sessionStorage.getItem(RECIPES_CACHE_KEY);
      const cache: RecipesCache = cached ? JSON.parse(cached) : {};

      cache[cacheKey] = {
        recipes,
        timestamp: Date.now(),
        page,
      };

      sessionStorage.setItem(RECIPES_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      // Silently fail
    }
  },

  /**
   * Get the current page number from cache
   */
  getRecipesPage(query: string, diet?: string, language?: string): number {
    if (typeof window === "undefined") return 1;

    try {
      const cacheKey = this.getRecipesCacheKey(query, diet, language);
      const cached = sessionStorage.getItem(RECIPES_CACHE_KEY);
      
      if (!cached) return 1;

      const cache: RecipesCache = JSON.parse(cached);
      const entry = cache[cacheKey];

      return entry?.page || 1;
    } catch (error) {
      return 1;
    }
  },

  /**
   * Get recipe details from cache
   */
  getRecipeDetails(id: string): RecipeDetails | null {
    if (typeof window === "undefined") return null;

    try {
      const cached = sessionStorage.getItem(RECIPE_DETAILS_CACHE_KEY);
      
      if (!cached) return null;

      const cache: RecipeDetailsCache = JSON.parse(cached);
      const entry = cache[id];

      if (!entry) return null;

      // Check if cache is still valid
      if (Date.now() - entry.timestamp > CACHE_DURATION) {
        delete cache[id];
        sessionStorage.setItem(RECIPE_DETAILS_CACHE_KEY, JSON.stringify(cache));
        return null;
      }

      return entry.recipe;
    } catch (error) {
      return null;
    }
  },

  /**
   * Set recipe details in cache
   */
  setRecipeDetails(id: string, recipe: RecipeDetails): void {
    if (typeof window === "undefined") return;

    try {
      const cached = sessionStorage.getItem(RECIPE_DETAILS_CACHE_KEY);
      const cache: RecipeDetailsCache = cached ? JSON.parse(cached) : {};

      cache[id] = {
        recipe,
        timestamp: Date.now(),
      };

      sessionStorage.setItem(RECIPE_DETAILS_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      // Silently fail
    }
  },

  /**
   * Clear all recipe caches
   */
  clearAll(): void {
    if (typeof window === "undefined") return;

    try {
      sessionStorage.removeItem(RECIPES_CACHE_KEY);
      sessionStorage.removeItem(RECIPE_DETAILS_CACHE_KEY);
    } catch (error) {
      // Silently fail
    }
  },

  /**
   * Generate cache key for recipes search
   */
  getRecipesCacheKey(query: string, diet?: string, language?: string): string {
    return `${query.toLowerCase()}_${diet || "all"}_${language || "en"}`;
  },
};

