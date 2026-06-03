'use server'

import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function requestPasswordReset(
  email: string,
  locale: string,
): Promise<{ success: boolean }> {
  const headersList = await headers()
  const origin = headersList.get('origin') ?? 'http://localhost:3000'
  const redirectTo = `${origin}/api/auth/callback?locale=${locale}&next=reset-password`

  const { data } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: email.trim(),
    options: { redirectTo },
  })

  const resetLink = data?.properties?.action_link

  if (resetLink) {
    await supabaseAdmin.from('contact_messages').insert({
      user_id: null,
      email: email.trim(),
      message: `PASSWORD RESET REQUEST\n\nLink: ${resetLink}`,
    } as never)
  }

  // Always return success to avoid email enumeration
  return { success: true }
}
