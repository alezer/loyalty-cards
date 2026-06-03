'use client'

import { useState, useTransition } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { KeyRound, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { requestPasswordReset } from '@/app/actions/auth'

export default function ForgotPasswordPage() {
  const t = useTranslations('forgotPassword')
  const locale = useLocale()

  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorKey(null)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrorKey('errors.invalidEmail')
      return
    }

    startTransition(async () => {
      await requestPasswordReset(email, locale)
      setSubmitted(true)
    })
  }

  return (
    <main className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-6 py-10 bg-gradient-to-b from-brand-50 via-white to-white">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center bg-brand-600 text-white rounded-2xl w-16 h-16 mb-4 shadow-lg shadow-brand-200">
            <KeyRound size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-gray-500 text-sm">{t('subtitle')}</p>
        </div>

        {submitted ? (
          <div className="text-center space-y-3 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <CheckCircle2 className="mx-auto text-brand-600" size={40} />
            <p className="font-semibold text-gray-900">{t('successTitle')}</p>
            <p className="text-sm text-gray-500">{t('successDesc')}</p>
            <Link
              href="/login"
              className="inline-block mt-2 text-sm text-brand-600 font-medium hover:underline"
            >
              {t('backToLogin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {errorKey && (
              <div
                role="alert"
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
              >
                <AlertCircle size={16} className="shrink-0" />
                {t(errorKey as Parameters<typeof t>[0])}
              </div>
            )}

            <div>
              <label htmlFor="email" className="sr-only">
                {t('emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="w-full h-14 px-4 rounded-2xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-14 bg-brand-600 rounded-2xl font-semibold text-white shadow-sm shadow-brand-200 hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? t('submitting') : t('submit')}
            </button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 py-2 min-h-[44px] transition-colors"
            >
              <ArrowLeft size={14} />
              {t('backToLogin')}
            </Link>
          </form>
        )}
      </div>
    </main>
  )
}
