import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { 
      sessionId, 
      recipeId,
      stepNumber, 
      stepInstruction,
      validationResult,
      validationStatus,
      confidenceLevel,
      imageUrl,
      correctiveStepsAdded 
    } = await request.json()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Store validation result
    const { data: validation, error } = await supabase
      .from('step_validations')
      .insert({
        cooking_session_id: sessionId,
        recipe_id: recipeId,
        step_number: stepNumber,
        step_instruction: stepInstruction,
        validation_result: validationResult,
        validation_status: validationStatus,
        confidence_level: confidenceLevel,
        image_url: imageUrl,
        corrective_action_needed: validationStatus === 'fail',
        corrective_steps_added: correctiveStepsAdded || null,
        gemini_model: 'gemini-2.5-flash',
      })
      .select()
      .single()

    if (error) throw error

    // Update session validation counts
    const { data: session } = await supabase
      .from('cooking_sessions')
      .select('ai_validations_count, ai_validations_passed, ai_validations_failed')
      .eq('id', sessionId)
      .single()

    if (session) {
      await supabase
        .from('cooking_sessions')
        .update({
          ai_validations_count: (session.ai_validations_count || 0) + 1,
          ai_validations_passed: validationStatus === 'pass' 
            ? (session.ai_validations_passed || 0) + 1
            : session.ai_validations_passed,
          ai_validations_failed: validationStatus === 'fail'
            ? (session.ai_validations_failed || 0) + 1
            : session.ai_validations_failed,
          corrective_steps_added: correctiveStepsAdded 
            ? (session.ai_validations_failed || 0) + correctiveStepsAdded.length
            : session.ai_validations_failed,
        })
        .eq('id', sessionId)
    }

    return NextResponse.json({ validation })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      message: 'Failed to log validation' 
    }, { status: 500 })
  }
}
