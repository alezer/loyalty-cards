'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
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
}

type Tab = 'stamp' | 'rewards'

export default function CustomerQRPage() {
  const t = useTranslations('customer.qr')
  const tCommon = useTranslations('common')

  const [userId, setUserId] = useState<string | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('stamp')

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)

      // Fetch unredeemed rewards — RLS filters to this customer automatically
      const { data } = await supabase
        .from('rewards')
        .select('id, reward_code, created_at')
        .eq('is_redeemed', false)
        .order('created_at', { ascending: false })

      setRewards(data ?? [])
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{tCommon('notLoggedIn')}</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 to-white py-10 px-4">
      <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">{t('title')}</h1>

      {/* Tab bar */}
      <div className="flex max-w-xs mx-auto rounded-xl overflow-hidden border border-gray-200 mb-8">
        {(['stamp', 'rewards'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-brand-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab === 'stamp' ? t('stampTab') : `${t('rewardsTab')} (${rewards.length})`}
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

      {/* Rewards QRs */}
      {activeTab === 'rewards' && (
        <div className="flex flex-col items-center gap-6 max-w-sm mx-auto">
          {rewards.length === 0 ? (
            <p className="text-gray-400 text-sm mt-4">{t('noRewards')}</p>
          ) : (
            rewards.map((r) => (
              <RewardQRCard
                key={r.id}
                rewardCode={r.reward_code}
                expiresInLabel={t('expiresIn')}
                rewardLabel={t('rewardLabel')}
              />
            ))
          )}
        </div>
      )}
    </main>
  )
}
