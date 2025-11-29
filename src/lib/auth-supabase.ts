/**
 * Supabase Authentication Service
 * Replaces the localStorage-based auth system
 */

import { supabase } from './supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface User {
  id: string
  name: string
  email: string
  picture?: string
  provider: "google" | "demo"
  location_country?: string
  location_city?: string
  use_local_ingredients?: boolean
  diet_preference?: string
}

export const authService = {
  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        skipBrowserRedirect: false,
      }
    })
    return { data, error }
  },

  /**
   * Demo login (for testing without OAuth)
   */
  async demoLogin() {
    // Create a demo user in Supabase
    const demoEmail = `demo-${Date.now()}@chefquest.com`
    const demoPassword = 'demo-password-123'
    
    const { data, error } = await supabase.auth.signUp({
      email: demoEmail,
      password: demoPassword,
      options: {
        data: {
          name: 'Chef Demo',
          provider: 'demo'
        }
      }
    })

    if (error) throw error

    // Create user record in database
    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        email: demoEmail,
        name: 'Chef Demo',
        picture_url: null,
      })
    }

    return data.user
  },

  /**
   * Get current user from Supabase Auth + Database
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      // Get auth user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) return null

      // Get user details from database
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (dbError || !dbUser) {
        // User doesn't exist in DB, create them
        const newUser = {
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.name || authUser.email!.split('@')[0],
          picture_url: authUser.user_metadata?.picture || authUser.user_metadata?.avatar_url,
        }

        await supabase.from('users').insert(newUser)

        return {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          picture: newUser.picture_url || undefined,
          provider: 'google'
        }
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.picture_url || undefined,
        provider: 'google',
        location_country: dbUser.location_country || undefined,
        location_city: dbUser.location_city || undefined,
        use_local_ingredients: dbUser.use_local_ingredients || undefined,
        diet_preference: dbUser.diet_preference || undefined,
      }
    } catch (error) {
      return null
    }
  },

  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<User>) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('users')
      .update({
        name: updates.name,
        location_country: updates.location_country,
        location_city: updates.location_city,
        use_local_ingredients: updates.use_local_ingredients,
        diet_preference: updates.diet_preference,
        last_login_at: new Date().toISOString(),
      })
      .eq('id', authUser.id)

    if (error) throw error
  },

  /**
   * Update user location
   */
  async updateUserLocation(latitude: number, longitude: number, country?: string, city?: string) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    await supabase
      .from('users')
      .update({
        location_lat: latitude,
        location_lng: longitude,
        location_country: country,
        location_city: city,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      .eq('id', authUser.id)
  },

  /**
   * Sign out
   */
  async signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        return false;
      }
      
      return !!session
    } catch (error) {
      return false;
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser()
        callback(user)
      } else {
        callback(null)
      }
    })
  }
}
