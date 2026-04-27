import type { Context, Next } from 'hono'
import { supabaseAdmin } from '../lib/supabase'

export interface AuthVariables {
  userId: string
  userRole: string
  businessId: string | null
  userToken: string
}

/**
 * Validates the Bearer token from the Authorization header.
 * Attaches userId, userRole, businessId, and userToken to the context.
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Authorization header missing or malformed' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, business_id')
    .eq('id', user.id)
    .single()

  c.set('userId',      user.id)
  c.set('userRole',    profile?.role     ?? 'customer')
  c.set('businessId',  profile?.business_id ?? null)
  c.set('userToken',   token)

  await next()
}
