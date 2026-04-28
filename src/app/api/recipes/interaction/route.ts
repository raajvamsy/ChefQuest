import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getApiUserFromRequest } from '@/lib/api-auth'
import { toRecipeKey } from '@/lib/recipe-key'

export async function POST(request: Request) {
  try {
    const { recipeId, interactionType, source, searchQueryId } = await request.json()
    const user = await getApiUserFromRequest(request)
    const recipeKey = toRecipeKey(recipeId)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from('user_recipe_interactions')
      .insert({
        user_id: user.id,
        recipe_id: null,
        recipe_key: recipeKey,
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
