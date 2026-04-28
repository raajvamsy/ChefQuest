import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { aiRouter } from '@/lib/ai-router'
import { buildDeterministicRecipeId } from '@/lib/recipe-id'
import { getApiUserFromRequest } from '@/lib/api-auth'

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

type DietType = 'veg' | 'non-veg'

function inferDietType(recipe: any): DietType {
  const text = `${recipe?.title || ''} ${recipe?.description || ''}`.toLowerCase()
  const nonVegKeywords = ['non-veg', 'chicken', 'mutton', 'fish', 'egg', 'prawn', 'shrimp']
  if (nonVegKeywords.some((keyword) => text.includes(keyword))) {
    return 'non-veg'
  }
  return 'veg'
}

function withDeterministicIds(recipes: any[], diet?: string | null) {
  return recipes.map((recipe) => ({
    ...recipe,
    id: buildDeterministicRecipeId(recipe.title, diet || undefined),
    diet_type: diet === 'veg' || diet === 'non-veg' ? diet : inferDietType(recipe),
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
    const authUser = await getApiUserFromRequest(request)
    const normalizedQuery = normalizeSearchText(query)
    const normalizedIngredientKey = ingredients
      .map(normalizeSearchText)
      .sort()
      .join(',')
    const cacheQueryKey = hasIngredientFilter
      ? `${normalizedQuery} | ingredients:${normalizedIngredientKey}`
      : normalizedQuery
    const dietFilter = diet ?? null

    // 1. Try to get popular recipes from database first
    if (usePopular && !hasIngredientFilter) {
      let popularQuery = supabaseAdmin
        .from('popular_recipes')
        .select('*')
        .ilike('title', `%${query}%`)
        .limit(count)
      if (dietFilter) {
        popularQuery = popularQuery.eq('diet_type', dietFilter)
      }
      const { data: popularRecipes, error: popularError } = await popularQuery

      if (!popularError && popularRecipes && popularRecipes.length >= count) {
        const searchQueryId = await logSearch(
          query,
          diet,
          popularRecipes.length,
          null,
          Date.now() - startTime,
          authUser?.id ?? null
        )
        return NextResponse.json({ 
          recipes: popularRecipes, 
          source: 'database',
          cached: true,
          searchQueryId,
        })
      }
    }

    // 2. Shared cache: only use if it has enough recipes for the requested count
    if (usePopular) {
      let sharedCacheQuery = supabaseAdmin
        .from('search_queries')
        .select('recipes_generated')
        .eq('query_text', cacheQueryKey)
        .not('recipes_generated', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
      sharedCacheQuery = dietFilter
        ? sharedCacheQuery.eq('diet_filter', dietFilter)
        : sharedCacheQuery.is('diet_filter', null)
      const { data: sharedCache, error: sharedCacheError } = await sharedCacheQuery.maybeSingle()

      const cachedRecipes = sharedCache?.recipes_generated
      console.log(`[search] shared cache has ${Array.isArray(cachedRecipes) ? cachedRecipes.length : 0} recipes, need ${count}`)
      if (!sharedCacheError && Array.isArray(cachedRecipes) && cachedRecipes.length >= count) {
        const recipes = withDeterministicIds(cachedRecipes.slice(0, count), dietFilter)
        const searchQueryId = await logSearch(
          cacheQueryKey,
          diet,
          recipes.length,
          null,
          Date.now() - startTime,
          authUser?.id ?? null
        )
        return NextResponse.json({
          recipes,
          source: 'database-shared-cache',
          cached: true,
          searchQueryId,
        })
      }

      // If cache exists but has too few recipes, purge it so next request regenerates
      if (!sharedCacheError && Array.isArray(cachedRecipes) && cachedRecipes.length > 0 && cachedRecipes.length < count) {
        let staleCacheQuery = supabaseAdmin
          .from('search_queries')
          .update({ recipes_generated: null })
          .eq('query_text', cacheQueryKey)
        staleCacheQuery = dietFilter
          ? staleCacheQuery.eq('diet_filter', dietFilter)
          : staleCacheQuery.is('diet_filter', null)
        await staleCacheQuery
      }
    }

    // 3. Check for similar recipes in database
    if (!hasIngredientFilter) {
      let existingRecipesQuery = supabaseAdmin
        .from('recipes')
        .select('*')
        .textSearch('title', query, { type: 'websearch' })
        .order('view_count', { ascending: false })
        .limit(count)
      if (dietFilter) {
        existingRecipesQuery = existingRecipesQuery.eq('diet_type', dietFilter)
      }
      const { data: existingRecipes, error: existingError } = await existingRecipesQuery

      if (!existingError && existingRecipes && existingRecipes.length >= count) {
        const searchQueryId = await logSearch(
          query,
          diet,
          existingRecipes.length,
          null,
          Date.now() - startTime,
          authUser?.id ?? null
        )
        return NextResponse.json({ 
          recipes: existingRecipes, 
          source: 'database',
          cached: false,
          searchQueryId,
        })
      }
    }

    // 4. Generate new recipes with text provider router (Groq primary, Gemini fallback)
    console.log(`[search] cache miss for "${query}", generating ${count} recipes via AI`);
    const generatedRecipesRaw = await aiRouter.searchRecipes(
      query,
      diet || undefined,
      count,
      language,
      ingredients
    )
    console.log(`[search] AI returned ${generatedRecipesRaw.length} recipes`)
    const generatedRecipes = withDeterministicIds(generatedRecipesRaw, dietFilter || undefined)
    const responseTime = Date.now() - startTime

    // 5. Store generated recipes in database
    const recipesToInsert = generatedRecipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      time_minutes: parseInt(recipe.time.replace(/\D/g, '')) || null,
      calories: parseInt(recipe.calories.replace(/\D/g, '')) || null,
      diet_type: dietFilter || null,
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
    const searchQueryId = await logSearch(
      cacheQueryKey,
      diet,
      generatedRecipes.length,
      generatedRecipes,
      responseTime,
      authUser?.id ?? null
    )

    return NextResponse.json({ 
      recipes: generatedRecipes, 
      source: 'ai',
      cached: false,
      searchQueryId,
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
  responseTime: number,
  userId: string | null
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.from('search_queries').insert({
      user_id: userId,
      query_text: query,
      diet_filter: diet,
      recipes_count: count,
      recipes_generated: recipes || undefined,
      gemini_model_used: recipes ? aiRouter.textProviderName() : null,
      response_time_ms: responseTime,
      session_id: userId ? `u:${userId}` : crypto.randomUUID(),
    }).select('id').single()
    
    if (error) {
      console.error('Failed to log search:', error)
      return null
    }
    return data?.id ?? null
  } catch (error) {
    console.error('Error in logSearch:', error)
    return null
  }
}
