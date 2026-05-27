'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { QrCode, LogOut, UserRound } from 'lucide-react'
import { Link, useRouter } from '@/i18n/navigation'
import { LanguageSelector } from './LanguageSelector'
import { createClient } from '@/lib/supabase/client'

export function Navbar() {
  const t = useTranslations('nav')
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded-lg"
        >
          <span className="bg-brand-600 text-white rounded-lg p-1.5" aria-hidden="true">
            <QrCode size={18} />
          </span>
          <span className="font-semibold text-gray-900 text-sm">{t('brand')}</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-1">
          <LanguageSelector />
          {isLoggedIn && (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 min-h-[44px] px-2 rounded-lg transition-colors"
                aria-label={t('profile')}
              >
                <UserRound size={15} />
                <span className="hidden sm:inline">{t('profile')}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 min-h-[44px] px-2 rounded-lg transition-colors"
                aria-label={t('signOut')}
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">{t('signOut')}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
