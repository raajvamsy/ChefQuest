import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Get user profile
export async function GET() {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (error) throw error

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      message: 'Failed to fetch user profile' 
    }, { status: 500 })
  }
}

// Update user profile
export async function PATCH(request: Request) {
  try {
    const updates = await request.json()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({
        name: updates.name,
        diet_preference: updates.diet_preference,
        location_country: updates.location_country,
        location_city: updates.location_city,
        use_local_ingredients: updates.use_local_ingredients,
        use_metric_units: updates.use_metric_units,
        last_login_at: new Date().toISOString(),
      })
      .eq('id', authUser.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      message: 'Failed to update profile' 
    }, { status: 500 })
  }
}
