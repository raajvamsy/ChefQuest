import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getApiUserFromRequest } from '@/lib/api-auth'

// ─── Category heuristics ───────────────────────────────────────────────────
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Produce: [
    'onion', 'tomato', 'garlic', 'ginger', 'potato', 'spinach', 'carrot', 'celery',
    'bell pepper', 'capsicum', 'broccoli', 'cauliflower', 'cabbage', 'lettuce', 'kale',
    'cucumber', 'zucchini', 'eggplant', 'brinjal', 'peas', 'beans', 'lemon', 'lime',
    'orange', 'apple', 'banana', 'mango', 'coriander', 'cilantro', 'parsley', 'mint',
    'basil', 'curry leaves', 'spring onion', 'scallion', 'mushroom', 'corn', 'leek',
  ],
  Dairy: [
    'milk', 'cream', 'butter', 'ghee', 'yogurt', 'curd', 'cheese', 'paneer',
    'heavy cream', 'whipping cream', 'sour cream', 'buttermilk', 'condensed milk',
  ],
  Meat: [
    'chicken', 'mutton', 'lamb', 'beef', 'pork', 'fish', 'prawn', 'shrimp',
    'crab', 'lobster', 'tuna', 'salmon', 'sardine', 'egg', 'eggs',
  ],
  Grains: [
    'rice', 'flour', 'wheat', 'bread', 'pasta', 'noodles', 'semolina', 'rava',
    'oats', 'quinoa', 'cornmeal', 'breadcrumbs', 'maida', 'besan', 'gram flour',
    'poha', 'vermicelli', 'barley',
  ],
  Spices: [
    'salt', 'pepper', 'cumin', 'coriander powder', 'turmeric', 'chili', 'chilli',
    'red chili', 'paprika', 'garam masala', 'cinnamon', 'cardamom', 'cloves',
    'bay leaf', 'mustard seeds', 'fenugreek', 'methi', 'asafoetida', 'hing',
    'nutmeg', 'saffron', 'star anise', 'fennel', 'oregano', 'thyme', 'rosemary',
    'masala', 'curry powder',
  ],
  Pantry: [
    'oil', 'olive oil', 'coconut oil', 'sunflower oil', 'sugar', 'honey',
    'vinegar', 'soy sauce', 'tamarind', 'tomato paste', 'coconut milk',
    'stock', 'broth', 'water', 'baking powder', 'baking soda', 'yeast',
    'vanilla', 'cocoa', 'chocolate', 'jam', 'sauce', 'ketchup', 'mayonnaise',
    'mustard', 'lentils', 'dal', 'chickpeas', 'kidney beans', 'black beans',
    'chana', 'moong', 'urad',
  ],
}

function assignCategory(ingredientName: string): string {
  const lower = ingredientName.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return category
  }
  return 'Other'
}

// ─── Quantity parsing & merging ────────────────────────────────────────────
function parseQuantity(raw: string): { amount: number | null; unit: string; raw: string } {
  // Handle fractions like 1/2, 3/4
  const fractionMatch = raw.match(/^(\d+)\/(\d+)/)
  if (fractionMatch) {
    const amount = parseInt(fractionMatch[1]) / parseInt(fractionMatch[2])
    const rest = raw.slice(fractionMatch[0].length).trim()
    const unit = rest.split(/\s+/)[0] || ''
    return { amount, unit: unit.toLowerCase(), raw }
  }
  const match = raw.match(/^([\d.]+)\s*(.*)/)
  if (!match) return { amount: null, unit: '', raw }
  return { amount: parseFloat(match[1]), unit: match[2].trim().toLowerCase().split(/\s+/)[0] || '', raw }
}

function mergeQuantities(existing: string, incoming: string): string {
  const a = parseQuantity(existing)
  const b = parseQuantity(incoming)
  if (
    a.amount !== null &&
    b.amount !== null &&
    a.unit === b.unit
  ) {
    const total = a.amount + b.amount
    const totalStr = Number.isInteger(total) ? String(total) : total.toFixed(1).replace(/\.0$/, '')
    return a.unit ? `${totalStr} ${a.unit}` : totalStr
  }
  // Different units — concatenate
  return `${existing} + ${incoming}`
}

