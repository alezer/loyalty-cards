'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Plus, Trash2, UserCheck, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { createOwnerUser, deleteOwnerUser, impersonateUser } from '@/app/actions/admin'
import type { OwnerWithBusiness } from '@/lib/types/database'

interface Props {
  initialOwners: OwnerWithBusiness[]
  businesses: { id: string; name: string }[]
}

export function UsersManager({ initialOwners, businesses }: Props) {
  const t = useTranslations('admin.users')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<OwnerWithBusiness | null>(null)
  const [magicLink, setMagicLink] = useState<string | null>(null)
  const [impersonateName, setImpersonateName] = useState('')
  const [copied, setCopied] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessId, setBusinessId] = useState<string>('none')
  const [formError, setFormError] = useState<string | null>(null)

  function resetForm() {
    setName(''); setEmail(''); setPassword(''); setBusinessId('none'); setFormError(null)
  }

  function handleCreate() {
    if (!name || !email || !password) return
    setFormError(null)
    startTransition(async () => {
      const result = await createOwnerUser(
        email,
        password,
        name,
        businessId === 'none' ? null : businessId,
      )
      if (!result.success) { setFormError(result.error); return }
      setCreateOpen(false)
      resetForm()
      router.refresh()
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteOwnerUser(deleteTarget.id)
      if (!result.success) return
      setDeleteTarget(null)
      router.refresh()
    })
  }

  function handleImpersonate(owner: OwnerWithBusiness) {
    setImpersonateName(owner.full_name ?? owner.email)
    setMagicLink(null)
    startTransition(async () => {
      const result = await impersonateUser(owner.id)
      if ('error' in result) { setFormError(result.error); return }
      setMagicLink(result.magicLink)
    })
  }

  function handleCopy() {
    if (!magicLink) return
    navigator.clipboard.writeText(magicLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('subtitle')}</p>
        </div>
        <Button onClick={() => { resetForm(); setCreateOpen(true) }} size="sm">
          <Plus size={15} className="mr-1.5" />
          {t('addOwner')}
        </Button>
      </div>

      {initialOwners.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">{t('noUsers')}</p>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('email')}</TableHead>
                <TableHead>{t('business')}</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialOwners.map((owner) => (
                <TableRow key={owner.id}>
                  <TableCell className="font-medium">{owner.full_name ?? '—'}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{owner.email}</TableCell>
                  <TableCell>
                    {owner.business_name ? (
                      <Badge variant="secondary">{owner.business_name}</Badge>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleImpersonate(owner)}
                        disabled={isPending}
                        className="text-gray-400 hover:text-brand-600 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-40"
                        aria-label={t('impersonate')}
                        title={t('impersonate')}
                      >
                        <UserCheck size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(owner)}
                        className="text-gray-400 hover:text-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={t('deleteTitle')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create owner dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="owner-name">{t('fullNameLabel')}</Label>
              <Input id="owner-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Carlos López" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="owner-email">{t('emailLabel')}</Label>
              <Input id="owner-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="carlos@mitienda.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="owner-password">{t('passwordLabel')}</Label>
              <Input id="owner-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label>{t('businessLabel')}</Label>
              <Select value={businessId} onValueChange={(v) => setBusinessId(v ?? 'none')}>
                <SelectTrigger>
                  <SelectValue placeholder={t('noBusiness')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('noBusiness')}</SelectItem>
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreate} disabled={isPending || !name || !email || !password}>
              {isPending ? t('saving') : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('deleteDesc', { name: deleteTarget?.full_name ?? deleteTarget?.email ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t('cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? t('deleting') : t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Impersonate dialog */}
      <Dialog open={!!magicLink || (isPending && !!impersonateName)} onOpenChange={(open) => { if (!open) { setMagicLink(null); setImpersonateName('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('impersonateTitle')}</DialogTitle>
            <DialogDescription>{t('impersonateDesc', { name: impersonateName })}</DialogDescription>
          </DialogHeader>
          {isPending && !magicLink ? (
            <p className="text-sm text-gray-400 py-4 text-center">Generando enlace...</p>
          ) : (
            <div className="space-y-3 py-2">
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600 break-all font-mono">
                {magicLink}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1">
                  <Copy size={13} className="mr-1.5" />
                  {copied ? '¡Copiado!' : t('copyLink')}
                </Button>
                <Button size="sm" onClick={() => window.open(magicLink!, '_blank')} className="flex-1">
                  <ExternalLink size={13} className="mr-1.5" />
                  {t('openLink')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
