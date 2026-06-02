import { getLocale, getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewsManager } from '@/components/owner/NewsManager'
import type { BusinessNews } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

export default async function NewsPage() {
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

  let news: BusinessNews[] = []

  if (profile.business_id) {
    const { data } = (await supabase
      .from('business_news')
      .select('id, business_id, title, description, created_at, updated_at')
      .eq('business_id', profile.business_id)
      .order('created_at', { ascending: false })) as unknown as {
      data: BusinessNews[] | null
    }
    news = data ?? []
  }

  const t = await getTranslations('owner.news')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('subtitle')}</p>
      </div>
      <NewsManager initialNews={news} hasNoBusiness={!profile.business_id} />
    </div>
  )
}
