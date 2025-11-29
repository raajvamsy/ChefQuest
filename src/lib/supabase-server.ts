/**
 * Server-Side Supabase Client
 * Uses service role key to bypass RLS for server-side operations
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Missing Supabase service role key. Server operations may be limited.')
}

// Create a supabase client with service role key for server-side operations
// This bypasses RLS and should only be used in API routes
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
