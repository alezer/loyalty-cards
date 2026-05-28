'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

// Loaded client-only: qrcode.react uses canvas/SVG APIs not available in SSR
const StampQRCard = dynamic(
  () => import('@/components/QRDisplay').then((m) => m.StampQRCard),
  { ssr: false, loading: () => <QRPlaceholder /> },
)

const RewardQRCard = dynamic(
  () => import('@/components/QRDisplay').then((m) => m.RewardQRCard),
  { ssr: false, loading: () => <QRPlaceholder /> },
)

function QRPlaceholder() {
  return (
    <div className="w-[240px] h-[240px] bg-gray-100 rounded-2xl animate-pulse" />
  )
}

interface Reward {
  id: string
  reward_code: string
  created_at: string
  loyalty_cards: { business_id: string; businesses: { name: string } | null } | null
}

interface LoyaltyCardEntry {
  business_id: string
  stamps_count: number
  businesses: { name: string; stamps_goal: number } | null
}

interface RewardGroup {
  businessId: string
  businessName: string
  rewards: Reward[]
}

type Tab = 'stamp' | 'rewards' | 'stamps'

export default function CustomerQRPage() {
  const t = useTranslations('customer.qr')
  const tCommon = useTranslations('common')
  const locale = useLocale()

  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loyaltyCards, setLoyaltyCards] = useState<LoyaltyCardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('stamp')
  const [selectedGroup, setSelectedGroup] = useState<RewardGroup | null>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)
      setUserName(user.user_metadata?.full_name ?? null)

      // Fetch unredeemed rewards with business name via loyalty_cards join
      const { data } = await supabase
        .from('rewards')
        .select('id, reward_code, created_at, loyalty_cards(business_id, businesses(name))')
        .eq('is_redeemed', false)
        .order('created_at', { ascending: false })

      setRewards((data as unknown as Reward[]) ?? [])

      const { data: cards } = await supabase
        .from('loyalty_cards')
        .select('business_id, stamps_count, businesses(name, stamps_goal)')
        .order('updated_at', { ascending: false })

      setLoyaltyCards((cards as unknown as LoyaltyCardEntry[]) ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">{tCommon('loading')}</p>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-gray-500">Login</p>
        <Link
          href={`/${locale}/login`}
          className="text-brand-600 hover:underline font-medium"
        >
          Login
        </Link>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 to-white py-10 px-4">
      <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
        {userName ? t('greeting', { name: userName }) : t('title')}
      </h1>

      {/* Tab bar */}
      <div className="flex max-w-sm mx-auto rounded-xl overflow-hidden border border-gray-200 mb-8">
        {(['stamp', 'rewards', 'stamps'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-brand-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab === 'stamp'
              ? t('stampTab')
              : tab === 'rewards'
                ? `${t('rewardsTab')} (${rewards.length})`
                : t('stampsTab')}
          </button>
        ))}
      </div>

      {/* Stamp QR */}
      {activeTab === 'stamp' && (
        <div className="flex justify-center">
          <StampQRCard
            customerId={userId}
            expiresInLabel={t('expiresIn')}
            showToStaffLabel={t('showToStaff')}
          />
        </div>
      )}

      {/* My Stamps */}
      {activeTab === 'stamps' && (
        <div className="max-w-sm mx-auto flex flex-col gap-3">
          {loyaltyCards.length === 0 ? (
            <p className="text-gray-400 text-sm text-center mt-4">{t('noStamps')}</p>
          ) : (
            loyaltyCards.map((card) => {
              const goal = card.businesses?.stamps_goal
              const cycleCount = goal
                ? card.stamps_count % goal || goal
                : card.stamps_count
              return (
                <div
                  key={card.business_id}
                  className="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100"
                >
                  <span className="font-medium text-gray-900">{card.businesses?.name ?? '—'}</span>
                  <span className="text-brand-600 font-semibold tabular-nums">
                    {cycleCount}/{goal ?? '?'}
                  </span>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Rewards — business list */}
      {activeTab === 'rewards' && (() => {
        const groups: RewardGroup[] = Object.values(
          rewards.reduce<Record<string, RewardGroup>>((acc, r) => {
            const bizId = r.loyalty_cards?.business_id ?? 'unknown'
            const bizName = r.loyalty_cards?.businesses?.name ?? '—'
            if (!acc[bizId]) acc[bizId] = { businessId: bizId, businessName: bizName, rewards: [] }
            acc[bizId].rewards.push(r)
            return acc
          }, {}),
        )

        return (
          <div className="max-w-sm mx-auto flex flex-col gap-3">
            {groups.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-4">{t('noRewards')}</p>
            ) : (
              groups.map((g) => (
                <button
                  key={g.businessId}
                  onClick={() => setSelectedGroup(g)}
                  className="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 hover:bg-amber-50 transition-colors text-left w-full"
                >
                  <span className="font-medium text-gray-900">{g.businessName}</span>
                  <span className="text-amber-600 font-semibold tabular-nums">
                    {g.rewards.length} ×
                  </span>
                </button>
              ))
            )}
          </div>
        )
      })()}

      {/* Reward modal */}
      {selectedGroup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setSelectedGroup(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{selectedGroup.businessName}</h2>
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {selectedGroup.rewards.map((r) => (
              <RewardQRCard
                key={r.id}
                rewardCode={r.reward_code}
                expiresInLabel={t('expiresIn')}
                rewardLabel={t('rewardLabel')}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
