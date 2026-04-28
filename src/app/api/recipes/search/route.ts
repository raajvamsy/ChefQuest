import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { aiRouter } from '@/lib/ai-router'
import { buildDeterministicRecipeId } from '@/lib/recipe-id'
import { getApiUserFromRequest } from '@/lib/api-auth'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

type DietType = 'veg' | 'non-veg'

function inferDietType(recipe: any): DietType {
  const text = `${recipe?.title || ''} ${recipe?.description || ''}`.toLowerCase()
  const nonVegKeywords = ['non-veg', 'chicken', 'mutton', 'fish', 'egg', 'prawn', 'shrimp']
  return nonVegKeywords.some((k) => text.includes(k)) ? 'non-veg' : 'veg'
}

function withDeterministicIds(recipes: any[], diet?: string | null) {
  return recipes.map((recipe) => ({
    ...recipe,
    id: buildDeterministicRecipeId(recipe.title, diet || undefined),
    diet_type: diet === 'veg' || diet === 'non-veg' ? diet : inferDietType(recipe),
  }))
}

// ─── Step 0: Spell correction ───────────────────────────────────────────────
// Runs BEFORE any cache lookup so the corrected query is used everywhere.
// Returns { corrected, suggestions } where suggestions are 1-3 alternatives when
// the model is confident multiple reasonable corrections exist.
async function correctQuery(
  raw: string
): Promise<{ corrected: string; suggestions: string[] }> {
  if (!GROQ_API_KEY || raw.trim().length < 3) {
    return { corrected: raw, suggestions: [] }
  }
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0,
        max_tokens: 60,
        messages: [
          {
            role: 'system',
            content: `You are a food/recipe search spell-checker. 
Fix typos and transliteration errors in the food query. 
Respond with ONLY valid JSON: {"corrected":"<best correction>","suggestions":["<alt1>","<alt2>"]}
- "corrected": the single best spelling fix (same as input if no fix needed)
- "suggestions": up to 2 other plausible food names when genuinely ambiguous (usually empty [])
Examples:
"pachi oulusu" → {"corrected":"pachi pulusu","suggestions":[]}
"chiken currry" → {"corrected":"chicken curry","suggestions":[]}
"biryaani" → {"corrected":"biryani","suggestions":[]}
"pasta" → {"corrected":"pasta","suggestions":[]}
"daal makhni" → {"corrected":"dal makhani","suggestions":[]}`,
          },
          { role: 'user', content: raw },
        ],
      }),
    })
    if (!res.ok) return { corrected: raw, suggestions: [] }
    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content?.trim() || ''
    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      const corrected = (parsed.corrected || raw).trim()
      const suggestions = Array.isArray(parsed.suggestions)
        ? (parsed.suggestions as string[]).filter((s) => s && s !== corrected).slice(0, 2)
        : []
      return { corrected, suggestions }
    }
    return { corrected: raw, suggestions: [] }
  } catch {
    return { corrected: raw, suggestions: [] }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawQuery = searchParams.get('q')
  const diet = searchParams.get('diet')
  const cuisine = searchParams.get('cuisine') || null   // separate cuisine param for logging
  const language = searchParams.get('lang') || 'en'
  const usePopular = searchParams.get('usePopular') !== 'false'
  const count = Math.min(parseInt(searchParams.get('count') || '12', 10), 20)
  const ingredientsParam = searchParams.get('ingredients')
  const ingredients = (ingredientsParam || '').split(',').map((i) => i.trim()).filter(Boolean)
  const hasIngredientFilter = ingredients.length > 0

  if (!rawQuery) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 })
  }

  try {
    const startTime = Date.now()
    const authUser = await getApiUserFromRequest(request)

    // ── Step 0: Correct spelling upfront ────────────────────────────────────
    const { corrected: correctedQuery, suggestions } = await correctQuery(rawQuery)
    const query = correctedQuery           // use corrected everywhere downstream
    const wasCorrected = normalizeSearchText(correctedQuery) !== normalizeSearchText(rawQuery)

    const normalizedQuery = normalizeSearchText(query)
    const normalizedIngredientKey = ingredients.map(normalizeSearchText).sort().join(',')
    const cacheQueryKey = hasIngredientFilter
      ? `${normalizedQuery} | ingredients:${normalizedIngredientKey}`
      : normalizedQuery
    const dietFilter = diet ?? null

    // Helper that adds correction metadata to every response
    const withMeta = (body: Record<string, any>) => ({
      ...body,
      ...(wasCorrected && { correctedQuery, originalQuery: rawQuery, suggestions }),
    })

    const baseLogOpts = { rawQuery, correctedQuery: wasCorrected ? correctedQuery : null, suggestions, diet, cuisine }

    // ── Step 1: Popular recipes (DB view) ───────────────────────────────────
    if (usePopular && !hasIngredientFilter) {
      let popularQuery = supabaseAdmin
        .from('popular_recipes')
        .select('*')
        .ilike('title', `%${query}%`)
        .limit(count)
      if (dietFilter) popularQuery = popularQuery.eq('diet_type', dietFilter)
      const { data: popularRecipes, error: popularError } = await popularQuery

      if (!popularError && popularRecipes && popularRecipes.length >= count) {
        const searchQueryId = await logSearch({ ...baseLogOpts, count: popularRecipes.length, recipes: null, responseTime: Date.now() - startTime, userId: authUser?.id ?? null })
        return NextResponse.json(withMeta({ recipes: popularRecipes, source: 'database', cached: true, searchQueryId }))
      }
    }

    // ── Step 2: Shared cache ─────────────────────────────────────────────────
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
      console.log(`[search] shared cache: ${Array.isArray(cachedRecipes) ? cachedRecipes.length : 0} recipes, need ${count}`)

      if (!sharedCacheError && Array.isArray(cachedRecipes) && cachedRecipes.length >= count) {
        const recipes = withDeterministicIds(cachedRecipes.slice(0, count), dietFilter)
        const searchQueryId = await logSearch({ ...baseLogOpts, count: recipes.length, recipes: null, responseTime: Date.now() - startTime, userId: authUser?.id ?? null })
        return NextResponse.json(withMeta({ recipes, source: 'database-shared-cache', cached: true, searchQueryId }))
      }

      // Purge stale under-count cache
      if (!sharedCacheError && Array.isArray(cachedRecipes) && cachedRecipes.length > 0 && cachedRecipes.length < count) {
        let staleQ = supabaseAdmin.from('search_queries').update({ recipes_generated: null }).eq('query_text', cacheQueryKey)
        staleQ = dietFilter ? staleQ.eq('diet_filter', dietFilter) : staleQ.is('diet_filter', null)
        await staleQ
      }

      // ── Step 2b: Fuzzy cache fallback (pg_trgm similarity ≥ 0.5) ──────────
      // Catches "pachi pulusu" finding cached "pachi pullusu" etc.
      if (!hasIngredientFilter) {
        const { data: fuzzyHit, error: fuzzyError } = await (supabaseAdmin as any).rpc('find_similar_cache', {
          p_query: normalizedQuery,
          p_diet: dietFilter,
          p_min_count: count,
          p_threshold: 0.5,
        }).maybeSingle()

        if (!fuzzyError && fuzzyHit && Array.isArray(fuzzyHit.recipes_generated)) {
          const recipes = withDeterministicIds(fuzzyHit.recipes_generated.slice(0, count), dietFilter)
          const searchQueryId = await logSearch({ ...baseLogOpts, count: recipes.length, recipes: null, responseTime: Date.now() - startTime, userId: authUser?.id ?? null })
          console.log(`[search] fuzzy cache hit: "${fuzzyHit.query_text}" (score: ${(fuzzyHit.similarity_score as number)?.toFixed(2)}) for "${normalizedQuery}"`)
          // Use withMeta so banner only shows when step 0 spell-corrected the user's query
          return NextResponse.json(withMeta({ recipes, source: 'fuzzy-cache', cached: true, searchQueryId }))
        }
      }
    }

    // ── Step 3: Full-text search in recipes table ────────────────────────────
    if (!hasIngredientFilter) {
      let existingQ = supabaseAdmin
        .from('recipes').select('*')
        .textSearch('title', query, { type: 'websearch' })
        .order('view_count', { ascending: false })
        .limit(count)
      if (dietFilter) existingQ = existingQ.eq('diet_type', dietFilter)
      const { data: existingRecipes, error: existingError } = await existingQ

      if (!existingError && existingRecipes && existingRecipes.length >= count) {
        const searchQueryId = await logSearch({ ...baseLogOpts, count: existingRecipes.length, recipes: null, responseTime: Date.now() - startTime, userId: authUser?.id ?? null })
        return NextResponse.json(withMeta({ recipes: existingRecipes, source: 'database', cached: false, searchQueryId }))
      }
    }

    // ── Step 4: AI generation ────────────────────────────────────────────────
    console.log(`[search] cache miss for "${query}" (raw: "${rawQuery}"), generating ${count} recipes via AI`)
    const { recipes: generatedRecipesRaw } = await aiRouter.searchRecipes(query, diet || undefined, count, language, ingredients)
    console.log(`[search] AI returned ${generatedRecipesRaw.length} recipes`)
    const generatedRecipes = withDeterministicIds(generatedRecipesRaw, dietFilter || undefined)
    const responseTime = Date.now() - startTime

    // ── Step 5: Persist recipes ──────────────────────────────────────────────
    // Use recipe_key (slug-hash string) as conflict target; let id be auto-generated UUID
    const recipesToInsert = generatedRecipes.map((recipe) => ({
      recipe_key: recipe.id,       // slug-hash e.g. "pachi-pulusu-a1b2c3"
      title: recipe.title,
      description: recipe.description,
      time_minutes: parseInt(recipe.time.replace(/\D/g, '')) || null,
      calories: parseInt(recipe.calories.replace(/\D/g, '')) || null,
      diet_type: dietFilter || null,
      image_prompt: recipe.image_prompt,
      gemini_model: aiRouter.textProviderName(),
      gemini_temperature: 0.4,
    }))
    for (const recipe of recipesToInsert) {
      const { error } = await supabaseAdmin.from('recipes').upsert(recipe, { onConflict: 'recipe_key', ignoreDuplicates: false })
      if (error) console.error('Failed to upsert recipe:', error)
    }

    // ── Step 6: Log + shared cache ───────────────────────────────────────────
    const searchQueryId = await logSearch({ ...baseLogOpts, count: generatedRecipes.length, recipes: generatedRecipes, responseTime, userId: authUser?.id ?? null })

    return NextResponse.json(withMeta({ recipes: generatedRecipes, source: 'ai', cached: false, searchQueryId }))
  } catch (error) {
    return NextResponse.json({ error: String(error), message: 'Failed to search recipes' }, { status: 500 })
  }
}

async function logSearch(opts: {
  rawQuery: string
  correctedQuery: string | null
  suggestions: string[]
  diet: string | null
  cuisine: string | null
  count: number
  recipes: any[] | null
  responseTime: number
  userId: string | null
}): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.from('search_queries').insert({
      user_id: opts.userId,
      query_text: opts.correctedQuery ?? opts.rawQuery,
      original_query: opts.rawQuery,
      corrected_query: opts.correctedQuery,
      diet_filter: opts.diet || null,
      cuisine_filter: opts.cuisine,
      recipes_count: opts.count,
      recipes_generated: opts.recipes || undefined,
      gemini_model_used: opts.recipes ? aiRouter.textProviderName() : null,
      response_time_ms: opts.responseTime,
      session_id: opts.userId ? `u:${opts.userId}` : crypto.randomUUID(),
    }).select('id').single()
    if (error) { console.error('Failed to log search:', error); return null }
    return data?.id ?? null
  } catch (error) {
    console.error('Error in logSearch:', error)
    return null
  }
}
