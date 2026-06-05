'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ContactPage() {
  const t = useTranslations('contact')
  const tCommon = useTranslations('common')

  const [email, setEmail] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setEmail(user.email)
        setIsLoggedIn(true)
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSending(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error: dbError } = await supabase.from('contact_messages').insert({
      user_id: user?.id ?? null,
      email: email.trim(),
      message: message.trim(),
    } as never)

    setSending(false)
    if (dbError) {
      setError(t('errorGeneric'))
    } else {
      setSent(true)
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="max-w-lg mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          {tCommon('back')}
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('title')}</h1>
        <p className="text-sm text-gray-500 mb-8">{t('subtitle')}</p>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <CheckCircle size={48} className="text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900">{t('successTitle')}</h2>
            <p className="text-sm text-gray-500">{t('successDesc')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                readOnly={isLoggedIn}
                className={isLoggedIn ? 'bg-gray-50 text-gray-500 cursor-default' : ''}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">{t('messageLabel')}</Label>
              <textarea
                id="message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t('messagePlaceholder')}
                required
                rows={5}
                className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" disabled={sending} className="w-full">
              {sending ? t('sending') : t('send')}
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
