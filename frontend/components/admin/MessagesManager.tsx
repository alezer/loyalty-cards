'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteContactMessage } from '@/app/actions/admin'
import type { ContactMessage } from '@/app/[locale]/admin/messages/page'

interface Props {
  initialMessages: ContactMessage[]
}

export function MessagesManager({ initialMessages }: Props) {
  const t = useTranslations('admin.messages')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [messages, setMessages] = useState(initialMessages)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null)

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    const id = deleteTarget.id
    startTransition(async () => {
      const result = await deleteContactMessage(id)
      if (result.success) {
        setMessages(prev => prev.filter(m => m.id !== id))
        setExpandedIds(prev => { const next = new Set(prev); next.delete(id); return next })
        setDeleteTarget(null)
        router.refresh()
      }
    })
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('subtitle')}</p>
      </div>

      {messages.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">{t('noMessages')}</p>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
          {messages.map(msg => {
            const expanded = expandedIds.has(msg.id)
            return (
              <div key={msg.id}>
                <button
                  onClick={() => toggleExpand(msg.id)}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-400 flex-shrink-0">
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0 w-36">
                    {formatDate(msg.created_at)}
                  </span>
                  <span className="text-sm font-medium text-gray-700 flex-shrink-0 w-48 truncate">
                    {msg.email}
                  </span>
                  <span className="text-sm text-gray-500 truncate flex-1 min-w-0">
                    {msg.message}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteTarget(msg) }}
                    className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    aria-label={t('deleteTitle')}
                  >
                    <Trash2 size={14} />
                  </button>
                </button>

                {expanded && (
                  <div className="px-4 pb-4 pt-1 bg-gray-50 border-t border-gray-100">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('deleteDesc', { email: deleteTarget?.email ?? '' })}
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
