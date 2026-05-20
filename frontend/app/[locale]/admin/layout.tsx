import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

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

  if (!profile || profile.role !== 'admin') redirect(`/${locale}/login`)

  const t = await getTranslations('admin.nav')

  const tabs = [
    { href: '/admin/dashboard', label: t('dashboard') },
    { href: '/admin/businesses', label: t('businesses') },
    { href: '/admin/users', label: t('users') },
  ]

  return <DashboardShell tabs={tabs}>{children}</DashboardShell>
}
