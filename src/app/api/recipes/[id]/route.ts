import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { geminiAgent } from '@/lib/gemini'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // 1. Try to get recipe from database
    const { data: recipe, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single()

    if (!error && recipe) {
      // Log interaction
      await logInteraction(id, 'viewed')

      return NextResponse.json({ recipe, source: 'database' })
    }

    // 2. If not in database, generate with Gemini
    // Extract title from ID (kebab-case-id format)
    const title = id.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')

    const recipeDetails = await geminiAgent.getRecipeDetails(id, title)

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
      gemini_model: 'gemini-2.5-flash',
    }, { onConflict: 'id' })

    // Log interaction
    await logInteraction(id, 'viewed')

    return NextResponse.json({ recipe: recipeDetails, source: 'ai' })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      message: 'Failed to fetch recipe details' 
    }, { status: 500 })
  }
}

async function logInteraction(recipeId: string, type: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await supabase.from('user_recipe_interactions').insert({
        user_id: user.id,
        recipe_id: recipeId,
        interaction_type: type,
        source: 'direct',
      })
    }
  } catch (error) {
    // Silently fail
  }
}
