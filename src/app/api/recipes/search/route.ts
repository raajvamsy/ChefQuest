import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { geminiAgent } from '@/lib/gemini'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const diet = searchParams.get('diet')
  const language = searchParams.get('lang') || 'en'
  const usePopular = searchParams.get('usePopular') !== 'false'
  
  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 })
  }

  try {
    const startTime = Date.now()

    // 1. Try to get popular recipes from database first
    if (usePopular) {
      const { data: popularRecipes, error: popularError } = await supabase
        .from('popular_recipes')
        .select('*')
        .ilike('title', `%${query}%`)
        .eq('diet_type', diet || 'veg')
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

    // 2. Check for similar recipes in database
    const { data: existingRecipes, error: existingError } = await supabase
      .from('recipes')
      .select('*')
      .textSearch('title', query, { type: 'websearch' })
      .eq('diet_type', diet || 'veg')
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

    // 3. Generate new recipes with Gemini
    const generatedRecipes = await geminiAgent.searchRecipes(query, diet || undefined, 6, language)
    const responseTime = Date.now() - startTime

    // 4. Store generated recipes in database
    const recipesToInsert = generatedRecipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      time_minutes: parseInt(recipe.time.replace(/\D/g, '')) || null,
      calories: parseInt(recipe.calories.replace(/\D/g, '')) || null,
      diet_type: diet || 'veg',
      image_prompt: recipe.image_prompt,
      gemini_model: 'gemini-2.5-flash',
      gemini_temperature: 0.4,
    }))

    // Use upsert to avoid duplicates
    for (const recipe of recipesToInsert) {
      await supabase.from('recipes').upsert(recipe, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
    }

    // 5. Log search query
    await logSearch(query, diet, generatedRecipes.length, generatedRecipes, responseTime)

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
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await supabase.from('search_queries').insert({
        user_id: user.id,
        query_text: query,
        diet_filter: diet,
        recipes_count: count,
        recipes_generated: recipes || undefined,
        gemini_model_used: recipes ? 'gemini-2.5-flash' : null,
        response_time_ms: responseTime,
        session_id: user.id, // Simple session tracking
      })
    }
  } catch (error) {
    // Silently fail
  }
}
