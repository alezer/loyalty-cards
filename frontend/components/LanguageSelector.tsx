'use client'

import { useLocale } from 'next-intl'
import { useTransition } from 'react'
import { Check } from 'lucide-react'
import { usePathname, useRouter } from '@/i18n/navigation'

const LOCALES = [
  { code: 'es', nativeName: 'Español' },
  { code: 'en', nativeName: 'English' },
  { code: 'ca', nativeName: 'Català' },
] as const

export function LanguageSelector() {
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
    <div className="flex flex-col gap-2">
      {LOCALES.map(({ code, nativeName }) => {
        const isActive = locale === code
        return (
          <button
            key={code}
            onClick={() => handleChange(code)}
            disabled={isPending}
            aria-pressed={isActive}
            className={[
              'flex items-center justify-between w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 text-left',
              isActive
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.99]',
              isPending && 'opacity-50',
            ].filter(Boolean).join(' ')}
          >
            <span>{nativeName}</span>
            {isActive && <Check size={16} className="text-brand-600" />}
          </button>
        )
      })}
    </div>
  )
}
