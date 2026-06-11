'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronDown, ChevronRight, MapPin, Clock, ExternalLink, X, Home, Stamp, QrCode, Gift, Heart } from 'lucide-react'
import type { BusinessOpeningHours, BusinessNews } from '@/lib/types/database'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

const RewardQRCard = dynamic(
  () => import('@/components/QRDisplay').then((m) => m.RewardQRCard),
  { ssr: false, loading: () => <div className="w-[180px] h-[180px] bg-brand-100 rounded-xl animate-pulse" /> },
)

const StampQRCard = dynamic(
  () => import('@/components/QRDisplay').then((m) => m.StampQRCard),
  { ssr: false, loading: () => <div className="w-[240px] h-[240px] bg-gray-100 rounded-2xl animate-pulse" /> },
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
  const tQr = useTranslations('customer.qr')
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const businessId = params.businessId as string
  const locale = params.locale as string
  const source = searchParams.get('source')
  const fromHome = source === 'home'

  function handleBack() {
    if (source === 'rewards') {
      router.push(`/${locale}/customer/qr?tab=rewards`)
    } else {
      router.push(`/${locale}/customer/qr`)
    }
  }

  const [businessName, setBusinessName] = useState<string>('—')
  const [stampsCount, setStampsCount] = useState<number>(0)
  const [stampsGoal, setStampsGoal] = useState<number>(10)
  const [businessReward, setBusinessReward] = useState<string | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [rewardsModalOpen, setRewardsModalOpen] = useState(false)
  const [currentRewardIndex, setCurrentRewardIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>(fromHome ? 'info' : 'stamps')
  const touchStartXRef = useRef<number | null>(null)
  const [businessAddress, setBusinessAddress] = useState<string | null>(null)
  const [businessHours, setBusinessHours] = useState<BusinessOpeningHours | null>(null)
  const [businessInstagram, setBusinessInstagram] = useState<string | null>(null)
  const [businessImageUrl, setBusinessImageUrl] = useState<string | null>(null)
  const [businessLogoUrl, setBusinessLogoUrl] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [cardId, setCardId] = useState<string | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [news, setNews] = useState<BusinessNews[]>([])
  const [expandedNews, setExpandedNews] = useState<Set<string>>(new Set())
  const [hasUnreadNews, setHasUnreadNews] = useState(false)
  const [isFavourite, setIsFavourite] = useState(false)
  const activeTabRef = useRef<Tab>(activeTab)

  useEffect(() => {
    activeTabRef.current = activeTab
    if (activeTab === 'news') setHasUnreadNews(false)
  }, [activeTab])

  function toggleNews(id: string) {
    setExpandedNews((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    const supabase = createClient()

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      const { data: cardData } = await supabase
        .from('loyalty_cards')
        .select('id, stamps_count, businesses(name, stamps_goal, reward, address, opening_hours, instagram, image_url, logo_url)')
        .eq('business_id', businessId)
        .single()

      type BizFields = {
        name: string
        stamps_goal: number
        reward: string | null
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
        setCardId(card.id)
        setBusinessName(biz?.name ?? '—')
        setStampsCount(card.stamps_count)
        setStampsGoal(biz?.stamps_goal ?? 10)
        setBusinessReward(biz?.reward ?? null)
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

        if (fromHome && (card.stamps_count > 0 || (rewardData && rewardData.length > 0))) {
          setActiveTab('stamps')
        }
      } else {
        const { data: bizData } = await supabase
          .from('businesses')
          .select('name, stamps_goal, reward, address, opening_hours, instagram, image_url, logo_url')
          .eq('id', businessId)
          .single()

        if (bizData) {
          const biz = bizData as unknown as {
            name: string
            stamps_goal: number
            reward: string | null
            address: string | null
            opening_hours: BusinessOpeningHours | null
            instagram: string | null
            image_url: string | null
            logo_url: string | null
          }
          setBusinessName(biz.name)
          setStampsGoal(biz.stamps_goal ?? 10)
          setBusinessReward(biz.reward ?? null)
          setBusinessAddress(biz.address)
          setBusinessHours((biz.opening_hours as BusinessOpeningHours | null))
          setBusinessInstagram(biz.instagram)
          setBusinessImageUrl(biz.image_url)
          setBusinessLogoUrl(biz.logo_url)
        }
      }

      const [{ data: newsData }, { data: favData }] = await Promise.all([
        supabase
          .from('business_news')
          .select('id, business_id, title, description, created_at, updated_at')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false }),
        supabase
          .from('favourite_businesses')
          .select('business_id')
          .eq('business_id', businessId)
          .maybeSingle(),
      ])

      setNews((newsData as unknown as BusinessNews[]) ?? [])
      setIsFavourite(!!favData)

      setLoading(false)
    }

    fetchData()
  }, [businessId])

  useEffect(() => {
    if (!cardId) return
    const supabase = createClient()

    const channel = supabase
      .channel(`card-${cardId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'loyalty_cards', filter: `id=eq.${cardId}` },
        (payload) => {
          setStampsCount((payload.new as { stamps_count: number }).stamps_count)
          setQrModalOpen(false)
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rewards', filter: `card_id=eq.${cardId}` },
        (payload) => {
          const reward = payload.new as Reward
          setRewards((prev) => [reward, ...prev])
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rewards', filter: `card_id=eq.${cardId}` },
        (payload) => {
          const updated = payload.new as { id: string; is_redeemed: boolean }
          if (updated.is_redeemed) {
            setRewards((prev) => prev.filter((r) => r.id !== updated.id))
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'business_news', filter: `business_id=eq.${businessId}` },
        async (payload) => {
          const { data } = await supabase
            .from('business_news')
            .select('id, business_id, title, description, created_at, updated_at')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false })
          setNews((data as unknown as BusinessNews[]) ?? [])
          if (payload.eventType === 'INSERT' && activeTabRef.current !== 'news') {
            setHasUnreadNews(true)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [cardId, businessId])

  useEffect(() => {
    if (!qrModalOpen || !cardId) return
    const supabase = createClient()

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('loyalty_cards')
        .select('stamps_count')
        .eq('id', cardId)
        .single()

      if (!data) return
      const row = data as unknown as { stamps_count: number }
      setStampsCount((current) => {
        if (row.stamps_count !== current) {
          setQrModalOpen(false)
          return row.stamps_count
        }
        return current
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [qrModalOpen, cardId])

  useEffect(() => {
    if (rewards.length === 0) {
      setRewardsModalOpen(false)
      setCurrentRewardIndex(0)
    } else if (currentRewardIndex >= rewards.length) {
      setCurrentRewardIndex(rewards.length - 1)
    }
  }, [rewards.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFavourite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const supabase = createClient()
    if (isFavourite) {
      setIsFavourite(false)
      await supabase.from('favourite_businesses').delete().eq('business_id', businessId)
    } else {
      setIsFavourite(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('favourite_businesses') as any).insert({ customer_id: userId!, business_id: businessId })
    }
  }

  const cycleCount = stampsGoal
    ? stampsCount === 0
      ? 0
      : stampsCount % stampsGoal || stampsGoal
    : stampsCount

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

  const hasStampsOrRewards = stampsCount > 0 || rewards.length > 0
  const tabs: { id: Tab; label: string }[] = [
    ...(!fromHome || hasStampsOrRewards ? [{ id: 'stamps' as Tab, label: t('tabStamps') }] : []),
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
        <img
          src={businessImageUrl ?? '/placeholder-hero.svg'}
          alt={businessName}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-black/30 flex items-center justify-center text-white backdrop-blur-sm active:scale-95 transition-transform"
          aria-label={tCommon('back')}
        >
          <ChevronLeft size={20} />
        </button>
        {/* Bottom gradient overlay for text legibility */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/65 to-transparent" />
        <h1 className="absolute bottom-5 left-5 right-14 text-white text-2xl font-bold drop-shadow-md">
          {businessName}
        </h1>
        {businessLogoUrl && (
          <img
            src={businessLogoUrl}
            alt=""
            className="absolute top-4 right-4 w-20 h-20 rounded-full object-cover border-2 border-white/80 shadow-md"
          />
        )}
        <button
          onClick={toggleFavourite}
          className="absolute bottom-5 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm active:scale-90 transition-transform"
          aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
        >
          <Heart
            size={18}
            className={isFavourite ? 'fill-red-500 text-red-500' : 'text-white'}
          />
        </button>
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
            <span className="relative inline-block">
              {label}
              {id === 'news' && hasUnreadNews && (
                <span className="absolute -top-1 -right-3 w-2 h-2 rounded-full bg-red-500" />
              )}
            </span>
          </button>
        ))}
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pb-28">
        {/* My Stamps tab */}
        {activeTab === 'stamps' && (
          <div className="flex flex-col gap-4">
            {/* Progress card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-center mb-6">
                <p className="text-base font-medium text-gray-700">
                  {businessReward
                    ? t('collectStamps', { goal: stampsGoal, reward: businessReward })
                    : t('collectStampsNoReward', { goal: stampsGoal })}
                </p>
              </div>
              {(() => {
                const topCount = Math.ceil(stampsGoal / 2)
                const bottomCount = Math.floor(stampsGoal / 2)
                const renderStamp = (i: number) => {
                  const filled = i < cycleCount
                  return (
                    <div
                      key={i}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                        filled
                          ? 'bg-brand-600 shadow-lg shadow-brand-600/40'
                          : 'border-2 border-dashed border-gray-300 bg-gray-50'
                      }`}
                    >
                      {filled ? (
                        <Stamp size={20} className="text-white -rotate-12 drop-shadow-sm" />
                      ) : (
                        <span className="text-xs text-gray-300 font-medium select-none">{i + 1}</span>
                      )}
                    </div>
                  )
                }
                return stampsGoal <= 5 ? (
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: stampsGoal }, (_, i) => renderStamp(i))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex justify-center gap-2">
                      {Array.from({ length: topCount }, (_, i) => renderStamp(i))}
                    </div>
                    {bottomCount > 0 && (
                      <div className="flex justify-center gap-2">
                        {Array.from({ length: bottomCount }, (_, i) => renderStamp(topCount + i))}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            {/* Rewards card */}
            {rewards.length > 0 ? (
              <button
                onClick={() => { setCurrentRewardIndex(0); setRewardsModalOpen(true) }}
                className="w-full text-left bg-brand-50 rounded-2xl p-5 border border-brand-200 hover:bg-brand-100 active:bg-brand-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-brand-900">{t('rewardsTitle')}</h3>
                    <p className="text-sm text-brand-700 mt-0.5">{t('tapToRedeem')}</p>
                  </div>
                  <span className="text-3xl font-bold text-brand-600 tabular-nums">{rewards.length}</span>
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
          news.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <p className="text-sm">{t('noNews')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {news.map((item) => {
                const expanded = expandedNews.has(item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleNews(item.id)}
                    className="w-full text-left bg-white rounded-xl border border-gray-100 px-5 py-4 shadow-sm active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-gray-900 leading-snug">{item.title}</p>
                      <ChevronDown
                        size={16}
                        className={`shrink-0 mt-0.5 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                    <p className={`text-sm text-gray-600 mt-1 whitespace-pre-line ${expanded ? '' : 'line-clamp-2'}`}>
                      {item.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(item.created_at))}
                    </p>
                  </button>
                )
              })}
            </div>
          )
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
      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 overflow-visible">
        <div className="relative flex items-center h-16 max-w-lg mx-auto px-2">
          <button
            onClick={() => router.push(`/${locale}/customer/qr`)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Home size={20} />
            <span className="text-[10px] font-medium leading-tight">{tQr('navHome')}</span>
          </button>

          <div className="flex-1" />

          <button
            onClick={() => router.push(`/${locale}/customer/qr?tab=rewards`)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Gift size={20} />
            <span className="text-[10px] font-medium leading-tight">{tQr('navRewards')}</span>
          </button>

          <button
            onClick={() => setQrModalOpen(true)}
            className="absolute left-1/2 -translate-x-1/2 -top-8 w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/40 border-4 border-white active:scale-95 transition-transform"
            aria-label={tQr('qrModalTitle')}
          >
            <QrCode size={28} className="text-white" />
          </button>
        </div>
      </nav>

      {/* QR stamp drawer */}
      <Drawer open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-center">{tQr('qrModalTitle')}</DrawerTitle>
          </DrawerHeader>
          <div className="flex justify-center pb-8 px-4">
            {userId && (
              <StampQRCard
                customerId={userId}
                generateNewLabel={tQr('generateNewQR')}
                showToStaffLabel={tQr('showToStaff')}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Rewards modal */}
      {rewardsModalOpen && rewards.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setRewardsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => { touchStartXRef.current = e.touches[0].clientX }}
            onTouchEnd={(e) => {
              if (touchStartXRef.current === null) return
              const delta = touchStartXRef.current - e.changedTouches[0].clientX
              if (Math.abs(delta) < 50) return
              if (delta > 0 && currentRewardIndex < rewards.length - 1) setCurrentRewardIndex((i) => i + 1)
              if (delta < 0 && currentRewardIndex > 0) setCurrentRewardIndex((i) => i - 1)
              touchStartXRef.current = null
            }}
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
            <RewardQRCard
              key={rewards[currentRewardIndex].id}
              rewardCode={rewards[currentRewardIndex].reward_code}
              expiresInLabel={t('expiresIn')}
              rewardLabel={t('rewardLabel')}
            />
            {rewards.length > 1 && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentRewardIndex((i) => i - 1)}
                  disabled={currentRewardIndex === 0}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous reward"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-sm text-gray-500">
                  {currentRewardIndex + 1} / {rewards.length}
                </span>
                <button
                  onClick={() => setCurrentRewardIndex((i) => i + 1)}
                  disabled={currentRewardIndex === rewards.length - 1}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next reward"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
