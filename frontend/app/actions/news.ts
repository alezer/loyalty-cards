'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { success: true } | { success: false; error: string }

async function requireOwner(): Promise<
  { error: string } | { userId: string; businessId: string }
> {
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
  if (!data.business_id) return { error: 'no_business' }
  return { userId: user.id as string, businessId: data.business_id }
}

export async function createNews(title: string, description: string): Promise<ActionResult> {
  const auth = await requireOwner()
  if ('error' in auth) return { success: false, error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('business_news')
    .insert({ business_id: auth.businessId, title, description } as never)

  if (error) return { success: false, error: error.message }

  revalidatePath('/owner/news')
  return { success: true }
}

export async function updateNews(
  id: string,
  title: string,
  description: string,
): Promise<ActionResult> {
  const auth = await requireOwner()
  if ('error' in auth) return { success: false, error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('business_news')
    .update({ title, description } as never)
    .eq('id', id)
    .eq('business_id', auth.businessId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/owner/news')
  return { success: true }
}

export async function deleteNews(id: string): Promise<ActionResult> {
  const auth = await requireOwner()
  if ('error' in auth) return { success: false, error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('business_news')
    .delete()
    .eq('id', id)
    .eq('business_id', auth.businessId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/owner/news')
  return { success: true }
}
