import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { BusinessDetailManager } from '@/components/admin/BusinessDetailManager'
import type { OwnerWithBusiness } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

export default async function AdminBusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  type BizRow = { id: string; name: string; stamps_goal: number }
  type OwnerRow = { id: string; email: string; full_name: string | null; business_id: string | null; created_at: string }

  const [bizResult, ownersResult] = await Promise.all([
    supabaseAdmin
      .from('businesses')
      .select('id, name, stamps_goal')
      .eq('id', id)
      .single() as unknown as Promise<{ data: BizRow | null }>,
    supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, business_id, created_at')
      .eq('role', 'owner')
      .eq('business_id', id)
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: OwnerRow[] | null }>,
  ])

  if (!bizResult.data) notFound()

  const biz = bizResult.data

  const owners: OwnerWithBusiness[] = (ownersResult.data ?? []).map((o) => ({
    id: o.id,
    email: o.email,
    full_name: o.full_name,
    business_id: o.business_id,
    business_name: biz.name,
    created_at: o.created_at,
  }))

  return <BusinessDetailManager business={biz} owners={owners} />
}
