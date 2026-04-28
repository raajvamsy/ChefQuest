import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getApiUserFromRequest } from '@/lib/api-auth'
import { toRecipeKey } from '@/lib/recipe-key'

export async function POST(request: Request) {
  try {
    const {
      sessionId,
      recipeId,
      stepNumber,
      stepInstruction,
      startedAt,
      completedAt,
      estimatedDuration,
      needsRetry,
      difficultyRating
    } = await request.json()

    const user = await getApiUserFromRequest(request)
    const normalizedRecipeId = toRecipeKey(recipeId)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: stepTime, error } = await supabaseAdmin
      .from('cooking_step_times')
      .insert({
        cooking_session_id: sessionId,
        recipe_id: normalizedRecipeId,
        user_id: user.id,
        step_number: stepNumber,
        step_instruction: stepInstruction,
        started_at: startedAt,
        completed_at: completedAt,
        estimated_duration_seconds: estimatedDuration,
        needed_retry: needsRetry || false,
        difficulty_rating: difficultyRating,
        completed_successfully: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ stepTime })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      message: 'Failed to log step time' 
    }, { status: 500 })
  }
}
