import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getApiUserFromRequest } from '@/lib/api-auth'

// PATCH: toggle is_checked for an item
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getApiUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { isChecked } = await request.json()

    // Verify item belongs to this user's list
    const { data: item } = await supabaseAdmin
      .from('shopping_list_items')
      .select('id, shopping_list_id, shopping_lists!inner(user_id)')
      .eq('id', id)
      .maybeSingle()

    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

    const patchItem = item as any
    const patchListId = patchItem.shopping_list_id as string
    if (patchItem.shopping_lists?.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await supabaseAdmin
      .from('shopping_list_items')
      .update({ is_checked: isChecked })
      .eq('id', id)

    // Update completed_items count on the list
    const { count: completedCount } = await supabaseAdmin
      .from('shopping_list_items')
      .select('*', { count: 'exact', head: true })
      .eq('shopping_list_id', patchListId)
      .eq('is_checked', true)

    await supabaseAdmin
      .from('shopping_lists')
      .update({ completed_items: completedCount || 0 })
      .eq('id', patchListId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// DELETE: remove a single item
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getApiUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: item } = await supabaseAdmin
      .from('shopping_list_items')
      .select('id, shopping_list_id, shopping_lists!inner(user_id)')
      .eq('id', id)
      .maybeSingle()

    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

    const anyItem = item as any
    const listOwner = anyItem.shopping_lists?.user_id
    const listId = anyItem.shopping_list_id as string
    if (listOwner !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await supabaseAdmin
      .from('shopping_list_items')
      .delete()
      .eq('id', id)

    // Recalculate counts
    const { count: total } = await supabaseAdmin
      .from('shopping_list_items')
      .select('*', { count: 'exact', head: true })
      .eq('shopping_list_id', listId)

    const { count: completed } = await supabaseAdmin
      .from('shopping_list_items')
      .select('*', { count: 'exact', head: true })
      .eq('shopping_list_id', listId)
      .eq('is_checked', true)

    await supabaseAdmin
      .from('shopping_lists')
      .update({ total_items: total || 0, completed_items: completed || 0 })
      .eq('id', listId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
