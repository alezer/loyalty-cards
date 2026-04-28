import { NextRequest, NextResponse } from 'next/server'
import { createUserClient, getAuthToken } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getAuthToken(request.headers.get('Authorization'))
  if (!token) {
    return NextResponse.json({ error: 'Authorization header missing or invalid' }, { status: 401 })
  }

  const { id: rewardId } = await params
  const userClient = createUserClient(token)

  type RewardRow = { id: string; is_redeemed: boolean; redeemed_at: string | null }
  type QueryResult = { data: RewardRow | null; error: { message: string; code: string } | null }

  const { data, error } = (await userClient
    .from('rewards')
    .update({ is_redeemed: true } as never)
    .eq('id', rewardId)
    .eq('is_redeemed', false)
    .select()
    .single()) as unknown as QueryResult

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Reward not found or already redeemed' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, data })
}
