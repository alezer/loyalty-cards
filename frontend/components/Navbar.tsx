'use client'

import { useTranslations } from 'next-intl'
import { QrCode } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { LanguageSelector } from './LanguageSelector'

export function Navbar() {
  const t = useTranslations('nav')

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
        <LanguageSelector />
      </div>
    </header>
  )
}
