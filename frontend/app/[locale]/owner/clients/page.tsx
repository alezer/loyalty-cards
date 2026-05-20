import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/owner/ClientsTable'
import type { ClientWithCard } from '@/lib/types/database'

export default async function ClientsPage({
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
  if (!user) redirect(`/${locale}/login`)

  type Row = { role: string; business_id: string | null }
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role, business_id')
    .eq('id', user.id)
    .single()) as unknown as { data: Row | null }

  if (!profile || profile.role !== 'owner') redirect(`/${locale}/login`)

  let clients: ClientWithCard[] = []

  if (profile.business_id) {
    type CardRow = { id: string; customer_id: string; stamps_count: number }
    const { data: cards } = (await supabase
      .from('loyalty_cards')
      .select('id, customer_id, stamps_count')
      .eq('business_id', profile.business_id)
      .order('stamps_count', { ascending: false })) as unknown as {
      data: CardRow[] | null
    }

    if (cards && cards.length > 0) {
      const customerIds = cards.map((c) => c.customer_id)
      type ProfileRow = { id: string; email: string; full_name: string | null }
      const { data: customerProfiles } = (await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', customerIds)) as unknown as { data: ProfileRow[] | null }

      const profileMap = new Map((customerProfiles ?? []).map((p) => [p.id, p]))
      clients = cards.map((card) => {
        const p = profileMap.get(card.customer_id)
        return {
          id: card.customer_id,
          email: p?.email ?? '',
          full_name: p?.full_name ?? null,
          stamps_count: card.stamps_count,
          card_id: card.id,
        }
      })
    }
  }

  const t = await getTranslations('owner.clients')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('subtitle')}</p>
      </div>
      <ClientsTable clients={clients} locale={locale} />
    </div>
  )
}
