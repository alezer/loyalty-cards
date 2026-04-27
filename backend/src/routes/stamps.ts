import { Hono } from 'hono'
import { authMiddleware, AuthVariables } from '../middleware/auth'
import { createUserClient } from '../lib/supabase'

export const stampsRouter = new Hono<{ Variables: AuthVariables }>()

stampsRouter.use('*', authMiddleware)

/**
 * POST /api/v1/stamps/add
 * Body: { customer_id: string, business_id: string }
 *
 * Adds a stamp to a customer's loyalty card.
 * Delegates to the add_stamp() Supabase RPC (which handles anti-fraud
 * and auto-card-creation via trigger).
 *
 * Uses the user's own JWT so that auth.uid() and RLS work correctly
 * inside the PostgreSQL function.
 */
stampsRouter.post('/add', async (c) => {
  const body = await c.req.json<{ customer_id: string; business_id: string }>()

  if (!body.customer_id || !body.business_id) {
    return c.json({ error: 'customer_id and business_id are required' }, 400)
  }

  const token = c.get('userToken') as string
  const userClient = createUserClient(token)

  const { data, error } = await userClient.rpc('add_stamp', {
    p_customer_id: body.customer_id,
    p_business_id: body.business_id,
  })

  if (error) {
    const isDuplicate = error.message.includes('Escaneo duplicado')
    return c.json({ error: error.message }, isDuplicate ? 429 : 400)
  }

  return c.json({ success: true, data })
})
