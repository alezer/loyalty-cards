import { Hono } from 'hono'
import { authMiddleware, AuthVariables } from '../middleware/auth'
import { createUserClient } from '../lib/supabase'

export const rewardsRouter = new Hono<{ Variables: AuthVariables }>()

rewardsRouter.use('*', authMiddleware)

/**
 * PATCH /api/v1/rewards/:id/redeem
 *
 * Marks a reward as redeemed.
 * The trg_on_reward_redeem trigger automatically sets redeemed_at
 * and staff_id_redeemer.
 * RLS ensures only staff/owner of the same business can redeem.
 */
rewardsRouter.patch('/:id/redeem', async (c) => {
  const rewardId = c.req.param('id')
  const token    = c.get('userToken') as string
  const userClient = createUserClient(token)

  const { data, error } = await userClient
    .from('rewards')
    .update({ is_redeemed: true })
    .eq('id', rewardId)
    .eq('is_redeemed', false) // Idempotency guard
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return c.json({ error: 'Reward not found or already redeemed' }, 404)
    }
    return c.json({ error: error.message }, 400)
  }

  return c.json({ success: true, data })
})
