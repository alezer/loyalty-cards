'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Home, Stamp, QrCode, Gift, TrendingUp, X } from 'lucide-react'

const StampQRCard = dynamic(
  () => import('@/components/QRDisplay').then((m) => m.StampQRCard),
  { ssr: false, loading: () => <QRPlaceholder /> },
)

const RewardQRCard = dynamic(
  () => import('@/components/QRDisplay').then((m) => m.RewardQRCard),
  { ssr: false, loading: () => <QRPlaceholder /> },
)

function QRPlaceholder() {
  return <div className="w-[240px] h-[240px] bg-gray-100 rounded-2xl animate-pulse" />
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

type Tab = 'home' | 'stamps' | 'rewards' | 'trend'

export default function CustomerQRPage() {
  const t = useTranslations('customer.qr')
  const tCommon = useTranslations('common')
  const locale = useLocale()

  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loyaltyCards, setLoyaltyCards] = useState<LoyaltyCardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('stamps')
  const [selectedGroup, setSelectedGroup] = useState<RewardGroup | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)
      setUserName(user.user_metadata?.full_name ?? null)

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
        <Link href={`/${locale}/login`} className="text-brand-600 hover:underline font-medium">
          Login
        </Link>
      </div>
    )
  }

  const rewardGroups: RewardGroup[] = Object.values(
    rewards.reduce<Record<string, RewardGroup>>((acc, r) => {
      const bizId = r.loyalty_cards?.business_id ?? 'unknown'
      const bizName = r.loyalty_cards?.businesses?.name ?? '—'
      if (!acc[bizId]) acc[bizId] = { businessId: bizId, businessName: bizName, rewards: [] }
      acc[bizId].rewards.push(r)
      return acc
    }, {}),
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 to-white">
      {/* Scrollable content — padded so it never hides behind the floating button + navbar */}
      <div className="pb-28 pt-10 px-4">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
          {userName ? t('greeting', { name: userName }) : t('title')}
        </h1>

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
        {activeTab === 'rewards' && (
          <div className="max-w-sm mx-auto flex flex-col gap-3">
            {rewardGroups.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-4">{t('noRewards')}</p>
            ) : (
              rewardGroups.map((g) => (
                <button
                  key={g.businessId}
                  onClick={() => setSelectedGroup(g)}
                  className="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 hover:bg-amber-50 transition-colors text-left w-full"
                >
                  <span className="font-medium text-gray-900">{g.businessName}</span>
                  <span className="text-amber-600 font-semibold tabular-nums">{g.rewards.length} ×</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 overflow-visible">
        <div className="relative flex items-center h-16 max-w-lg mx-auto px-2">
          {/* Home */}
          <NavButton
            active={activeTab === 'home'}
            label={t('navHome')}
            onClick={() => setActiveTab('home')}
          >
            <Home size={20} />
          </NavButton>

          {/* My Stamps */}
          <NavButton
            active={activeTab === 'stamps'}
            label={t('navStamps')}
            onClick={() => setActiveTab('stamps')}
          >
            <Stamp size={20} />
          </NavButton>

          {/* Center spacer — the floating QR button sits here */}
          <div className="flex-1" />

          {/* Rewards */}
          <NavButton
            active={activeTab === 'rewards'}
            label={t('navRewards')}
            onClick={() => setActiveTab('rewards')}
          >
            <Gift size={20} />
          </NavButton>

          {/* Trend */}
          <NavButton
            active={activeTab === 'trend'}
            label={t('navTrend')}
            onClick={() => setActiveTab('trend')}
          >
            <TrendingUp size={20} />
          </NavButton>

          {/* Floating center QR button */}
          <button
            onClick={() => setQrModalOpen(true)}
            className="absolute left-1/2 -translate-x-1/2 -top-8 w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/40 border-4 border-white active:scale-95 transition-transform"
            aria-label={t('qrModalTitle')}
          >
            <QrCode size={28} className="text-white" />
          </button>
        </div>
      </nav>

      {/* QR stamp modal */}
      {qrModalOpen && userId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setQrModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{t('qrModalTitle')}</h2>
              <button
                onClick={() => setQrModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex justify-center">
              <StampQRCard
                customerId={userId}
                expiresInLabel={t('expiresIn')}
                showToStaffLabel={t('showToStaff')}
              />
            </div>
          </div>
        </div>
      )}

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
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X size={20} />
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

function NavButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
        active ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {children}
      <span className="text-[10px] font-medium leading-tight">{label}</span>
    </button>
  )
}
