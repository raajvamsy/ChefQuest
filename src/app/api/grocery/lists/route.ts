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

// ─── Ingredient name normalization ────────────────────────────────────────
// Strip parenthetical qualifiers and common descriptors before matching
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s*\([^)]*\)/g, '')                     // remove (chopped), (minced), (optional), etc.
    .replace(/,\s*(optional|to taste|divided|fresh|dry|dried|ground|minced|chopped|sliced|diced|grated|trimmed|cooked|raw|whole|boneless|skinless|skin-on)\s*$/gi, '')
    .replace(/\s+(optional|to taste|divided)\s*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isSameIngredient(rawA: string, rawB: string): boolean {
  const a = normalizeIngredientName(rawA)
  const b = normalizeIngredientName(rawB)
  if (!a || !b) return false
  if (a === b) return true
  // One is a prefix extension of the other: "garlic" vs "garlic cloves", "asparagus" vs "asparagus spears"
  if (a.startsWith(b + ' ') || b.startsWith(a + ' ')) return true
  // One contains the other: "extra virgin olive oil" contains "olive oil"
  if (a.includes(b) || b.includes(a)) return true
  return false
}

// ─── Quantity parsing & merging ────────────────────────────────────────────
const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5, '¼': 0.25, '¾': 0.75,
  '⅓': 1/3, '⅔': 2/3, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
}

function parseQuantity(raw: string): { amount: number | null; unit: string } {
  if (!raw) return { amount: null, unit: '' }
  const s = raw.trim()

  // "as needed", "to taste", "pinch" — no numeric amount
  if (/^(as needed|to taste|a pinch|pinch|some|a few|handful)$/i.test(s)) {
    return { amount: null, unit: s.toLowerCase() }
  }

  // Replace unicode fractions
  let normalized = s
  for (const [sym, val] of Object.entries(UNICODE_FRACTIONS)) {
    normalized = normalized.replace(sym, ` ${val} `)
  }
  normalized = normalized.replace(/\s+/g, ' ').trim()

  // "1 1/2 cups" → 1.5 cups
  const mixedMatch = normalized.match(/^(\d+)\s+(\d+)\/(\d+)\s*(.*)/)
  if (mixedMatch) {
    const amount = parseInt(mixedMatch[1]) + parseInt(mixedMatch[2]) / parseInt(mixedMatch[3])
    const unit = mixedMatch[4].trim().toLowerCase().split(/\s+/)[0] || ''
    return { amount, unit }
  }

  // "1/2 cup"
  const fractionMatch = normalized.match(/^(\d+)\/(\d+)\s*(.*)/)
  if (fractionMatch) {
    const amount = parseInt(fractionMatch[1]) / parseInt(fractionMatch[2])
    const unit = fractionMatch[3].trim().toLowerCase().split(/\s+/)[0] || ''
    return { amount, unit }
  }

  // "2.5 cups" or "2 cups"
  const numMatch = normalized.match(/^([\d.]+)\s*(.*)/)
  if (numMatch) {
    const amount = parseFloat(numMatch[1])
    const unit = numMatch[2].trim().toLowerCase().split(/\s+/)[0] || ''
    return { amount, unit }
  }

  return { amount: null, unit: '' }
}

const UNIT_ALIASES: Record<string, string> = {
  tbsp: 'tablespoon', tablespoons: 'tablespoon', tbsps: 'tablespoon',
  tsp: 'teaspoon', teaspoons: 'teaspoon', tsps: 'teaspoon',
  cups: 'cup', c: 'cup',
  oz: 'ounce', ounces: 'ounce',
  lb: 'pound', lbs: 'pound', pounds: 'pound',
  g: 'gram', grams: 'gram', kg: 'kilogram', ml: 'milliliter', l: 'liter',
  cloves: 'clove', pieces: 'piece', slices: 'slice', sprigs: 'sprig',
}

function canonicalUnit(unit: string): string {
  const u = unit.toLowerCase().replace(/s$/, '') // basic plural strip
  return UNIT_ALIASES[unit.toLowerCase()] || UNIT_ALIASES[u] || unit.toLowerCase()
}

function formatAmount(n: number): string {
  if (Number.isInteger(n)) return String(n)
  // Try to express as a simple fraction
  const fracs: [number, string][] = [[0.5,'½'],[0.25,'¼'],[0.75,'¾'],[0.33,'⅓'],[0.67,'⅔'],[0.125,'⅛']]
  for (const [val, sym] of fracs) {
    if (Math.abs(n - val) < 0.01) return sym
    if (n > 1 && Math.abs(n - Math.floor(n) - val) < 0.01) return `${Math.floor(n)}${sym}`
  }
  return n.toFixed(1).replace(/\.0$/, '')
}

