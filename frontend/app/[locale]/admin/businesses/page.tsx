import { setRequestLocale } from 'next-intl/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { BusinessesManager } from '@/components/admin/BusinessesManager'
import type { Business, BusinessWithOwner } from '@/lib/types/database'

export default async function AdminBusinessesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  type BizRow = { id: string; name: string; stamps_goal: number; created_at: string }
  type OwnerRow = { id: string; email: string; full_name: string | null; business_id: string | null }

  const [bizResult, ownerResult] = await Promise.all([
    supabaseAdmin
      .from('businesses')
      .select('id, name, stamps_goal, created_at')
      .order('created_at', { ascending: false }) as unknown as Promise<{
      data: BizRow[] | null
    }>,
    supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, business_id')
      .eq('role', 'owner') as unknown as Promise<{ data: OwnerRow[] | null }>,
  ])

  const owners = ownerResult.data ?? []
  const ownerByBusiness = new Map(
    owners.filter((o) => o.business_id).map((o) => [o.business_id!, o]),
  )

  const businesses: BusinessWithOwner[] = (bizResult.data ?? []).map((b) => {
    const owner = ownerByBusiness.get(b.id)
    return {
      id: b.id,
      name: b.name,
      stamps_goal: b.stamps_goal,
      created_at: b.created_at,
      owner_id: owner?.id ?? null,
      owner_name: owner?.full_name ?? null,
      owner_email: owner?.email ?? null,
    }
  })

  return <BusinessesManager initialBusinesses={businesses} />
}
