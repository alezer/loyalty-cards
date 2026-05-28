'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, MapPin, Clock, ExternalLink } from 'lucide-react'

type Tab = 'stamps' | 'news' | 'info'

interface NewsItem {
  id: string
  title: string
  body: string
}

const DUMMY_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Summer promotion',
    body: "This summer enjoy a 20% discount on all our products every Tuesday. Don't miss this exclusive offer for our loyal customers who have collected at least 5 stamps. Valid until August 31st.",
  },
  {
    id: '2',
    title: 'New opening hours',
    body: 'From next Monday we will extend our opening hours. We will now be open until 9 pm from Monday to Friday to better serve our customers.',
  },
  {
    id: '3',
    title: 'Double stamps weekend',
    body: 'This coming weekend — Saturday and Sunday — every purchase earns you double stamps. Come visit us and accelerate your reward progress!',
  },
]

const DUMMY_INFO = {
  address: '123 Main Street, City Centre, 10001',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=123+Main+Street+City+Centre',
  hours: [
    { days: 'Monday – Friday', time: '9:00 – 20:00' },
    { days: 'Saturday', time: '10:00 – 21:00' },
    { days: 'Sunday', time: '11:00 – 18:00' },
  ],
}

export default function BusinessDetailPage() {
  const t = useTranslations('customer.business')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const params = useParams()
  const businessId = params.businessId as string

  const [businessName, setBusinessName] = useState<string>('—')
  const [stampsCount, setStampsCount] = useState<number>(0)
  const [stampsGoal, setStampsGoal] = useState<number>(10)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('stamps')
  const [expandedNews, setExpandedNews] = useState<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('loyalty_cards')
      .select('stamps_count, businesses(name, stamps_goal)')
      .eq('business_id', businessId)
      .single()
      .then(({ data }) => {
        const row = data as unknown as { stamps_count: number; businesses: { name: string; stamps_goal: number } | null } | null
        if (row) {
          setBusinessName(row.businesses?.name ?? '—')
          setStampsCount(row.stamps_count)
          setStampsGoal(row.businesses?.stamps_goal ?? 10)
        }
        setLoading(false)
      })
  }, [businessId])

  const cycleCount = stampsGoal
    ? stampsCount === 0
      ? 0
      : stampsCount % stampsGoal || stampsGoal
    : stampsCount
  const progress = stampsGoal ? (cycleCount / stampsGoal) * 100 : 0

  const toggleNews = (id: string) =>
    setExpandedNews((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const tabs: { id: Tab; label: string }[] = [
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
        <button
          onClick={() => router.back()}
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
        )}

        {/* News tab */}
        {activeTab === 'news' && (
          <div className="flex flex-col gap-3">
            {DUMMY_NEWS.map((item) => {
              const expanded = expandedNews.has(item.id)
              return (
                <button
                  key={item.id}
                  onClick={() => toggleNews(item.id)}
                  className="w-full text-left bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 transition-colors hover:bg-gray-50 active:bg-gray-100"
                >
                  <p className="font-semibold text-gray-900 mb-1">{item.title}</p>
                  <p className={`text-sm text-gray-500 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
                    {item.body}
                  </p>
                </button>
              )
            })}
          </div>
        )}

        {/* Information tab */}
        {activeTab === 'info' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-brand-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                    {t('address')}
                  </p>
                  <p className="text-sm text-gray-800">{DUMMY_INFO.address}</p>
                  <a
                    href={DUMMY_INFO.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand-600 font-medium mt-2 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('viewOnMaps')}
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100">
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-brand-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                    {t('openingHours')}
                  </p>
                  <div className="flex flex-col gap-2">
                    {DUMMY_INFO.hours.map((h) => (
                      <div key={h.days} className="flex justify-between text-sm">
                        <span className="text-gray-600">{h.days}</span>
                        <span className="text-gray-900 font-medium tabular-nums">{h.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
