import { getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TeamManager } from '@/components/owner/TeamManager'
import type { Profile } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

export default async function BusinessTeamPage() {
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

  let members: Profile[] = []

  if (profile.business_id) {
    const { data } = (await supabase
      .from('profiles')
      .select('id, email, full_name, role, business_id, created_at, updated_at')
      .eq('role', 'staff')
      .eq('business_id', profile.business_id)
      .order('created_at', { ascending: false })) as unknown as { data: Profile[] | null }
    members = data ?? []
  }

  return <TeamManager initialMembers={members} hasNoBusiness={!profile.business_id} />
}
