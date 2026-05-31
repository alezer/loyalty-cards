'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, MapPin, Clock, ExternalLink, X } from 'lucide-react'
import type { BusinessOpeningHours } from '@/lib/types/database'

const RewardQRCard = dynamic(
  () => import('@/components/QRDisplay').then((m) => m.RewardQRCard),
  { ssr: false, loading: () => <div className="w-[180px] h-[180px] bg-amber-100 rounded-xl animate-pulse" /> },
)

type Tab = 'stamps' | 'news' | 'info'

interface Reward {
  id: string
  reward_code: string
}

const DAYS_ORDER = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const

export default function BusinessDetailPage() {
  const t = useTranslations('customer.business')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const businessId = params.businessId as string
  const locale = params.locale as string
  const source = searchParams.get('source')
  const fromHome = source === 'home'

  function handleBack() {
    if (source === 'stamps') {
      router.push(`/${locale}/customer/qr?tab=stamps`)
    } else {
      router.push(`/${locale}/customer/qr`)
    }
  }

  const [businessName, setBusinessName] = useState<string>('—')
  const [stampsCount, setStampsCount] = useState<number>(0)
  const [stampsGoal, setStampsGoal] = useState<number>(10)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [rewardsModalOpen, setRewardsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>(fromHome ? 'info' : 'stamps')
  const [businessAddress, setBusinessAddress] = useState<string | null>(null)
  const [businessHours, setBusinessHours] = useState<BusinessOpeningHours | null>(null)
  const [businessInstagram, setBusinessInstagram] = useState<string | null>(null)
  const [businessImageUrl, setBusinessImageUrl] = useState<string | null>(null)
  const [businessLogoUrl, setBusinessLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const fetchData = async () => {
      const { data: cardData } = await supabase
        .from('loyalty_cards')
        .select('id, stamps_count, businesses(name, stamps_goal, address, opening_hours, instagram, image_url, logo_url)')
        .eq('business_id', businessId)
        .single()

      type BizFields = {
        name: string
        stamps_goal: number
        address: string | null
        opening_hours: BusinessOpeningHours | null
        instagram: string | null
        image_url: string | null
        logo_url: string | null
      }
      const card = cardData as unknown as {
        id: string
        stamps_count: number
        businesses: BizFields | null
      } | null

      if (card) {
        const biz = card.businesses
        setBusinessName(biz?.name ?? '—')
        setStampsCount(card.stamps_count)
        setStampsGoal(biz?.stamps_goal ?? 10)
        setBusinessAddress(biz?.address ?? null)
        setBusinessHours((biz?.opening_hours as BusinessOpeningHours | null) ?? null)
        setBusinessInstagram(biz?.instagram ?? null)
        setBusinessImageUrl(biz?.image_url ?? null)
        setBusinessLogoUrl(biz?.logo_url ?? null)

        const { data: rewardData } = await supabase
          .from('rewards')
          .select('id, reward_code')
          .eq('card_id', card.id)
          .eq('is_redeemed', false)
          .order('created_at', { ascending: false })

        setRewards((rewardData as unknown as Reward[]) ?? [])
      } else {
        const { data: bizData } = await supabase
          .from('businesses')
          .select('name, stamps_goal, address, opening_hours, instagram, image_url, logo_url')
          .eq('id', businessId)
          .single()

        if (bizData) {
          const biz = bizData as unknown as {
            name: string
            stamps_goal: number
            address: string | null
            opening_hours: BusinessOpeningHours | null
            instagram: string | null
            image_url: string | null
            logo_url: string | null
          }
          setBusinessName(biz.name)
          setStampsGoal(biz.stamps_goal ?? 10)
          setBusinessAddress(biz.address)
          setBusinessHours((biz.opening_hours as BusinessOpeningHours | null))
          setBusinessInstagram(biz.instagram)
          setBusinessImageUrl(biz.image_url)
          setBusinessLogoUrl(biz.logo_url)
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [businessId])

  const cycleCount = stampsGoal
    ? stampsCount === 0
      ? 0
      : stampsCount % stampsGoal || stampsGoal
    : stampsCount
  const progress = stampsGoal ? (cycleCount / stampsGoal) * 100 : 0

  const openDays = businessHours
    ? DAYS_ORDER.filter((day) => businessHours[day] !== null).map((day) => ({
        day,
        label: t(`days.${day}`),
        time: `${businessHours[day]!.open} – ${businessHours[day]!.close}`,
      }))
    : []

  const mapsUrl = businessAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessAddress)}`
    : null

  const instagramUrl = businessInstagram
    ? `https://instagram.com/${businessInstagram.replace('@', '')}`
    : null

  const tabs: { id: Tab; label: string }[] = fromHome
    ? [
        { id: 'news', label: t('tabNews') },
        { id: 'info', label: t('tabInfo') },
      ]
    : [
        { id: 'stamps', label: t('tabStamps') },
        { id: 'news', label: t('tabNews') },
        { id: 'info', label: t('tabInfo') },
      ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">{tCommon('loading')}</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero image */}
      <div className="relative h-56 bg-gradient-to-br from-brand-400 to-brand-700 overflow-hidden">
        {businessImageUrl && (
          <img
            src={businessImageUrl}
            alt={businessName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-black/30 flex items-center justify-center text-white backdrop-blur-sm active:scale-95 transition-transform"
          aria-label={tCommon('back')}
        >
          <ChevronLeft size={20} />
        </button>
        {/* Bottom gradient overlay for text legibility */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/65 to-transparent" />
        <h1 className="absolute bottom-5 left-5 text-white text-2xl font-bold drop-shadow-md">
          {businessName}
        </h1>
        {businessLogoUrl && (
          <img
            src={businessLogoUrl}
            alt=""
            className="absolute top-4 right-4 w-14 h-14 rounded-full object-cover border-2 border-white/80 shadow-md"
          />
        )}
      </div>

      {/* Tab bar */}
      <div className="flex bg-white border-b border-gray-200">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === id
                ? 'text-brand-600 border-b-2 border-brand-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* My Stamps tab */}
        {activeTab === 'stamps' && (
          <div className="flex flex-col gap-4">
            {/* Progress card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-center mb-6">
                <div className="inline-flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-brand-600 tabular-nums">{cycleCount}</span>
                  <span className="text-2xl text-gray-400">/{stampsGoal}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{t('stampsCollected')}</p>
              </div>
              <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>0</span>
                <span>{stampsGoal}</span>
              </div>
            </div>

            {/* Rewards card */}
            {rewards.length > 0 ? (
              <button
                onClick={() => setRewardsModalOpen(true)}
                className="w-full text-left bg-amber-50 rounded-2xl p-5 border border-amber-200 hover:bg-amber-100 active:bg-amber-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-amber-900">{t('rewardsTitle')}</h3>
                    <p className="text-sm text-amber-700 mt-0.5">{t('tapToRedeem')}</p>
                  </div>
                  <span className="text-3xl font-bold text-amber-600 tabular-nums">{rewards.length}</span>
                </div>
              </button>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-400">{t('rewardsTitle')}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">{t('noRewards')}</p>
                  </div>
                  <span className="text-3xl font-bold text-gray-200 tabular-nums">0</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* News tab */}
        {activeTab === 'news' && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <p className="text-sm">{t('noNews')}</p>
          </div>
        )}

        {/* Information tab */}
        {activeTab === 'info' && (
          <div className="flex flex-col gap-4">
            {!businessAddress && openDays.length === 0 && !businessInstagram && (
              <p className="text-sm text-gray-400 text-center py-8">{t('noInfo')}</p>
            )}

            {businessAddress && (
              <div className="bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-brand-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      {t('address')}
                    </p>
                    <p className="text-sm text-gray-800">{businessAddress}</p>
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand-600 font-medium mt-2 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t('viewOnMaps')}
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {openDays.length > 0 && (
              <div className="bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100">
                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-brand-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                      {t('openingHours')}
                    </p>
                    <div className="flex flex-col gap-2">
                      {openDays.map(({ day, label, time }) => (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="text-gray-600">{label}</span>
                          <span className="text-gray-900 font-medium tabular-nums">{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {instagramUrl && (
              <div className="bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100">
                <div className="flex items-start gap-3">
                  <ExternalLink size={18} className="text-brand-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      {t('instagram')}
                    </p>
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-brand-600 font-medium hover:underline"
                    >
                      {businessInstagram}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Rewards modal */}
      {rewardsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setRewardsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{t('rewardsTitle')}</h2>
              <button
                onClick={() => setRewardsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            {rewards.map((reward) => (
              <RewardQRCard
                key={reward.id}
                rewardCode={reward.reward_code}
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