// ─── GET: fetch active grocery list ───────────────────────────────────────
export async function GET(request: Request) {
  try {
    const user = await getApiUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: list } = await supabaseAdmin
      .from('shopping_lists')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!list) return NextResponse.json({ list: null, items: [] })

    const { data: items } = await supabaseAdmin
      .from('shopping_list_items')
      .select('*')
      .eq('shopping_list_id', list.id)
      .order('category')
      .order('ingredient_name')

    return NextResponse.json({ list, items: items || [] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// ─── POST: add a recipe's ingredients to the active list ──────────────────
export async function POST(request: Request) {
  try {
    const user = await getApiUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { recipeKey, recipeTitle, ingredients } = await request.json() as {
      recipeKey: string
      recipeTitle: string
      ingredients: Array<{ item: string; quantity: string }>
    }

    if (!recipeKey || !Array.isArray(ingredients)) {
      return NextResponse.json({ error: 'recipeKey and ingredients required' }, { status: 400 })
    }

    // Get or create the active list
    let { data: list } = await supabaseAdmin
      .from('shopping_lists')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!list) {
      const { data: newList, error: createError } = await supabaseAdmin
        .from('shopping_lists')
        .insert({ user_id: user.id, name: 'My Grocery List', status: 'active', total_items: 0, completed_items: 0 })
        .select()
        .single()
      if (createError) throw createError
      list = newList
    }

    // Fetch existing items for this list to enable merging
    const { data: existingItems } = await supabaseAdmin
      .from('shopping_list_items')
      .select('id, ingredient_name, quantity, unit')
      .eq('shopping_list_id', list.id)

    const existingMap = new Map<string, { id: string; quantity: string; unit: string }>(
      (existingItems || []).map((row: any) => [
        row.ingredient_name.toLowerCase().trim(),
        { id: row.id, quantity: row.quantity?.toString() || '', unit: row.unit || '' },
      ])
    )

    const toInsert: any[] = []
    const toUpdate: Array<{ id: string; quantity: string }> = []

    for (const { item, quantity } of ingredients) {
      const normalizedName = item.toLowerCase().trim()
      const category = assignCategory(item)
      const existing = existingMap.get(normalizedName)

      if (existing) {
        const merged = mergeQuantities(existing.quantity, quantity)
        toUpdate.push({ id: existing.id, quantity: merged })
      } else {
        const parsed = parseQuantity(quantity)
        toInsert.push({
          shopping_list_id: list.id,
          recipe_key: recipeKey,
          recipe_title: recipeTitle,
          ingredient_name: item,
          quantity: quantity,
          unit: parsed.unit || null,
          category,
          is_checked: false,
        })
      }
    }

    // Batch insert new items
    if (toInsert.length > 0) {
      const { error: insertError } = await (supabaseAdmin as any).from('shopping_list_items').insert(toInsert)
      if (insertError) {
        console.error('shopping_list_items insert error:', insertError)
        throw insertError
      }
    }
    // Update merged quantities
    for (const { id, quantity } of toUpdate) {
      await (supabaseAdmin as any)
        .from('shopping_list_items')
        .update({ quantity })
        .eq('id', id)
    }

    // Recalculate total_items count
    const { count } = await supabaseAdmin
      .from('shopping_list_items')
      .select('*', { count: 'exact', head: true })
      .eq('shopping_list_id', list.id)

    await supabaseAdmin
      .from('shopping_lists')
      .update({ total_items: count || 0 })
      .eq('id', list.id)

    return NextResponse.json({ success: true, listId: list.id, added: toInsert.length, merged: toUpdate.length, totalAdded: toInsert.length + toUpdate.length })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// ─── DELETE: clear the entire active list ─────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const user = await getApiUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const onlyCompleted = searchParams.get('completed') === 'true'

    const { data: list } = await supabaseAdmin
      .from('shopping_lists')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!list) return NextResponse.json({ success: true })

    if (onlyCompleted) {
      await supabaseAdmin
        .from('shopping_list_items')
        .delete()
        .eq('shopping_list_id', list.id)
        .eq('is_checked', true)
    } else {
      // Mark list as completed
      await supabaseAdmin
        .from('shopping_lists')
        .update({ status: 'completed' })
        .eq('id', list.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
