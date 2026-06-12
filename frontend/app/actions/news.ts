'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

async function uploadNewsImage(file: File, businessId: string): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const uuid = crypto.randomUUID()
  const path = `${businessId}/news/${uuid}.${ext}`

  const { error } = await supabaseAdmin.storage
    .from('business-assets')
    .upload(path, file, { upsert: false, contentType: file.type })

  if (error) return null

  const { data } = supabaseAdmin.storage.from('business-assets').getPublicUrl(path)
  return data.publicUrl
}

async function deleteNewsImage(imageUrl: string): Promise<void> {
  const marker = '/business-assets/'
  const idx = imageUrl.indexOf(marker)
  if (idx === -1) return
  const path = imageUrl.slice(idx + marker.length).split('?')[0]
  await supabaseAdmin.storage.from('business-assets').remove([path])
}

export async function createNews(
  title: string,
  description: string,
  imageFile: File | null,
): Promise<ActionResult> {
  const auth = await requireOwner()
  if ('error' in auth) return { success: false, error: auth.error }

  let imageUrl: string | null = null
  if (imageFile && imageFile.size > 0) {
    imageUrl = await uploadNewsImage(imageFile, auth.businessId)
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('business_news')
    .insert({ business_id: auth.businessId, title, description, image_url: imageUrl } as never)

  if (error) return { success: false, error: error.message }

  revalidatePath('/owner/news')
  return { success: true }
}

export async function updateNews(
  id: string,
  title: string,
  description: string,
  imageFile: File | null,
  removeImage: boolean,
): Promise<ActionResult> {
  const auth = await requireOwner()
  if ('error' in auth) return { success: false, error: auth.error }

  const supabase = await createClient()

  type Row = { image_url: string | null }
  const { data: current } = (await supabase
    .from('business_news')
    .select('image_url')
    .eq('id', id)
    .eq('business_id', auth.businessId)
    .single()) as unknown as { data: Row | null }

  const updates: Record<string, unknown> = { title, description }

  if (removeImage) {
    updates.image_url = null
    if (current?.image_url) await deleteNewsImage(current.image_url)
  } else if (imageFile && imageFile.size > 0) {
    if (current?.image_url) await deleteNewsImage(current.image_url)
    const imageUrl = await uploadNewsImage(imageFile, auth.businessId)
    updates.image_url = imageUrl
  }

  const { error } = await supabase
    .from('business_news')
    .update(updates as never)
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

  type Row = { image_url: string | null }
  const { data: current } = (await supabase
    .from('business_news')
    .select('image_url')
    .eq('id', id)
    .eq('business_id', auth.businessId)
    .single()) as unknown as { data: Row | null }

  const { error } = await supabase
    .from('business_news')
    .delete()
    .eq('id', id)
    .eq('business_id', auth.businessId)

  if (error) return { success: false, error: error.message }

  if (current?.image_url) await deleteNewsImage(current.image_url)

  revalidatePath('/owner/news')
  return { success: true }
}
