import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Add recipe to collection
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: collectionId } = await params
    const { recipeId, notes } = await request.json()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify collection belongs to user
    const { data: collection } = await supabase
      .from('recipe_collections')
      .select('id')
      .eq('id', collectionId)
      .eq('user_id', user.id)
      .single()

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    const { data: item, error } = await supabase
      .from('recipe_collection_items')
      .insert({
        collection_id: collectionId,
        recipe_id: recipeId,
        user_notes: notes,
      })
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json({ 
          error: 'Recipe already in collection' 
        }, { status: 409 })
      }
      throw error
    }

    // Log interaction
    await supabase.from('user_recipe_interactions').insert({
      user_id: user.id,
      recipe_id: recipeId,
      interaction_type: 'saved',
      source: 'collection',
    })

    return NextResponse.json({ item })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      message: 'Failed to add recipe to collection' 
    }, { status: 500 })
  }
}

// Remove recipe from collection
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: collectionId } = await params
    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get('recipeId')
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !recipeId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { error } = await supabase
      .from('recipe_collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('recipe_id', recipeId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      message: 'Failed to remove recipe from collection' 
    }, { status: 500 })
  }
}
