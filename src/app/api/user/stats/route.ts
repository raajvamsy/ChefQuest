import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getApiUserFromRequest } from '@/lib/api-auth'

export async function GET(request: Request) {
  try {
    const authUser = await getApiUserFromRequest(request)

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user engagement metrics (materialized counters)
    const { data: metrics, error } = await supabaseAdmin
      .from('user_engagement_metrics')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (error) throw error

    // Get recent cooking sessions
    const { data: recentSessions } = await supabaseAdmin
      .from('cooking_sessions')
      .select(`
        *,
        recipe:recipes(title, difficulty)
      `)
      .eq('user_id', authUser.id)
      .order('started_at', { ascending: false })
      .limit(5)

    // Unique explored recipes from interaction keys to avoid double-counting same recipe.
    const { data: exploredRows } = await supabaseAdmin
      .from('user_recipe_interactions')
      .select('recipe_key')
      .eq('user_id', authUser.id)
      .in('interaction_type', ['viewed', 'prepare_started', 'cook_started', 'completed'])
      .not('recipe_key', 'is', null)

    const { count: completedCount } = await supabaseAdmin
      .from('cooking_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.id)
      .eq('session_status', 'completed')

    // Get collection count
    const { count: collectionCount } = await supabaseAdmin
      .from('recipe_collections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.id)

    const uniqueExploredCount = new Set(
      (exploredRows || []).map((row) => row.recipe_key).filter(Boolean)
    ).size

    const mergedMetrics = {
      ...metrics,
      // Strict unique explored count based on recipe_key (dedupes repeated opens).
      total_recipes_viewed: Math.max(uniqueExploredCount, completedCount || 0),
      total_recipes_completed: Math.max(metrics?.total_recipes_completed || 0, completedCount || 0),
    }

    return NextResponse.json({ 
      metrics: mergedMetrics,
      recentSessions: recentSessions || [],
      collectionCount: collectionCount || 0
    })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      message: 'Failed to fetch user stats' 
    }, { status: 500 })
  }
}
