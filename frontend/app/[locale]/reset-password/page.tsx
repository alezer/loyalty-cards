'use client'

import { useEffect, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { Link, useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const t = useTranslations('resetPassword')
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
    })
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorKey(null)

    if (password.length < 8) {
      setErrorKey('errors.passwordTooShort')
      return
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setErrorKey('errors.passwordNeedsLetterAndNumber')
      return
    }
    if (password !== confirmPassword) {
      setErrorKey('errors.passwordMismatch')
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setErrorKey('errors.generic')
        return
      }

      setSuccess(true)
      await supabase.auth.signOut()
      setTimeout(() => router.replace('/login' as never), 3000)
    })
  }

  if (hasSession === null) {
    return (
      <main className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <div className="animate-pulse h-8 w-32 bg-gray-200 rounded-xl" />
      </main>
    )
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

        {!hasSession ? (
          <div className="text-center space-y-3 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <AlertCircle className="mx-auto text-red-500" size={40} />
            <p className="font-semibold text-gray-900">{t('errors.noSession')}</p>
            <Link
              href="/forgot-password"
              className="inline-block text-sm text-brand-600 font-medium hover:underline"
            >
              {t('requestNewLink')}
            </Link>
          </div>
        ) : success ? (
          <div className="text-center space-y-3 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <CheckCircle2 className="mx-auto text-brand-600" size={40} />
            <p className="font-semibold text-gray-900">{t('successTitle')}</p>
            <p className="text-sm text-gray-500">{t('successDesc')}</p>
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

            {/* New password */}
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                {t('passwordLabel')}
              </label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                className="w-full h-14 px-4 pr-12 rounded-2xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Confirm password */}
            <div className="relative">
              <label htmlFor="confirm-password" className="sr-only">
                {t('confirmLabel')}
              </label>
              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPlaceholder')}
                className="w-full h-14 px-4 pr-12 rounded-2xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <p className="text-xs text-gray-400 px-1">{t('passwordHint')}</p>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-14 bg-brand-600 rounded-2xl font-semibold text-white shadow-sm shadow-brand-200 hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? t('submitting') : t('submit')}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
