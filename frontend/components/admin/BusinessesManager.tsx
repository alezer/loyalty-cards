'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
import { createBusiness, updateBusiness, deleteBusiness } from '@/app/actions/admin'
import type { BusinessWithOwner } from '@/lib/types/database'

interface Props {
  initialBusinesses: BusinessWithOwner[]
}

type EditTarget = { id: string; name: string; stampsGoal: number }

export function BusinessesManager({ initialBusinesses }: Props) {
  const t = useTranslations('admin.businesses')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BusinessWithOwner | null>(null)

  const [name, setName] = useState('')
  const [stampsGoal, setStampsGoal] = useState('10')
  const [formError, setFormError] = useState<string | null>(null)

  function openCreate() {
    setName('')
    setStampsGoal('10')
    setFormError(null)
    setCreateOpen(true)
  }

  function openEdit(biz: BusinessWithOwner) {
    setName(biz.name)
    setStampsGoal(String(biz.stamps_goal))
    setFormError(null)
    setEditTarget({ id: biz.id, name: biz.name, stampsGoal: biz.stamps_goal })
  }

  function handleCreate() {
    const goal = parseInt(stampsGoal)
    if (!name || !goal || goal < 1) return
    setFormError(null)
    startTransition(async () => {
      const result = await createBusiness(name, goal)
      if (!result.success) { setFormError(result.error); return }
      setCreateOpen(false)
      router.refresh()
    })
  }

  function handleEdit() {
    if (!editTarget) return
    const goal = parseInt(stampsGoal)
    if (!name || !goal || goal < 1) return
    setFormError(null)
    startTransition(async () => {
      const result = await updateBusiness(editTarget.id, name, goal)
      if (!result.success) { setFormError(result.error); return }
      setEditTarget(null)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteBusiness(deleteTarget.id)
      if (!result.success) { setFormError(result.error); return }
      setDeleteTarget(null)
      router.refresh()
    })
  }

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(
      new Date(iso),
    )

  const FormFields = () => (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="biz-name">{t('nameLabel')}</Label>
        <Input
          id="biz-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mi Cafetería"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="biz-goal">{t('stampsGoalLabel')}</Label>
        <Input
          id="biz-goal"
          type="number"
          min={1}
          value={stampsGoal}
          onChange={(e) => setStampsGoal(e.target.value)}
        />
      </div>
      {formError && <p className="text-sm text-red-500">{formError}</p>}
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('subtitle')}</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus size={15} className="mr-1.5" />
          {t('addBusiness')}
        </Button>
      </div>

      {initialBusinesses.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">{t('noBusiness')}</p>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead className="text-right">{t('stampsGoal')}</TableHead>
                <TableHead>{t('owner')}</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialBusinesses.map((biz) => (
                <TableRow key={biz.id}>
                  <TableCell className="font-medium">{biz.name}</TableCell>
                  <TableCell className="text-right">{biz.stamps_goal}</TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {biz.owner_name ?? biz.owner_email ?? '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(biz)}
                        className="text-gray-400 hover:text-brand-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={t('editTitle')}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(biz)}
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

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createTitle')}</DialogTitle>
          </DialogHeader>
          <FormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreate} disabled={isPending || !name}>
              {isPending ? t('saving') : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editTitle')}</DialogTitle>
          </DialogHeader>
          <FormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>{t('cancel')}</Button>
            <Button onClick={handleEdit} disabled={isPending || !name}>
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
              {t('deleteDesc', { name: deleteTarget?.name ?? '' })}
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
    </div>
  )
}
