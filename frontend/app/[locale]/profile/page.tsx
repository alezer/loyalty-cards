'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

export default function ProfilePage() {
  const t = useTranslations('profile')
  const tCommon = useTranslations('common')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isEmailUser, setIsEmailUser] = useState(false)
  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setName(user.user_metadata?.full_name ?? '')
        setEmail(user.email ?? '')
        const providers = (user.app_metadata?.providers ?? [user.app_metadata?.provider]) as string[]
        setIsEmailUser(providers.includes('email'))
      }
      setLoading(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    const supabase = createClient()
    await supabase.auth.updateUser({ data: { full_name: name } })
    await supabase.from('profiles').update({ full_name: name } as never).eq('id', (await supabase.auth.getUser()).data.user!.id)
    setSaving(false)
    setSaved(true)
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSaved(false)

    if (newPassword.length < 8) {
      setPasswordError(t('password.errorTooShort'))
      return
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordError(t('password.errorWeakPassword'))
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('password.errorMismatch'))
      return
    }

    setPasswordSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordSaving(false)

    if (error) {
      setPasswordError(
        error.code === 'same_password'
          ? t('password.errorSamePassword')
          : t('password.errorGeneric')
      )
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    setPasswordSaved(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">{tCommon('loading')}</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 to-white py-10 px-4">
      <div className="max-w-sm mx-auto flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>

        {/* Edit name form */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">{t('nameLabel')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => { setName(e.target.value); setSaved(false) }}
                placeholder={t('namePlaceholder')}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <Input id="email" value={email} disabled className="opacity-60 cursor-not-allowed" />
            </div>
            <Button type="submit" disabled={saving || !name.trim()} className="self-start">
              {saving ? tCommon('saving') : tCommon('save')}
            </Button>
            {saved && (
              <p className="text-sm text-green-600">{t('savedConfirmation')}</p>
            )}
          </form>
        </section>

        {/* Change password — only for email/password accounts */}
        {isEmailUser && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
            <h2 className="font-semibold text-gray-900">{t('password.title')}</h2>
            <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-password">{t('password.newLabel')}</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordSaved(false); setPasswordError(null) }}
                    placeholder="••••••••"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    aria-label={showNew ? t('password.hidePassword') : t('password.showPassword')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400">{t('password.hint')}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm-password">{t('password.confirmLabel')}</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordSaved(false); setPasswordError(null) }}
                    placeholder="••••••••"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? t('password.hidePassword') : t('password.showPassword')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}
              {passwordSaved && (
                <p className="text-sm text-green-600">{t('password.savedConfirmation')}</p>
              )}
              <Button type="submit" disabled={passwordSaving || !newPassword || !confirmPassword} className="self-start">
                {passwordSaving ? tCommon('saving') : t('password.save')}
              </Button>
            </form>
          </section>
        )}

        {/* Danger zone */}
        <section className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('dangerZone')}</p>
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 flex flex-col gap-3">
            <p className="text-sm text-gray-700">{t('deleteAccountDesc')}</p>
            <Button
              variant="destructive"
              className="self-start"
              onClick={() => setDeleteOpen(true)}
            >
              {t('deleteAccount')}
            </Button>
          </div>
        </section>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>{t('deleteDialog.title')}</DialogTitle>
            <DialogDescription>{t('deleteDialog.description')}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('deleteDialog.irreversible')}</p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t('deleteDialog.cancel')}
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
