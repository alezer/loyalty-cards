'use server'

import { createClient } from '@/lib/supabase/server'
import { parseQR, isQRExpired } from '@/lib/qr'
import type { UserRole, AddStampResult } from '@/lib/types/database'

export type ScanErrorCode =
  | 'qr_invalid'
  | 'qr_expired'
  | 'duplicate_scan'
  | 'unauthorized'
  | 'not_staff'
  | 'stamp_failed'
  | 'redeem_failed'
  | 'reward_not_found'
  | 'reward_already_used'

export type ScanResult =
  | {
      success: true
      type: 'stamp'
      stampsCount: number
      stampsGoal: number
      rewardAvailable: boolean
    }
  | { success: true; type: 'reward' }
  | { success: false; error: ScanErrorCode }

// Minimal shapes we need from Supabase row data
type ProfileRow = { role: UserRole; business_id: string | null }
type RewardRow = { id: string; is_redeemed: boolean }
type DbError = { message: string } | null

export async function processScan(qrString: string): Promise<ScanResult> {
  // 1. Parse and validate QR format
  const parsed = parseQR(qrString)
  if (parsed.type === 'invalid') {
    return { success: false, error: 'qr_invalid' }
  }

  // 2. Validate timestamp — reject QRs older than 5 minutes (screenshot replay guard)
  if (isQRExpired(parsed.timestamp)) {
    return { success: false, error: 'qr_expired' }
  }

  const supabase = await createClient()

  // 3. Verify caller is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'unauthorized' }
  }

  // 4. Verify caller has a staff-level role.
  // We cast because supabase-js v2 generic inference can be fragile with
  // hand-written (non-generated) Database types — the runtime shape is correct.
  const profileResult = await supabase
    .from('profiles')
    .select('role, business_id')
    .eq('id', user.id)
    .single()
  const profile = profileResult.data as ProfileRow | null

  if (!profile || !(['staff', 'owner', 'admin'] as UserRole[]).includes(profile.role)) {
    return { success: false, error: 'not_staff' }
  }

  // 5a. Stamp flow
  if (parsed.type === 'stamp') {
    if (!profile.business_id) {
      return { success: false, error: 'not_staff' }
    }

    // Use unknown cast to bypass RPC generic inference mismatch
    type RpcResponse = { data: AddStampResult | null; error: DbError }
    const { data, error } = (await supabase.rpc('add_stamp', {
      p_customer_id: parsed.customerId,
      p_business_id: profile.business_id,
    } as never)) as unknown as RpcResponse

    if (error) {
      // The trigger raises P0001 with "duplicado" when the same card was
      // stamped within the last 60 seconds.
      if (error.message.toLowerCase().includes('duplicado')) {
        return { success: false, error: 'duplicate_scan' }
      }
      return { success: false, error: 'stamp_failed' }
    }

    if (!data) return { success: false, error: 'stamp_failed' }

    return {
      success: true,
      type: 'stamp',
      stampsCount: data.stamps_count,
      stampsGoal: data.stamps_goal,
      rewardAvailable: data.reward_available,
    }
  }

  // 5b. Reward redemption flow
  if (parsed.type === 'reward') {
    // Fetch the reward first so we can give precise error messages
    type RewardFetch = { data: RewardRow | null; error: DbError }
    const { data: reward, error: fetchError } = (await supabase
      .from('rewards')
      .select('id, is_redeemed')
      .eq('reward_code', parsed.rewardCode)
      .single()) as unknown as RewardFetch

    if (fetchError || !reward) {
      return { success: false, error: 'reward_not_found' }
    }

    if (reward.is_redeemed) {
      return { success: false, error: 'reward_already_used' }
    }

    // Setting is_redeemed = true triggers fn_handle_reward_redeem which
    // auto-fills redeemed_at and staff_id_redeemer via auth.uid().
    type UpdateResponse = { error: DbError }
    const { error: updateError } = (await supabase
      .from('rewards')
      .update({ is_redeemed: true } as never)
      .eq('id', reward.id)) as unknown as UpdateResponse

    if (updateError) {
      return { success: false, error: 'redeem_failed' }
    }

    return { success: true, type: 'reward' }
  }

  return { success: false, error: 'qr_invalid' }
}
