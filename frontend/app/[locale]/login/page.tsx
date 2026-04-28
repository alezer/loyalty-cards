'use client'

import { useEffect, useState, useTransition } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { QrCode, Mail, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from '@/i18n/navigation'
import type { UserRole } from '@/lib/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

type PagePhase =
  | 'checking'       // verifying existing session (skeleton shown)
  | 'idle'           // buttons visible, nothing happening
  | 'email-form'     // email form is expanded
  | 'loading'        // OAuth redirect or form submit in flight
  | 'email-sent'     // signup confirmation email dispatched

type FormMode = 'login' | 'register'

// ─── Google icon (inline SVG, no extra dependency) ───────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

// ─── Skeleton shown while session is being verified ───────────────────────────

function AuthSkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse" aria-hidden="true">
      <div className="h-14 bg-gray-200 rounded-2xl" />
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <div className="h-3 w-4 bg-gray-200 rounded" />
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <div className="h-14 bg-gray-200 rounded-2xl" />
    </div>
  )
}

// ─── Helper: get destination after login ──────────────────────────────────────

function getDestination(locale: string, appRole?: UserRole): string {
  if (appRole === 'owner' || appRole === 'staff' || appRole === 'admin') {
    return `/${locale}/staff/scan`
  }
  return `/${locale}/customer/qr`
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function LoginPage() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()

  const [phase, setPhase] = useState<PagePhase>('checking')
  const [formMode, setFormMode] = useState<FormMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // ── Session check on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setPhase('idle')
        return
      }

      const roleSelected = session.user.user_metadata?.role_selected as boolean | undefined
      if (!roleSelected) {
        router.replace('/role-select')
        return
      }

      const appRole = session.user.user_metadata?.app_role as UserRole | undefined
      router.replace(getDestination(locale, appRole) as never)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Google OAuth ────────────────────────────────────────────────────────────
  function handleGoogleSignIn() {
    setErrorKey(null)
    setPhase('loading')
    const supabase = createClient()

    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?locale=${locale}`,
      },
    })
    // Page will navigate away; no state cleanup needed.
  }

  // ── Email / password form submit ────────────────────────────────────────────
  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorKey(null)

    startTransition(async () => {
      const supabase = createClient()

      if (formMode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback?locale=${locale}`,
          },
        })

        if (error) {
          setErrorKey(
            error.message.toLowerCase().includes('already')
              ? 'errors.emailAlreadyExists'
              : 'errors.generic',
          )
          return
        }

        setPhase('email-sent')
        return
      }

      // Login
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setErrorKey(
          error.message.toLowerCase().includes('confirm')
            ? 'errors.emailNotConfirmed'
            : 'errors.invalidCredentials',
        )
        return
      }

      const user = data.user
      const roleSelected = user.user_metadata?.role_selected as boolean | undefined

      if (!roleSelected) {
        router.replace('/role-select')
        return
      }

      const appRole = user.user_metadata?.app_role as UserRole | undefined
      router.replace(getDestination(locale, appRole) as never)
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-6 py-10 bg-gradient-to-b from-brand-50 via-white to-white">
      {/* Logo block */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center bg-brand-600 text-white rounded-2xl w-16 h-16 mb-4 shadow-lg shadow-brand-200">
          <QrCode size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-gray-500 text-base">{t('subtitle')}</p>
      </div>

      <div className="w-full max-w-sm">
        {/* ── Skeleton ────────────────────────────────────────────────────── */}
        {phase === 'checking' && <AuthSkeleton />}

        {/* ── Email sent confirmation ──────────────────────────────────── */}
        {phase === 'email-sent' && (
          <div className="text-center space-y-3 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <CheckCircle2 className="mx-auto text-brand-600" size={40} />
            <p className="font-semibold text-gray-900">{t('registrationSuccess')}</p>
            <p className="text-sm text-gray-500">{t('registrationSuccessDesc')}</p>
          </div>
        )}

        {/* ── Main auth UI ─────────────────────────────────────────────── */}
        {(phase === 'idle' || phase === 'email-form' || phase === 'loading') && (
          <div className="space-y-4">
            {/* Error banner */}
            {errorKey && (
              <div
                role="alert"
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
              >
                <AlertCircle size={16} className="shrink-0" />
                {t(errorKey as Parameters<typeof t>[0])}
              </div>
            )}

            {/* Google button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={phase === 'loading' || isPending}
              className="w-full flex items-center justify-center gap-3 h-14 bg-white border border-gray-200 rounded-2xl font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GoogleIcon />
              {t('continueWithGoogle')}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 text-gray-400">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-medium">{t('orDivider')}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Email button — expands form on click */}
            {phase === 'idle' && (
              <button
                type="button"
                onClick={() => setPhase('email-form')}
                className="w-full flex items-center justify-center gap-3 h-14 bg-brand-600 rounded-2xl font-medium text-white shadow-sm shadow-brand-200 hover:bg-brand-700 active:scale-[0.98] transition-all"
              >
                <Mail size={18} />
                {t('continueWithEmail')}
              </button>
            )}

            {/* Email form (expanded) */}
            {(phase === 'email-form' || phase === 'loading') && (
              <form onSubmit={handleEmailSubmit} className="space-y-3" noValidate>
                {/* Email */}
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

                {/* Password */}
                <div className="relative">
                  <label htmlFor="password" className="sr-only">
                    {t('passwordLabel')}
                  </label>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={formMode === 'login' ? 'current-password' : 'new-password'}
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

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isPending || phase === 'loading'}
                  className="w-full h-14 bg-brand-600 rounded-2xl font-semibold text-white shadow-sm shadow-brand-200 hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPending
                    ? '...'
                    : formMode === 'login'
                    ? t('signIn')
                    : t('signUp')}
                </button>

                {/* Toggle login ↔ register */}
                <button
                  type="button"
                  onClick={() => {
                    setFormMode((m) => (m === 'login' ? 'register' : 'login'))
                    setErrorKey(null)
                  }}
                  className="w-full text-sm text-brand-600 font-medium py-3 min-h-[44px] hover:underline"
                >
                  {formMode === 'login' ? t('switchToRegister') : t('switchToLogin')}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
