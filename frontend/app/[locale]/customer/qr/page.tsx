'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Home, Stamp, QrCode, Gift } from 'lucide-react'
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

type Tab = 'home' | 'stamps'

export default function CustomerQRPage() {
  const t = useTranslations('customer.qr')
  const tCommon = useTranslations('common')
  const locale = useLocale()

  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [loyaltyCards, setLoyaltyCards] = useState<LoyaltyCardEntry[]>([])
  const [businesses, setBusinesses] = useState<BusinessEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [qrModalOpen, setQrModalOpen] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [activeTab])

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)
      setUserName(user.user_metadata?.full_name ?? null)

      const [{ data: cards }, { data: allBusinesses }] = await Promise.all([
        supabase
          .from('loyalty_cards')
          .select('id, business_id, stamps_count, businesses(name, stamps_goal, image_url, logo_url), rewards(is_redeemed)')
          .order('updated_at', { ascending: false }),
        supabase
          .from('businesses')
          .select('id, name, image_url, logo_url')
          .order('name', { ascending: true }),
      ])

      setLoyaltyCards((cards as unknown as LoyaltyCardEntry[]) ?? [])
      setBusinesses((allBusinesses as unknown as BusinessEntry[]) ?? [])
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 to-white">
      {/* Scrollable content — padded so it never hides behind the floating button + navbar */}
      <div className="pb-28 pt-10 px-4">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
          {userName ? t('greeting', { name: userName }) : t('title')}
        </h1>

        {/* Home tab */}
        {activeTab === 'home' && (
          <div className="max-w-sm mx-auto">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
              {t('sectionShops')}
            </h2>
            {businesses.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-4">{t('noShops')}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {businesses.map((biz) => (
                  <Link
                    key={biz.id}
                    href={`/${locale}/customer/business/${biz.id}?source=home`}
                    className="relative h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-400 to-brand-700 shadow-sm active:scale-95 transition-transform"
                  >
                    <img
                      src={biz.image_url ?? `https://picsum.photos/seed/${biz.id}/600/160`}
                      alt={biz.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Gradient overlay for text legibility */}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent" />
                    {biz.logo_url && (
                      <img
                        src={biz.logo_url}
                        alt=""
                        className="absolute top-3 left-3 w-14 h-14 rounded-full object-cover border-2 border-white/80 shadow-sm"
                      />
                    )}
                    <p className="absolute bottom-3 left-4 right-4 text-white font-semibold text-base leading-tight">
                      {biz.name}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Stamps tab */}
        {activeTab === 'stamps' && (
          <div className="max-w-sm mx-auto">
            {loyaltyCards.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-4">{t('noStamps')}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {loyaltyCards.map((card) => {
                  const goal = card.businesses?.stamps_goal
                  const cycleCount = goal
                    ? card.stamps_count % goal || goal
                    : card.stamps_count
                  const unredeemedCount = card.rewards.filter((r) => !r.is_redeemed).length
                  const imageUrl = card.businesses?.image_url
                  const logoUrl = card.businesses?.logo_url
                  return (
                    <Link
                      key={card.business_id}
                      href={`/${locale}/customer/business/${card.business_id}`}
                      className="relative h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-400 to-brand-700 shadow-sm active:scale-95 transition-transform"
                    >
                      <img
                        src={imageUrl ?? `https://picsum.photos/seed/${card.business_id}/600/160`}
                        alt={card.businesses?.name ?? ''}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent" />
                      {logoUrl && (
                        <img
                          src={logoUrl}
                          alt=""
                          className="absolute top-3 left-3 w-14 h-14 rounded-full object-cover border-2 border-white/80 shadow-sm"
                        />
                      )}

                      {/* Top-right stamp + reward badges */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1 text-white text-xs font-semibold">
                          <Stamp size={11} />
                          {cycleCount}/{goal ?? '?'}
                        </span>
                        {unredeemedCount > 0 && (
                          <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1 text-white text-xs font-semibold">
                            <Gift size={11} />
                            {unredeemedCount}
                          </span>
                        )}
                      </div>

                      <p className="absolute bottom-3 left-4 right-4 text-white font-semibold text-base leading-tight">
                        {card.businesses?.name ?? '—'}
                      </p>
                    </Link>
                  )
                })}
              </div>
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

          {/* My Stamps */}
          <NavButton
            active={activeTab === 'stamps'}
            label={t('navStamps')}
            onClick={() => setActiveTab('stamps')}
          >
            <Stamp size={20} />
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
