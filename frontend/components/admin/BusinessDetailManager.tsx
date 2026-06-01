'use client'

import { useState, useTransition } from 'react'
import { useRouter, Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Plus, Trash2, UserCheck, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { updateBusiness, createOwnerUser, deleteOwnerUser, impersonateUser } from '@/app/actions/admin'
import type { OwnerWithBusiness } from '@/lib/types/database'

interface Props {
  business: { id: string; name: string; stamps_goal: number }
  owners: OwnerWithBusiness[]
}

export function BusinessDetailManager({ business, owners }: Props) {
  const tBiz = useTranslations('admin.businesses')
  const tUsers = useTranslations('admin.users')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Business form
  const [displayName, setDisplayName] = useState(business.name)
  const [name, setName] = useState(business.name)
  const [stampsGoal, setStampsGoal] = useState(String(business.stamps_goal))
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Owner create form
  const [createOpen, setCreateOpen] = useState(false)
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [ownerFormError, setOwnerFormError] = useState<string | null>(null)

  // Owner delete / impersonate
  const [deleteTarget, setDeleteTarget] = useState<OwnerWithBusiness | null>(null)
  const [magicLink, setMagicLink] = useState<string | null>(null)
  const [impersonateName, setImpersonateName] = useState('')
  const [copied, setCopied] = useState(false)

  function resetOwnerForm() {
    setOwnerName('')
    setOwnerEmail('')
    setOwnerPassword('')
    setOwnerFormError(null)
  }

  function handleSaveBusiness() {
    const goal = parseInt(stampsGoal)
    if (!name || !goal || goal < 1) return
    setFormError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await updateBusiness(business.id, name, goal)
      if (!result.success) { setFormError(result.error); return }
      setDisplayName(name)
      setSaved(true)
      router.refresh()
    })
  }

  function handleCreateOwner() {
    if (!ownerName || !ownerEmail || !ownerPassword) return
    setOwnerFormError(null)
    startTransition(async () => {
      const result = await createOwnerUser(ownerEmail, ownerPassword, ownerName, business.id)
      if (!result.success) { setOwnerFormError(result.error); return }
      setCreateOpen(false)
      resetOwnerForm()
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
      if ('error' in result) return
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
      <Link
        href={'/admin/businesses' as never}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} />
        {tBiz('title')}
      </Link>

      {/* Business edit section */}
      <div className="mb-10">
        <h1 className="text-xl font-bold text-gray-900 mb-6">{displayName}</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="biz-name">{tBiz('nameLabel')}</Label>
            <Input
              id="biz-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setSaved(false) }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="biz-goal">{tBiz('stampsGoalLabel')}</Label>
            <Input
              id="biz-goal"
              type="number"
              min={1}
              value={stampsGoal}
              onChange={(e) => { setStampsGoal(e.target.value); setSaved(false) }}
            />
          </div>
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          {saved && <p className="text-sm text-green-600">{tBiz('saved')}</p>}
          <Button onClick={handleSaveBusiness} disabled={isPending || !name} size="sm">
            {isPending ? tBiz('saving') : tBiz('save')}
          </Button>
        </div>
      </div>

      {/* Owners section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">{tUsers('title')}</h2>
          <Button onClick={() => { resetOwnerForm(); setCreateOpen(true) }} size="sm">
            <Plus size={15} className="mr-1.5" />
            {tUsers('addOwner')}
          </Button>
        </div>

        {owners.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">{tUsers('noUsers')}</p>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tUsers('name')}</TableHead>
                  <TableHead>{tUsers('email')}</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {owners.map((owner) => (
                  <TableRow key={owner.id}>
                    <TableCell className="font-medium">{owner.full_name ?? '—'}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{owner.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleImpersonate(owner)}
                          disabled={isPending}
                          className="text-gray-400 hover:text-brand-600 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-40"
                          aria-label={tUsers('impersonate')}
                          title={tUsers('impersonate')}
                        >
                          <UserCheck size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(owner)}
                          className="text-gray-400 hover:text-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                          aria-label={tUsers('deleteTitle')}
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
      </div>

      {/* Create owner dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetOwnerForm() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tUsers('createTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="owner-name">{tUsers('fullNameLabel')}</Label>
              <Input id="owner-name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Carlos López" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="owner-email">{tUsers('emailLabel')}</Label>
              <Input id="owner-email" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="carlos@mitienda.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="owner-password">{tUsers('passwordLabel')}</Label>
              <Input id="owner-password" type="password" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {ownerFormError && <p className="text-sm text-red-500">{ownerFormError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{tUsers('cancel')}</Button>
            <Button onClick={handleCreateOwner} disabled={isPending || !ownerName || !ownerEmail || !ownerPassword}>
              {isPending ? tUsers('saving') : tUsers('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete owner dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tUsers('deleteTitle')}</DialogTitle>
            <DialogDescription>
              {tUsers('deleteDesc', { name: deleteTarget?.full_name ?? deleteTarget?.email ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{tUsers('cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? tUsers('deleting') : tUsers('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Impersonate dialog */}
      <Dialog
        open={!!magicLink || (isPending && !!impersonateName)}
        onOpenChange={(open) => { if (!open) { setMagicLink(null); setImpersonateName('') } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tUsers('impersonateTitle')}</DialogTitle>
            <DialogDescription>{tUsers('impersonateDesc', { name: impersonateName })}</DialogDescription>
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
                  {copied ? '¡Copiado!' : tUsers('copyLink')}
                </Button>
                <Button size="sm" onClick={() => window.open(magicLink!, '_blank')} className="flex-1">
                  <ExternalLink size={13} className="mr-1.5" />
                  {tUsers('openLink')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
