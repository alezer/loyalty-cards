import { redirect } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export const dynamic = 'force-dynamic'

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const locale = await getLocale()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  type Row = { role: string }
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()) as unknown as { data: Row | null }

  if (!profile || profile.role !== 'owner') redirect(`/${locale}/login`)

  const t = await getTranslations('owner')

  const tabs = [
    { href: '/owner/business', label: t('business.title') },
    { href: '/owner/scan', label: t('scan.title') },
  ]

  return <DashboardShell tabs={tabs}>{children}</DashboardShell>
}
