'use client'

import { useEffect, useState, useTransition } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Store, User, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from '@/i18n/navigation'
import type { UserRole } from '@/lib/types/database'

type Choice = 'owner' | 'customer'

export default function RoleSelectPage() {
  const t = useTranslations('roleSelect')
  const locale = useLocale()
  const router = useRouter()

  const [selected, setSelected] = useState<Choice | null>(null)
  const [isPending, startTransition] = useTransition()

  // Guard: redirect to login if no session
  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (!session) router.replace('/login')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSelect(choice: Choice) {
    setSelected(choice)
    startTransition(async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const role: UserRole = choice === 'owner' ? 'owner' : 'customer'

      // Update the profiles row (RLS: user can update their own row)
      await supabase.from('profiles').update({ role } as never).eq('id', user.id)

      // Persist selection + role in user metadata so the callback
      // and login flow can read them without an extra DB round-trip.
      await supabase.auth.updateUser({
        data: { role_selected: true, app_role: role },
      })

      if (role === 'owner') {
        router.replace('/staff/scan')
      } else {
        router.replace('/customer/qr')
      }
    })
  }

  const cards: { choice: Choice; icon: React.ReactNode; title: string; desc: string }[] = [
    {
      choice: 'owner',
      icon: <Store size={32} />,
      title: t('businessTitle'),
      desc: t('businessDesc'),
    },
    {
      choice: 'customer',
      icon: <User size={32} />,
      title: t('customerTitle'),
      desc: t('customerDesc'),
    },
  ]

  return (
    <main className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-gray-500 text-sm">{t('subtitle')}</p>
        </div>

        {/* Choice cards — stacked on mobile, side-by-side on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map(({ choice, icon, title, desc }) => {
            const isChosen = selected === choice
            const isLoading = isPending && isChosen

            return (
              <button
                key={choice}
                type="button"
                onClick={() => handleSelect(choice)}
                disabled={isPending}
                aria-pressed={isChosen}
                className={[
                  // Full-card tap target (well above 44 px)
                  'relative flex flex-col items-center text-center gap-4 p-7 rounded-2xl border-2 transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
                  'active:scale-[0.97]',
                  isChosen
                    ? 'border-brand-600 bg-brand-50 shadow-md shadow-brand-100'
                    : 'border-gray-200 bg-white hover:border-brand-400 hover:shadow-sm',
                  isPending && !isChosen && 'opacity-50 cursor-not-allowed',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {/* Icon */}
                <span
                  className={`rounded-2xl p-4 ${
                    isChosen ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {icon}
                </span>

                {/* Text */}
                <div>
                  <p className="font-semibold text-gray-900 text-base">{title}</p>
                  <p className="mt-1 text-sm text-gray-500 leading-snug">{desc}</p>
                </div>

                {/* Loading / selected indicator */}
                {isLoading && (
                  <span className="absolute top-3 right-3 text-brand-600 animate-spin">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  </span>
                )}
                {isChosen && !isLoading && (
                  <CheckCircle2
                    size={20}
                    className="absolute top-3 right-3 text-brand-600"
                  />
                )}
              </button>
            )
          })}
        </div>

        {isPending && (
          <p className="text-center text-sm text-gray-400 mt-6 animate-pulse">{t('saving')}</p>
        )}
      </div>
    </main>
  )
}
