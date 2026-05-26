import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types/database'
import { StaffScanClient } from './StaffScanClient'

export default async function StaffScanPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const appRole = user.user_metadata?.app_role as UserRole | undefined
  if (appRole === 'customer') {
    redirect(`/${locale}/customer/qr`)
  }
  if (appRole === 'admin') {
    redirect(`/${locale}/admin/dashboard`)
  }

  return <StaffScanClient />
}