function mergeQuantities(existing: string, incoming: string): string {
  // Identical — skip duplicate
  if (existing.trim().toLowerCase() === incoming.trim().toLowerCase()) return existing

  const a = parseQuantity(existing)
  const b = parseQuantity(incoming)

  // Both "as needed" style — keep just one
  if (a.amount === null && b.amount === null) {
    return a.unit === b.unit ? a.unit : `${existing} + ${incoming}`
  }

  if (a.amount !== null && b.amount !== null) {
    const ua = canonicalUnit(a.unit)
    const ub = canonicalUnit(b.unit)
    if (ua === ub) {
      const total = a.amount + b.amount
      return ua ? `${formatAmount(total)} ${ua}` : formatAmount(total)
    }
  }

  // Different units — concatenate, but avoid exact dupe
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

    // Map normalized name → existing row for fuzzy dedup
    const existingRows: Array<{ id: string; normalizedName: string; rawName: string; quantity: string; unit: string }> =
      (existingItems || []).map((row: any) => ({
        id: row.id,
        normalizedName: normalizeIngredientName(row.ingredient_name),
        rawName: row.ingredient_name,
        quantity: row.quantity?.toString() || '',
        unit: row.unit || '',
      }))

    function findExisting(rawItem: string) {
      const normalized = normalizeIngredientName(rawItem)
      // Exact normalized match first
      const exact = existingRows.find((r) => r.normalizedName === normalized)
      if (exact) return exact
      // Fuzzy match (prefix/contains)
      return existingRows.find((r) => isSameIngredient(r.rawName, rawItem)) || null
    }

    const toInsert: any[] = []
    const toUpdate: Array<{ id: string; quantity: string }> = []

    // Track newly inserted names within this batch to avoid duplicates in the same request
    const insertedNormalized = new Set<string>()

    for (const { item, quantity } of ingredients) {
      if (!item?.trim()) continue
      const normalizedName = normalizeIngredientName(item)
      const category = assignCategory(item)
      const existing = findExisting(item)

      if (existing) {
        // Already in list — merge quantities
        const merged = mergeQuantities(existing.quantity, quantity)
        // Only queue update if quantity actually changed
        const alreadyQueued = toUpdate.find((u) => u.id === existing.id)
        if (alreadyQueued) {
          alreadyQueued.quantity = mergeQuantities(alreadyQueued.quantity, quantity)
        } else {
          toUpdate.push({ id: existing.id, quantity: merged })
        }
      } else if (!insertedNormalized.has(normalizedName)) {
        // New ingredient — use normalized name for cleaner display
        const cleanName = normalizeIngredientName(item)
          // Capitalize first letter
          .replace(/^./, (c) => c.toUpperCase())
        const parsed = parseQuantity(quantity)
        toInsert.push({
          shopping_list_id: list.id,
          recipe_key: recipeKey,
          recipe_title: recipeTitle,
          ingredient_name: cleanName || item,
          quantity: quantity,
          unit: parsed.unit || null,
          category,
          is_checked: false,
        })
        insertedNormalized.add(normalizedName)
        // Add to existingRows so subsequent items in this batch can merge into it
        existingRows.push({
          id: '__pending__',
          normalizedName,
          rawName: cleanName || item,
          quantity,
          unit: parsed.unit || '',
        })
      } else {
        // Duplicate within this batch — merge into the pending insert
        const pendingIdx = toInsert.findIndex(
          (t) => normalizeIngredientName(t.ingredient_name) === normalizedName
        )
        if (pendingIdx !== -1) {
          toInsert[pendingIdx].quantity = mergeQuantities(toInsert[pendingIdx].quantity, quantity)
        }
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
    const recipeKey = searchParams.get('recipeKey')

    const { data: list } = await supabaseAdmin
      .from('shopping_lists')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!list) return NextResponse.json({ success: true })

    if (recipeKey) {
      // Remove all items from a specific recipe
      await supabaseAdmin
        .from('shopping_list_items')
        .delete()
        .eq('shopping_list_id', list.id)
        .eq('recipe_key', recipeKey)
      // Recalculate totals
      const { count } = await supabaseAdmin
        .from('shopping_list_items')
        .select('*', { count: 'exact', head: true })
        .eq('shopping_list_id', list.id)
      await supabaseAdmin
        .from('shopping_lists')
        .update({ total_items: count || 0, completed_items: 0 })
        .eq('id', list.id)
    } else if (onlyCompleted) {
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
