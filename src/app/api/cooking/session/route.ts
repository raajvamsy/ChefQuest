import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getApiUserFromRequest, toUuidOrNull } from '@/lib/api-auth'
import { toRecipeKey } from '@/lib/recipe-key'

export async function POST(request: Request) {
  try {
    const { recipeId, originalSteps } = await request.json()
    const user = await getApiUserFromRequest(request)
    const safeRecipeId = toUuidOrNull(recipeId)
    const recipeKey = toRecipeKey(recipeId)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create cooking session
    const { data: session, error } = await supabaseAdmin
      .from('cooking_sessions')
      .insert({
        user_id: user.id,
        recipe_id: safeRecipeId,
        recipe_key: recipeKey,
        session_status: 'in_progress',
        original_steps_count: originalSteps.length,
        current_steps: originalSteps,
        total_steps: originalSteps.length,
        current_step: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Log interaction
    await supabaseAdmin.from('user_recipe_interactions').insert({
      user_id: user.id,
      recipe_id: safeRecipeId,
      recipe_key: recipeKey,
      interaction_type: 'cook_started',
      source: 'cooking_page',
    })

    return NextResponse.json({ session })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      message: 'Failed to create cooking session' 
    }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { sessionId, updates } = await request.json()
    const user = await getApiUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate duration if completing
    if (updates.session_status === 'completed' && updates.completed_at) {
      const { data: session } = await supabaseAdmin
        .from('cooking_sessions')
        .select('started_at')
        .eq('id', sessionId)
        .single()

      if (session && session.started_at) {
        const duration = Math.floor(
          (new Date(updates.completed_at).getTime() - new Date(session.started_at).getTime()) / 60000
        )
        updates.total_duration_minutes = duration
      }
    }

    const { data, error } = await supabaseAdmin
      .from('cooking_sessions')
      .update(updates)
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    // Log completion interaction
    if (updates.session_status === 'completed') {
      const { data: session } = await supabaseAdmin
        .from('cooking_sessions')
        .select('recipe_id, recipe_key')
        .eq('id', sessionId)
        .single()

      if (session) {
        await supabaseAdmin.from('user_recipe_interactions').insert({
          user_id: user.id,
          recipe_id: session.recipe_id,
          recipe_key: session.recipe_key,
          interaction_type: 'completed',
          source: 'cooking_page',
        })
      }
    }

    return NextResponse.json({ session: data })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      message: 'Failed to update cooking session' 
    }, { status: 500 })
  }
}
