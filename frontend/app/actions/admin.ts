'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type ActionResult = { success: true } | { success: false; error: string }

async function requireAdmin(): Promise<{ error: string } | { userId: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  type Row = { role: string }
  const { data } = (await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()) as unknown as { data: Row | null }

  if (!data || data.role !== 'admin') return { error: 'unauthorized' }
  return { userId: user.id as string }
}

// ── Businesses ────────────────────────────────────────────────────────────────

export async function createBusiness(name: string, stampsGoal: number): Promise<ActionResult> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  const { error } = (await supabaseAdmin
    .from('businesses')
    .insert({ name, stamps_goal: stampsGoal } as never)) as unknown as {
    error: { message: string } | null
  }

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/businesses')
  return { success: true }
}

export async function updateBusiness(
  id: string,
  name: string,
  stampsGoal: number,
): Promise<ActionResult> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  const { error } = (await supabaseAdmin
    .from('businesses')
    .update({ name, stamps_goal: stampsGoal } as never)
    .eq('id', id)) as unknown as { error: { message: string } | null }

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/businesses')
  return { success: true }
}

export async function deleteBusiness(id: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  const { error } = (await supabaseAdmin
    .from('businesses')
    .delete()
    .eq('id', id)) as unknown as { error: { message: string } | null }

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/businesses')
  return { success: true }
}

// ── Owner users ───────────────────────────────────────────────────────────────

export async function createOwnerUser(
  email: string,
  password: string,
  fullName: string,
  businessId: string | null,
): Promise<ActionResult> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (createError || !created.user) {
    return { success: false, error: createError?.message ?? 'create_failed' }
  }

  await (supabaseAdmin
    .from('profiles')
    .update({
      role: 'owner',
      full_name: fullName,
      ...(businessId ? { business_id: businessId } : {}),
    } as never)
    .eq('id', created.user.id) as unknown as Promise<unknown>)

  await supabaseAdmin.auth.admin.updateUserById(created.user.id, {
    user_metadata: { role_selected: true, app_role: 'owner', full_name: fullName },
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function deleteOwnerUser(userId: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function impersonateUser(
  userId: string,
): Promise<{ magicLink: string } | { error: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }

  const { data: userData, error: getUserError } =
    await supabaseAdmin.auth.admin.getUserById(userId)
  if (getUserError || !userData.user?.email) return { error: 'user_not_found' }

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: userData.user.email,
  })

  if (error || !data) return { error: error?.message ?? 'link_failed' }
  return { magicLink: data.properties.action_link }
}
