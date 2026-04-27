import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-server'
import { aiRouter } from '@/lib/ai-router'
import { buildDeterministicRecipeId } from '@/lib/recipe-id'

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function withDeterministicIds(recipes: any[], diet?: string | null) {
  return recipes.map((recipe) => ({
    ...recipe,
    id: buildDeterministicRecipeId(recipe.title, diet || undefined),
  }))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const diet = searchParams.get('diet')
  const language = searchParams.get('lang') || 'en'
  const usePopular = searchParams.get('usePopular') !== 'false'
  const count = Math.min(parseInt(searchParams.get('count') || '12', 10), 20)
  const ingredientsParam = searchParams.get('ingredients')
  const ingredients = (ingredientsParam || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  const hasIngredientFilter = ingredients.length > 0
  
  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 })
  }

  try {
    const startTime = Date.now()
    const normalizedQuery = normalizeSearchText(query)
    const normalizedIngredientKey = ingredients
      .map(normalizeSearchText)
      .sort()
      .join(',')
    const cacheQueryKey = hasIngredientFilter
      ? `${normalizedQuery} | ingredients:${normalizedIngredientKey}`
      : normalizedQuery
    const dietFilter = diet || 'veg'

    // 1. Try to get popular recipes from database first
    if (usePopular && !hasIngredientFilter) {
      const { data: popularRecipes, error: popularError } = await supabaseAdmin
        .from('popular_recipes')
        .select('*')
        .ilike('title', `%${query}%`)
        .eq('diet_type', dietFilter)
        .limit(5)

      if (!popularError && popularRecipes && popularRecipes.length >= 3) {
        // Log the search
        await logSearch(query, diet, popularRecipes.length, null, Date.now() - startTime)
        
        return NextResponse.json({ 
          recipes: popularRecipes, 
          source: 'database',
          cached: true
        })
      }
    }

    // 2. Shared cache: return previously AI-generated full recipe list from DB.
    if (usePopular) {
      const { data: sharedCache, error: sharedCacheError } = await supabaseAdmin
        .from('search_queries')
        .select('recipes_generated')
        .eq('query_text', cacheQueryKey)
        .eq('diet_filter', dietFilter)
        .not('recipes_generated', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const cachedRecipes = sharedCache?.recipes_generated
      if (!sharedCacheError && Array.isArray(cachedRecipes) && cachedRecipes.length > 0) {
        const recipes = withDeterministicIds(cachedRecipes, dietFilter)
        await logSearch(cacheQueryKey, diet, recipes.length, null, Date.now() - startTime)
        return NextResponse.json({
          recipes,
          source: 'database-shared-cache',
          cached: true,
        })
      }
    }

    // 3. Check for similar recipes in database
    if (!hasIngredientFilter) {
      const { data: existingRecipes, error: existingError } = await supabaseAdmin
        .from('recipes')
        .select('*')
        .textSearch('title', query, { type: 'websearch' })
        .eq('diet_type', dietFilter)
        .order('view_count', { ascending: false })
        .limit(5)

      if (!existingError && existingRecipes && existingRecipes.length >= 3) {
        await logSearch(query, diet, existingRecipes.length, null, Date.now() - startTime)
        
        return NextResponse.json({ 
          recipes: existingRecipes, 
          source: 'database',
          cached: false
        })
      }
    }

    // 4. Generate new recipes with text provider router (Groq primary, Gemini fallback)
    const generatedRecipesRaw = await aiRouter.searchRecipes(
      query,
      diet || undefined,
      count,
      language,
      ingredients
    )
    const generatedRecipes = withDeterministicIds(generatedRecipesRaw, dietFilter)
    const responseTime = Date.now() - startTime

    // 5. Store generated recipes in database
    const recipesToInsert = generatedRecipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      time_minutes: parseInt(recipe.time.replace(/\D/g, '')) || null,
      calories: parseInt(recipe.calories.replace(/\D/g, '')) || null,
      diet_type: dietFilter,
      image_prompt: recipe.image_prompt,
      gemini_model: aiRouter.textProviderName(),
      gemini_temperature: 0.4,
    }))

    // Use upsert to avoid duplicates - use admin client to bypass RLS
    for (const recipe of recipesToInsert) {
      const { error } = await supabaseAdmin.from('recipes').upsert(recipe, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      if (error) {
        console.error('Failed to upsert recipe:', error)
      }
    }

    // 6. Log search query + persist full generated recipe payload as shared cache.
    await logSearch(cacheQueryKey, diet, generatedRecipes.length, generatedRecipes, responseTime)

    return NextResponse.json({ 
      recipes: generatedRecipes, 
      source: 'ai',
      cached: false
    })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      message: 'Failed to search recipes' 
    }, { status: 500 })
  }
}

async function logSearch(
  query: string, 
  diet: string | null, 
  count: number, 
  recipes: any[] | null,
  responseTime: number
) {
  try {
    // Try to get user from auth header
    const { data: { user } } = await supabase.auth.getUser()
    
    // Log search with or without user_id (allow anonymous searches)
    const { error } = await supabaseAdmin.from('search_queries').insert({
      user_id: user?.id || null,
      query_text: query,
      diet_filter: diet,
      recipes_count: count,
      recipes_generated: recipes || undefined,
      gemini_model_used: recipes ? aiRouter.textProviderName() : null,
      response_time_ms: responseTime,
      session_id: user?.id || null,
    })
    
    if (error) {
      console.error('Failed to log search:', error)
    }
  } catch (error) {
    console.error('Error in logSearch:', error)
  }
}
