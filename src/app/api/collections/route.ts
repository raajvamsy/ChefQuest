import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Get all collections for the current user
export async function GET() {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: collections, error } = await supabase
      .from('recipe_collections')
      .select(`
        *,
        recipe_collection_items (
          recipe:recipes (
            id,
            title,
            description,
            time_minutes,
            calories,
            difficulty,
            cuisine_type,
            diet_type,
            image_prompt
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ collections })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      message: 'Failed to fetch collections' 
    }, { status: 500 })
  }
}

// Create a new collection
export async function POST(request: Request) {
  try {
    const { name, description, emoji, isDefault } = await request.json()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: collection, error } = await supabase
      .from('recipe_collections')
      .insert({
        user_id: user.id,
        name,
        description,
        emoji: emoji || '📖',
        is_default: isDefault || false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ collection })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      message: 'Failed to create collection' 
    }, { status: 500 })
  }
}
