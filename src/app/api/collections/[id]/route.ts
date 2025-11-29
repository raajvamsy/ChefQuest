import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Delete a collection
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('recipe_collections')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      message: 'Failed to delete collection' 
    }, { status: 500 })
  }
}

// Update a collection
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updates = await request.json()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: collection, error } = await supabase
      .from('recipe_collections')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ collection })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      message: 'Failed to update collection' 
    }, { status: 500 })
  }
}
