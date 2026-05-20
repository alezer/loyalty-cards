'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Plus, Trash2, UserX } from 'lucide-react'
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
import { createStaffMember, deleteStaffMember } from '@/app/actions/team'
import type { Profile } from '@/lib/types/database'

interface Props {
  initialMembers: Profile[]
  hasNoBusiness: boolean
}

export function TeamManager({ initialMembers, hasNoBusiness }: Props) {
  const t = useTranslations('owner.team')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso))

  function resetForm() {
    setName('')
    setEmail('')
    setPassword('')
    setFormError(null)
  }

  function handleCreate() {
    if (!name || !email || !password) return
    setFormError(null)
    startTransition(async () => {
      const result = await createStaffMember(email, password, name)
      if (!result.success) {
        setFormError(result.error)
        return
      }
      setCreateOpen(false)
      resetForm()
      router.refresh()
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteStaffMember(deleteTarget.id)
      if (!result.success) {
        setFormError(result.error)
        return
      }
      setDeleteTarget(null)
      router.refresh()
    })
  }

  if (hasNoBusiness) {
    return (
      <div className="text-center py-16 text-gray-400">
        <UserX size={32} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">{t('noBusiness')}</p>
      </div>
    )
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
          {t('addStaff')}
        </Button>
      </div>

      {/* Staff table */}
      {initialMembers.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">{t('noStaff')}</p>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('email')}</TableHead>
                <TableHead>{t('since')}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.full_name ?? '—'}
                  </TableCell>
                  <TableCell className="text-gray-500">{member.email}</TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {formatDate(member.created_at)}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => setDeleteTarget(member)}
                      className="text-gray-400 hover:text-red-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label={t('delete')}
                    >
                      <Trash2 size={15} />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createTitle')}</DialogTitle>
            <DialogDescription>{t('createDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="staff-name">{t('fullNameLabel')}</Label>
              <Input
                id="staff-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ana García"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-email">{t('emailLabel')}</Label>
              <Input
                id="staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ana@comercio.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-password">{t('passwordLabel')}</Label>
              <Input
                id="staff-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {formError && (
              <p className="text-sm text-red-500">{formError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isPending || !name || !email || !password}
            >
              {isPending ? t('creating') : t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('deleteDesc', { name: deleteTarget?.full_name ?? deleteTarget?.email ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? t('deleting') : t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
