import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Building2, Stamp, Users } from 'lucide-react'
import type { AdminMetrics } from '@/lib/types/database'

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin.dashboard')

  // Parallel data fetch
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  type BusinessRow = { id: string; name: string; stamps_goal: number }
  type CardRow = { business_id: string; stamps_count: number }
  type StampRow = { id: string; card_id: string }
  type LoyaltyCardMap = { id: string; business_id: string }

  const [businessesResult, cardsResult, todayStampsResult, customersResult] = await Promise.all([
    supabaseAdmin.from('businesses').select('id, name, stamps_goal') as unknown as Promise<{
      data: BusinessRow[] | null
    }>,
    supabaseAdmin
      .from('loyalty_cards')
      .select('business_id, stamps_count') as unknown as Promise<{
      data: CardRow[] | null
    }>,
    supabaseAdmin
      .from('stamps_log')
      .select('id, card_id')
      .gte('created_at', todayStart.toISOString()) as unknown as Promise<{
      data: StampRow[] | null
    }>,
    supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'customer') as unknown as Promise<{ count: number | null }>,
  ])

  // Get card_id → business_id map for today's stamps
  const allCards = cardsResult.data ?? []
  const todayStampList = todayStampsResult.data ?? []

  // Resolve business_id for today's stamps
  const cardBusinessMap = new Map<string, string>()
  if (todayStampList.length > 0) {
    const cardIds = [...new Set(todayStampList.map((s) => s.card_id))]
    const { data: cardRows } = (await supabaseAdmin
      .from('loyalty_cards')
      .select('id, business_id')
      .in('id', cardIds)) as unknown as { data: LoyaltyCardMap[] | null }
    ;(cardRows ?? []).forEach((c) => cardBusinessMap.set(c.id, c.business_id))
  }

  // Aggregate
  const businesses = businessesResult.data ?? []
  const stampsByBusiness = new Map<string, number>()
  allCards.forEach((c) => {
    stampsByBusiness.set(c.business_id, (stampsByBusiness.get(c.business_id) ?? 0) + c.stamps_count)
  })

  const stampsTodayByBusiness = new Map<string, number>()
  todayStampList.forEach((s) => {
    const biz = cardBusinessMap.get(s.card_id)
    if (biz) stampsTodayByBusiness.set(biz, (stampsTodayByBusiness.get(biz) ?? 0) + 1)
  })

  const metrics: AdminMetrics = {
    totalBusinesses: businesses.length,
    stampsToday: todayStampList.length,
    totalCustomers: customersResult.count ?? 0,
    businessMetrics: businesses.map((b) => ({
      id: b.id,
      name: b.name,
      totalStamps: stampsByBusiness.get(b.id) ?? 0,
      stampsToday: stampsTodayByBusiness.get(b.id) ?? 0,
    })),
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('subtitle')}</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {t('totalBusinesses')}
            </CardTitle>
            <Building2 size={16} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{metrics.totalBusinesses}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {t('totalStampsToday')}
            </CardTitle>
            <Stamp size={16} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{metrics.stampsToday}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {t('totalUsers')}
            </CardTitle>
            <Users size={16} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{metrics.totalCustomers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-business breakdown */}
      <h2 className="text-base font-semibold text-gray-900 mb-3">{t('stampsPerBusiness')}</h2>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('business')}</TableHead>
              <TableHead className="text-right">{t('totalStamps')}</TableHead>
              <TableHead className="text-right">{t('stampsToday')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.businessMetrics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-gray-400 py-8">
                  —
                </TableCell>
              </TableRow>
            ) : (
              metrics.businessMetrics
                .sort((a, b) => b.totalStamps - a.totalStamps)
                .map((biz) => (
                  <TableRow key={biz.id}>
                    <TableCell className="font-medium">{biz.name}</TableCell>
                    <TableCell className="text-right">{biz.totalStamps}</TableCell>
                    <TableCell className="text-right">{biz.stampsToday}</TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
