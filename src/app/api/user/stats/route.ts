import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user engagement metrics
    const { data: metrics, error } = await supabase
      .from('user_engagement_metrics')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (error) throw error

    // Get recent cooking sessions
    const { data: recentSessions } = await supabase
      .from('cooking_sessions')
      .select(`
        *,
        recipe:recipes(title, difficulty)
      `)
      .eq('user_id', authUser.id)
      .order('started_at', { ascending: false })
      .limit(5)

    // Get collection count
    const { count: collectionCount } = await supabase
      .from('recipe_collections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.id)

    return NextResponse.json({ 
      metrics,
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
