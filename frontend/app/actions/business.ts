'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { BusinessOpeningHours } from '@/lib/types/database'

type ActionResult = { success: true } | { success: false; error: string }

const DAYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const

async function requireOwner() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  type Row = { role: string; business_id: string | null }
  const { data } = (await supabase
    .from('profiles')
    .select('role, business_id')
    .eq('id', user.id)
    .single()) as unknown as { data: Row | null }

  if (!data || data.role !== 'owner' || !data.business_id) return null
  return { supabase, businessId: data.business_id }
}

async function uploadImage(
  file: File,
  businessId: string,
  type: 'logo' | 'image',
): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${businessId}/${type}.${ext}`

  const { error } = await supabaseAdmin.storage
    .from('business-assets')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) return null

  const { data } = supabaseAdmin.storage.from('business-assets').getPublicUrl(path)
  return data.publicUrl
}

export async function saveBusinessDetails(formData: FormData): Promise<ActionResult> {
  const auth = await requireOwner()
  if (!auth) return { success: false, error: 'unauthorized' }

  const updates: Record<string, unknown> = {}

  const address = formData.get('address') as string | null
  const instagram = formData.get('instagram') as string | null
  const reward = formData.get('reward') as string | null

  updates.address = address?.trim() || null
  updates.instagram = instagram?.trim() || null
  updates.reward = reward?.trim() || null

  const hours: BusinessOpeningHours = {
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null,
    sunday: null,
  }
  for (const day of DAYS) {
    const isOpen = formData.get(`hours_${day}_is_open`) === 'true'
    if (isOpen) {
      const from = (formData.get(`hours_${day}_from`) as string) || '09:00'
      const to = (formData.get(`hours_${day}_to`) as string) || '18:00'
      hours[day] = { open: from, close: to }
    }
  }
  updates.opening_hours = hours

  const logoFile = formData.get('logo') as File | null
  if (logoFile && logoFile.size > 0) {
    const url = await uploadImage(logoFile, auth.businessId, 'logo')
    if (url) updates.logo_url = url
  }

  const imageFile = formData.get('image') as File | null
  if (imageFile && imageFile.size > 0) {
    const url = await uploadImage(imageFile, auth.businessId, 'image')
    if (url) updates.image_url = url
  }

  const { error } = await auth.supabase
    .from('businesses')
    .update(updates as never)
    .eq('id', auth.businessId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/owner/business')
  return { success: true }
}
