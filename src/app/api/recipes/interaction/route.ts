import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { recipeId, interactionType, source, searchQueryId } = await request.json()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('user_recipe_interactions')
      .insert({
        user_id: user.id,
        recipe_id: recipeId,
        interaction_type: interactionType,
        source: source || 'unknown',
        search_query_id: searchQueryId || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ interaction: data })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      message: 'Failed to log interaction' 
    }, { status: 500 })
  }
}
