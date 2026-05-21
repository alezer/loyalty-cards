'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type ActionResult = { success: true } | { success: false; error: string }

async function requireOwner(): Promise<{ error: string } | { userId: string; businessId: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  type Row = { role: string; business_id: string | null }
  const { data } = (await supabase
    .from('profiles')
    .select('role, business_id')
    .eq('id', user.id)
    .single()) as unknown as { data: Row | null }

  if (!data || data.role !== 'owner') return { error: 'unauthorized' }
  return { userId: user.id as string, businessId: data.business_id }
}

export async function createStaffMember(
  email: string,
  password: string,
  fullName: string,
): Promise<ActionResult> {
  const auth = await requireOwner()
  if ('error' in auth) return { success: false, error: auth.error }
  if (!auth.businessId) return { success: false, error: 'no_business' }

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (createError || !created.user) {
    return { success: false, error: createError?.message ?? 'create_failed' }
  }

  // fn_handle_new_user trigger has already created a 'customer' profile — promote it
  await (supabaseAdmin
    .from('profiles')
    .update({ role: 'staff', business_id: auth.businessId, full_name: fullName } as never)
    .eq('id', created.user.id) as unknown as Promise<unknown>)

  await supabaseAdmin.auth.admin.updateUserById(created.user.id, {
    user_metadata: { role_selected: true, app_role: 'staff', full_name: fullName },
  })

  revalidatePath('/owner/team')
  return { success: true }
}

export async function deleteStaffMember(userId: string): Promise<ActionResult> {
  const auth = await requireOwner()
  if ('error' in auth) return { success: false, error: auth.error }
  if (!auth.businessId) return { success: false, error: 'no_business' }

  type Row = { role: string; business_id: string | null }
  const { data: target } = (await supabaseAdmin
    .from('profiles')
    .select('role, business_id')
    .eq('id', userId)
    .single()) as unknown as { data: Row | null }

  if (!target || target.role !== 'staff' || target.business_id !== auth.businessId) {
    return { success: false, error: 'not_found' }
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) return { success: false, error: error.message }

  revalidatePath('/owner/team')
  return { success: true }
}
