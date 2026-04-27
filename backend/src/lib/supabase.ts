import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL           = process.env.SUPABASE_URL!
const SUPABASE_ANON_KEY      = process.env.SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_ROLE  = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE) {
  throw new Error(
    'Missing Supabase env vars. Check SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY',
  )
}

/**
 * Admin client — bypasses RLS.
 * Use ONLY for privileged server-side operations (token validation, admin actions).
 * NEVER expose this to the frontend.
 */
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/**
 * User-context client — respects RLS, honours auth.uid().
 * Pass the user's JWT so that RLS policies and auth.uid() work correctly.
 * Use this when calling RPCs that rely on auth.uid() (e.g. add_stamp).
 */
export function createUserClient(userToken: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: `Bearer ${userToken}` },
    },
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
