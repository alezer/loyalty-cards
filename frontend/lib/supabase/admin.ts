import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

type AdminClient = ReturnType<typeof createClient<Database>>

let _adminClient: AdminClient | null = null

function getAdminClient(): AdminClient {
  if (!_adminClient) {
    _adminClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
  }
  return _adminClient
}

/**
 * Service-role client — bypasses RLS. Server-side only.
 * Lazily initialized so build-time module evaluation doesn't require the env var.
 */
export const supabaseAdmin: AdminClient = new Proxy({} as AdminClient, {
  get(_, prop, receiver) {
    const client = getAdminClient()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

/**
 * User-context client — respects RLS and auth.uid().
 * Pass the user's JWT extracted from the Authorization header.
 */
export function createUserClient(userToken: string) {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${userToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    },
  )
}

/** Validates a Bearer token and returns it, or null if invalid. */
export async function getAuthToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) return null
  return token
}
