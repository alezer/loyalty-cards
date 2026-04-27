import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types/database'

// Smart home page: checks auth state and routes to the right place.
// This avoids landing on a static page that immediately redirects.
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const roleSelected = user.user_metadata?.role_selected as boolean | undefined
  if (!roleSelected) {
    redirect(`/${locale}/role-select`)
  }

  const appRole = user.user_metadata?.app_role as UserRole | undefined
  if (appRole === 'owner' || appRole === 'staff' || appRole === 'admin') {
    redirect(`/${locale}/staff/scan`)
  }

  redirect(`/${locale}/customer/qr`)
}
