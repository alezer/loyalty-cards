'use server'

import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function requestPasswordReset(
  email: string,
  locale: string,
): Promise<{ success: boolean }> {
  const headersList = await headers()
  const origin = headersList.get('origin') ?? 'http://localhost:3000'

  // Generate a custom UUID token stored in our own table.
  // This avoids Supabase's OTP/PKCE recovery link which has compatibility
  // issues when the project uses the @supabase/ssr PKCE flow.
  const token = crypto.randomUUID()
  const resetLink = `${origin}/${locale}/reset-password?token=${token}`

  const { error: insertError } = await supabaseAdmin
    .from('password_reset_tokens' as never)
    .insert({ email: email.trim(), token } as never)

  // Only store in contact_messages if the token was created successfully
  if (!insertError) {
    await supabaseAdmin.from('contact_messages').insert({
      user_id: null,
      email: email.trim(),
      message: `PASSWORD RESET REQUEST\n\nLink: ${resetLink}`,
    } as never)
  }

  // Always return success to avoid email enumeration
  return { success: true }
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  if (!token) return { success: false, error: 'invalid_token' }

  // Validate the token
  const { data: tokenRow } = await (supabaseAdmin
    .from('password_reset_tokens' as never)
    .select('email, expires_at, used')
    .eq('token', token)
    .single() as unknown as Promise<{
    data: { email: string; expires_at: string; used: boolean } | null
  }>)

  if (!tokenRow || tokenRow.used) {
    return { success: false, error: 'invalid_token' }
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return { success: false, error: 'invalid_token' }
  }

  // Find the auth user by email (listUsers is acceptable for a small user base)
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const user = listData?.users?.find(
    (u) => u.email?.toLowerCase() === tokenRow.email.toLowerCase(),
  )

  if (!user) {
    return { success: false, error: 'invalid_token' }
  }

  // Update the password directly via admin API — no session or PKCE needed
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })

  if (updateError) {
    return { success: false, error: 'generic' }
  }

  // Mark the token as used so it cannot be replayed
  await supabaseAdmin
    .from('password_reset_tokens' as never)
    .update({ used: true } as never)
    .eq('token', token)

  return { success: true }
}
