import { setRequestLocale } from 'next-intl/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { UsersManager } from '@/components/admin/UsersManager'
import type { OwnerWithBusiness } from '@/lib/types/database'

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  type OwnerRow = {
    id: string
    email: string
    full_name: string | null
    business_id: string | null
    created_at: string
  }
  type BizRow = { id: string; name: string }

  const [ownersResult, bizResult] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, business_id, created_at')
      .eq('role', 'owner')
      .order('created_at', { ascending: false }) as unknown as Promise<{
      data: OwnerRow[] | null
    }>,
    supabaseAdmin
      .from('businesses')
      .select('id, name')
      .order('name') as unknown as Promise<{ data: BizRow[] | null }>,
  ])

  const businesses = bizResult.data ?? []
  const bizMap = new Map(businesses.map((b) => [b.id, b.name]))

  const owners: OwnerWithBusiness[] = (ownersResult.data ?? []).map((o) => ({
    id: o.id,
    email: o.email,
    full_name: o.full_name,
    business_id: o.business_id,
    business_name: o.business_id ? (bizMap.get(o.business_id) ?? null) : null,
    created_at: o.created_at,
  }))

  return <UsersManager initialOwners={owners} businesses={businesses} />
}
