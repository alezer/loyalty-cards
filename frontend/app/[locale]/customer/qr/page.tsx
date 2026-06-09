'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, Stamp, QrCode, Gift, ChevronRight, Heart } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

const StampQRCard = dynamic(
  () => import('@/components/QRDisplay').then((m) => m.StampQRCard),
  { ssr: false, loading: () => <QRPlaceholder /> },
)

function QRPlaceholder() {
  return <div className="w-[240px] h-[240px] bg-gray-100 rounded-2xl animate-pulse" />
}

interface LoyaltyCardEntry {
  id: string
  business_id: string
  stamps_count: number
  businesses: { name: string; stamps_goal: number; image_url: string | null; logo_url: string | null } | null
  rewards: { is_redeemed: boolean }[]
}

interface BusinessEntry {
  id: string
  name: string
  image_url: string | null
  logo_url: string | null
}

interface RewardEntry {
  id: string
  is_redeemed: boolean
  redeemed_at: string | null
  created_at: string
  business_id: string
  business_name: string
  business_logo_url: string | null
  business_reward: string | null
}

type Tab = 'home' | 'rewards'

export default function CustomerQRPage() {
  const t = useTranslations('customer.qr')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [userId, setUserId] = useState<string | null>(null)
  const [loyaltyCards, setLoyaltyCards] = useState<LoyaltyCardEntry[]>([])
  const [businesses, setBusinesses] = useState<BusinessEntry[]>([])
  const [rewardHistory, setRewardHistory] = useState<RewardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>(
    searchParams.get('tab') === 'rewards' ? 'rewards' : 'home',
  )
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [favourites, setFavourites] = useState<Set<string>>(new Set())
  const [removingFavourites, setRemovingFavourites] = useState<Set<string>>(new Set())
  const carouselRef = useRef<HTMLDivElement>(null)
  const pendingScrollToId = useRef<string | null>(null)
  const loyaltyCardsRef = useRef<LoyaltyCardEntry[]>(loyaltyCards)

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateStr))

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [activeTab])

  useEffect(() => { loyaltyCardsRef.current = loyaltyCards }, [loyaltyCards])

  const fetchCards = useCallback(async () => {
    const supabase = createClient()
    const [{ data: cards }, { data: rawRewards }] = await Promise.all([
      supabase
        .from('loyalty_cards')
        .select('id, business_id, stamps_count, businesses(name, stamps_goal, image_url, logo_url), rewards(is_redeemed)')
        .order('updated_at', { ascending: false }),
      supabase
        .from('rewards')
        .select('id, is_redeemed, redeemed_at, created_at, loyalty_cards(business_id, businesses(name, logo_url, reward))')
        .order('created_at', { ascending: false }),
    ])

    if (cards) setLoyaltyCards(cards as unknown as LoyaltyCardEntry[])

    if (rawRewards) {
      const mapped: RewardEntry[] = (rawRewards as unknown as Array<{
        id: string
        is_redeemed: boolean
        redeemed_at: string | null
        created_at: string
        loyalty_cards: {
          business_id: string
          businesses: { name: string; logo_url: string | null; reward: string | null } | null
        } | null
      }>).map((r) => ({
        id: r.id,
        is_redeemed: r.is_redeemed,
        redeemed_at: r.redeemed_at,
        created_at: r.created_at,
        business_id: r.loyalty_cards?.business_id ?? '',
        business_name: r.loyalty_cards?.businesses?.name ?? '—',
        business_logo_url: r.loyalty_cards?.businesses?.logo_url ?? null,
        business_reward: r.loyalty_cards?.businesses?.reward ?? null,
      }))
      setRewardHistory(mapped)
    }
  }, [])

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()

    const channel = supabase
      .channel(`customer-cards-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'loyalty_cards', filter: `customer_id=eq.${userId}` },
        () => { fetchCards(); setQrModalOpen(false) },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rewards' },
        () => { fetchCards(); setQrModalOpen(false) },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchCards])

  useEffect(() => {
    if (!qrModalOpen || !userId) return
    const supabase = createClient()

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('loyalty_cards')
        .select('id, stamps_count')

      if (!data) return
      const rows = data as Array<{ id: string; stamps_count: number }>
      const changed = rows.some((row) => {
        const card = loyaltyCardsRef.current.find((c) => c.id === row.id)
        return !card || card.stamps_count !== row.stamps_count
      })
      if (!changed) return

      await fetchCards()
      setQrModalOpen(false)
    }, 2000)

    return () => clearInterval(interval)
  }, [qrModalOpen, userId, fetchCards])

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace(`/${locale}/login`)
        return
      }

      setUserId(user.id)
      const [{ data: cards }, { data: allBusinesses }, { data: rawRewards }, { data: favData }] = await Promise.all([
        supabase
          .from('loyalty_cards')
          .select('id, business_id, stamps_count, businesses(name, stamps_goal, image_url, logo_url), rewards(is_redeemed)')
          .order('updated_at', { ascending: false }),
        supabase
          .from('businesses')
          .select('id, name, image_url, logo_url')
          .order('name', { ascending: true }),
        supabase
          .from('rewards')
          .select('id, is_redeemed, redeemed_at, created_at, loyalty_cards(business_id, businesses(name, logo_url, reward))')
          .order('created_at', { ascending: false }),
        supabase
          .from('favourite_businesses')
          .select('business_id'),
      ])

      setLoyaltyCards((cards as unknown as LoyaltyCardEntry[]) ?? [])
      setBusinesses((allBusinesses as unknown as BusinessEntry[]) ?? [])
      setFavourites(new Set(((favData ?? []) as Array<{ business_id: string }>).map((f) => f.business_id)))

      if (rawRewards) {
        const mapped: RewardEntry[] = (rawRewards as unknown as Array<{
          id: string
          is_redeemed: boolean
          redeemed_at: string | null
          created_at: string
          loyalty_cards: {
            business_id: string
            businesses: { name: string; logo_url: string | null; reward: string | null } | null
          } | null
        }>).map((r) => ({
          id: r.id,
          is_redeemed: r.is_redeemed,
          redeemed_at: r.redeemed_at,
          created_at: r.created_at,
          business_id: r.loyalty_cards?.business_id ?? '',
          business_name: r.loyalty_cards?.businesses?.name ?? '—',
          business_logo_url: r.loyalty_cards?.businesses?.logo_url ?? null,
          business_reward: r.loyalty_cards?.businesses?.reward ?? null,
        }))
        setRewardHistory(mapped)
      }

      setLoading(false)
    })
  }, [])

  const toggleFavourite = async (e: React.MouseEvent, businessId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const isFav = favourites.has(businessId)
    const supabase = createClient()
    if (isFav) {
      setRemovingFavourites((prev) => new Set(prev).add(businessId))
      await supabase.from('favourite_businesses').delete().eq('business_id', businessId)
      setTimeout(() => {
        setFavourites((prev) => { const next = new Set(prev); next.delete(businessId); return next })
        setRemovingFavourites((prev) => { const next = new Set(prev); next.delete(businessId); return next })
      }, 300)
    } else {
      pendingScrollToId.current = businessId
      setFavourites((prev) => new Set(prev).add(businessId))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('favourite_businesses') as any).insert({ customer_id: userId!, business_id: businessId })
    }
  }

  useEffect(() => {
    const id = pendingScrollToId.current
    if (!id || !carouselRef.current) return
    pendingScrollToId.current = null
    const favouriteBusinesses = businesses.filter((b) => favourites.has(b.id))
    const idx = favouriteBusinesses.findIndex((b) => b.id === id)
    if (idx < 0) return
    const child = carouselRef.current.children[idx] as HTMLElement | undefined
    if (child) carouselRef.current.scrollTo({ left: child.offsetLeft, behavior: 'smooth' })
  }, [favourites, businesses])

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
        <p className="text-gray-400 animate-pulse">{tCommon('loading')}</p>
        <Link href={`/${locale}/login`} className="text-brand-600 hover:underline font-medium text-sm">
          {tCommon('goToLogin')}
        </Link>
      </div>
    )
  }

  const availableRewards = rewardHistory.filter((r) => !r.is_redeemed)
  const redeemedRewards = rewardHistory.filter((r) => r.is_redeemed)

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 to-white">
      <div className="pb-28 pt-10 px-4">
        {/* Home tab */}
        {activeTab === 'home' && (
          <div className="max-w-sm mx-auto">
            {/* Favourites carousel */}
            {favourites.size > 0 && (() => {
              const favouriteBusinesses = businesses.filter((b) => favourites.has(b.id))
              return (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
                    {t('sectionFavourites')}
                  </h2>
                  <div ref={carouselRef} className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
                    {favouriteBusinesses.map((biz) => {
                      const card = loyaltyCards.find((c) => c.business_id === biz.id)
                      const goal = card?.businesses?.stamps_goal
                      const cycleCount = card && goal
                        ? card.stamps_count % goal || goal
                        : card?.stamps_count
                      const unredeemedCount = card
                        ? card.rewards.filter((r) => !r.is_redeemed).length
                        : 0
                      return (
                        <Link
                          key={biz.id}
                          href={`/${locale}/customer/business/${biz.id}?source=home`}
                          className={`relative h-40 w-60 shrink-0 snap-start rounded-2xl overflow-hidden bg-gradient-to-br from-brand-400 to-brand-700 shadow-sm active:scale-95 transition-all duration-300 ${removingFavourites.has(biz.id) ? 'opacity-0 scale-95' : 'opacity-100'}`}
                        >
                          <img
                            src={biz.image_url ?? '/placeholder-hero.svg'}
                            alt={biz.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent" />
                          {biz.logo_url && (
                            <img
                              src={biz.logo_url}
                              alt=""
                              className="absolute top-3 left-3 w-10 h-10 rounded-full object-cover border-2 border-white/80 shadow-sm"
                            />
                          )}

                          {card && (
                            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                              <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 text-white text-xs font-semibold">
                                <Stamp size={11} />
                                {cycleCount}/{goal ?? '?'}
                              </span>
                              {unredeemedCount > 0 && (
                                <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 text-white text-xs font-semibold">
                                  <Gift size={11} />
                                  {unredeemedCount}
                                </span>
                              )}
                            </div>
                          )}

                          <p className="absolute bottom-3 left-4 right-12 text-white font-semibold text-base leading-tight">
                            {biz.name}
                          </p>
                          <button
                            onClick={(e) => toggleFavourite(e, biz.id)}
                            className="absolute bottom-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm active:scale-90 transition-transform"
                            aria-label="Remove from favourites"
                          >
                            <Heart size={16} className="fill-red-500 text-red-500" />
                          </button>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
              {t('sectionShops')}
            </h2>
            {businesses.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-4">{t('noShops')}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {businesses.map((biz) => {
                  const card = loyaltyCards.find((c) => c.business_id === biz.id)
                  const goal = card?.businesses?.stamps_goal
                  const cycleCount = card && goal
                    ? card.stamps_count % goal || goal
                    : card?.stamps_count
                  const unredeemedCount = card
                    ? card.rewards.filter((r) => !r.is_redeemed).length
                    : 0
                  return (
                    <Link
                      key={biz.id}
                      href={`/${locale}/customer/business/${biz.id}?source=home`}
                      className="relative h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-400 to-brand-700 shadow-sm active:scale-95 transition-transform"
                    >
                      <img
                        src={biz.image_url ?? '/placeholder-hero.svg'}
                        alt={biz.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent" />
                      {biz.logo_url && (
                        <img
                          src={biz.logo_url}
                          alt=""
                          className="absolute top-3 left-3 w-14 h-14 rounded-full object-cover border-2 border-white/80 shadow-sm"
                        />
                      )}

                      {card && (
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                          <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-sm font-semibold">
                            <Stamp size={14} />
                            {cycleCount}/{goal ?? '?'}
                          </span>
                          {unredeemedCount > 0 && (
                            <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-sm font-semibold">
                              <Gift size={14} />
                              {unredeemedCount}
                            </span>
                          )}
                        </div>
                      )}

                      <p className="absolute bottom-3 left-4 right-12 text-white font-semibold text-base leading-tight">
                        {biz.name}
                      </p>
                      <button
                        onClick={(e) => toggleFavourite(e, biz.id)}
                        className="absolute bottom-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm active:scale-90 transition-transform"
                        aria-label={favourites.has(biz.id) ? 'Remove from favourites' : 'Add to favourites'}
                      >
                        <Heart
                          size={16}
                          className={favourites.has(biz.id) ? 'fill-red-500 text-red-500' : 'text-white'}
                        />
                      </button>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Rewards History tab */}
        {activeTab === 'rewards' && (
          <div className="max-w-sm mx-auto">
            {rewardHistory.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-4">{t('noRewardsHistory')}</p>
            ) : (
              <>
                {/* Available rewards */}
                {availableRewards.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1 flex items-center gap-2">
                      {t('rewardsAvailable')}
                      <span className="bg-brand-600 text-white text-xs font-bold rounded-full px-2 py-0.5 leading-none">
                        {availableRewards.length}
                      </span>
                    </h2>
                    <div className="flex flex-col gap-2">
                      {availableRewards.map((reward) => (
                        <Link
                          key={reward.id}
                          href={`/${locale}/customer/business/${reward.business_id}?source=rewards`}
                          className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-2xl px-4 py-3 active:scale-95 transition-transform"
                        >
                          {reward.business_logo_url ? (
                            <img
                              src={reward.business_logo_url}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                              <Gift size={18} className="text-brand-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{reward.business_name}</p>
                            {reward.business_reward && (
                              <p className="text-xs text-brand-700 truncate">{reward.business_reward}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {t('rewardsEarned')} {formatDate(reward.created_at)}
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-brand-400 shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Redeemed history */}
                {redeemedRewards.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
                      {t('rewardsHistory')}
                    </h2>
                    <div className="flex flex-col gap-2">
                      {redeemedRewards.map((reward) => (
                        <div
                          key={reward.id}
                          className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3"
                        >
                          {reward.business_logo_url ? (
                            <img
                              src={reward.business_logo_url}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover shrink-0 opacity-50"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                              <Gift size={18} className="text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-500 text-sm truncate">{reward.business_name}</p>
                            {reward.business_reward && (
                              <p className="text-xs text-gray-400 truncate">{reward.business_reward}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {t('rewardsEarned')} {formatDate(reward.created_at)}
                            </p>
                            {reward.redeemed_at && (
                              <p className="text-xs text-gray-400">
                                {t('rewardsRedeemedOn')} {formatDate(reward.redeemed_at)}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 font-medium shrink-0">
                            {t('rewardsStatusRedeemed')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
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

      {/* QR stamp drawer */}
      <Drawer open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-center">{t('qrModalTitle')}</DrawerTitle>
          </DrawerHeader>
          <div className="flex justify-center pb-8 px-4">
            {userId && (
              <StampQRCard
                customerId={userId}
                generateNewLabel={t('generateNewQR')}
                showToStaffLabel={t('showToStaff')}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
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
