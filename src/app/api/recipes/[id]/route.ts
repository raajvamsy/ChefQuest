import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { aiRouter } from '@/lib/ai-router'

function titleFromRecipeId(recipeId: string): string {
  // Strip deterministic hash suffix (<slug>-<12hex>) when present.
  const cleanedId = recipeId.replace(/-[a-f0-9]{12}$/i, '')
  return cleanedId
    .split('-')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const language = searchParams.get('lang') || 'en'

  try {
    // 1. Try to get recipe from database
    const { data: recipe, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single()

    if (!error && recipe) {
      return NextResponse.json({ recipe, source: 'database' })
    }

    // 2. If not in database, generate with text provider router (Groq primary)
    // Extract clean human-readable title from hashed ID.
    const title = titleFromRecipeId(id)

    const recipeDetails = await aiRouter.getRecipeDetails(id, title, language)

    // 3. Store in database
    await supabase.from('recipes').upsert({
      id: recipeDetails.id,
      title: recipeDetails.title,
      description: recipeDetails.description,
      time_minutes: parseInt(recipeDetails.time.replace(/\D/g, '')) || null,
      servings: parseInt(recipeDetails.servings.replace(/\D/g, '')) || null,
      difficulty: recipeDetails.difficulty.toLowerCase(),
      ingredients: recipeDetails.ingredients,
      steps: recipeDetails.steps,
      image_prompt: recipeDetails.image_prompt,
      gemini_model: aiRouter.textProviderName(),
    }, { onConflict: 'id' })

    return NextResponse.json({ recipe: recipeDetails, source: 'ai' })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      message: 'Failed to fetch recipe details' 
    }, { status: 500 })
  }
}

