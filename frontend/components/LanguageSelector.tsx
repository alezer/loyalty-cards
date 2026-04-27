'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { usePathname, useRouter } from '@/i18n/navigation'

const LOCALES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
] as const

export function LanguageSelector() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(newLocale: string) {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale })
    })
  }

  return (
    <div
      role="group"
      aria-label={t('language')}
      className="flex items-center bg-gray-100 rounded-full p-0.5 gap-0.5"
    >
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => handleChange(code)}
          disabled={isPending || locale === code}
          aria-pressed={locale === code}
          className={[
            // Minimum 44×44 px touch target (PWA requirement)
            'min-h-[44px] min-w-[44px] rounded-full text-sm font-semibold transition-all duration-150',
            locale === code
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 active:scale-95',
            isPending && 'opacity-50',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
