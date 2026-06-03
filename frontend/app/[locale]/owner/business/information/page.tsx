import { getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BusinessForm } from '@/components/owner/BusinessForm'
import type { Business } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

export default async function BusinessInformationPage() {
  const locale = await getLocale()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  type Row = { role: string; business_id: string | null }
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role, business_id')
    .eq('id', user.id)
    .single()) as unknown as { data: Row | null }

  if (!profile || profile.role !== 'owner') redirect(`/${locale}/login`)

  let business: Business | null = null
  if (profile.business_id) {
    const { data } = (await supabase
      .from('businesses')
      .select('*')
      .eq('id', profile.business_id)
      .single()) as unknown as { data: Business | null }
    business = data
  }

  return (
    <BusinessForm business={business} hasNoBusiness={!profile.business_id} />
  )
}
