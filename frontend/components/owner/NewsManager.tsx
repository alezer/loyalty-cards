'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Plus, Pencil, Trash2, Newspaper, ChevronDown, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createNews, updateNews, deleteNews } from '@/app/actions/news'
import type { BusinessNews } from '@/lib/types/database'

interface Props {
  initialNews: BusinessNews[]
  hasNoBusiness: boolean
}

export function NewsManager({ initialNews, hasNoBusiness }: Props) {
  const t = useTranslations('owner.news')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [expandedNews, setExpandedNews] = useState<Set<string>>(new Set())
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BusinessNews | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BusinessNews | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso))

  function toggleNews(id: string) {
    setExpandedNews((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(false)
    setImageError(null)
    setFormError(null)
  }

  function openEdit(item: BusinessNews) {
    setTitle(item.title)
    setDescription(item.description)
    setImageFile(null)
    setImagePreview(item.image_url)
    setRemoveImage(false)
    setImageError(null)
    setFormError(null)
    setEditTarget(item)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      e.target.value = ''
      setImageError(t('errorImageTooLarge'))
      return
    }
    setImageError(null)
    setRemoveImage(false)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function handleRemoveImage() {
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(true)
    setImageError(null)
  }

  function handleCreate() {
    if (!title.trim() || !description.trim()) return
    setFormError(null)
    startTransition(async () => {
      const result = await createNews(title.trim(), description.trim(), imageFile)
      if (!result.success) {
        setFormError(result.error)
        return
      }
      setCreateOpen(false)
      resetForm()
      router.refresh()
    })
  }

  function handleUpdate() {
    if (!editTarget || !title.trim() || !description.trim()) return
    setFormError(null)
    startTransition(async () => {
      const result = await updateNews(
        editTarget.id,
        title.trim(),
        description.trim(),
        imageFile,
        removeImage,
      )
      if (!result.success) {
        setFormError(result.error)
        return
      }
      setEditTarget(null)
      resetForm()
      router.refresh()
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteNews(deleteTarget.id)
      if (!result.success) return
      setDeleteTarget(null)
      router.refresh()
    })
  }

  if (hasNoBusiness) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Newspaper size={32} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">{t('noBusiness')}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <Button
          onClick={() => {
            resetForm()
            setCreateOpen(true)
          }}
          size="sm"
        >
          <Plus size={15} className="mr-1.5" />
          {t('addNews')}
        </Button>
      </div>

      {initialNews.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">{t('noNews')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {initialNews.map((item) => {
            const expanded = expandedNews.has(item.id)
            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <button
                  onClick={() => toggleNews(item.id)}
                  className="w-full text-left px-5 pt-4 pb-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-gray-900 leading-snug">{item.title}</p>
                    <ChevronDown
                      size={15}
                      className={`shrink-0 mt-0.5 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                  <p className={`text-sm text-gray-500 mt-1 ${expanded ? 'whitespace-pre-line' : 'line-clamp-2'}`}>
                    {item.description}
                  </p>
                  {expanded && item.image_url && (
                    <img
                      src={item.image_url}
                      alt=""
                      className="mt-3 w-full rounded-lg object-cover max-h-56"
                    />
                  )}
                  <p className="text-xs text-gray-400 mt-2">{formatDate(item.created_at)}</p>
                </button>
                <div className="flex items-center gap-1 px-3 pb-2 border-t border-gray-100 pt-2">
                  <button
                    onClick={() => openEdit(item)}
                    className="text-gray-400 hover:text-brand-600 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    aria-label={t('edit')}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="text-gray-400 hover:text-red-500 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    aria-label={t('delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createTitle')}</DialogTitle>
            <DialogDescription>{t('createDesc')}</DialogDescription>
          </DialogHeader>
          <NewsForm
            title={title}
            description={description}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            imagePreview={imagePreview}
            onImageChange={handleImageChange}
            onRemoveImage={handleRemoveImage}
            imageError={imageError}
            error={formError}
            t={t}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isPending || !title.trim() || !description.trim()}
            >
              {isPending ? t('creating') : t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null)
            resetForm()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editTitle')}</DialogTitle>
          </DialogHeader>
          <NewsForm
            title={title}
            description={description}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            imagePreview={imagePreview}
            onImageChange={handleImageChange}
            onRemoveImage={handleRemoveImage}
            imageError={imageError}
            error={formError}
            t={t}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isPending || !title.trim() || !description.trim()}
            >
              {isPending ? t('saving') : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('deleteDesc', { title: deleteTarget?.title ?? '' })}
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

function NewsForm({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  imagePreview,
  onImageChange,
  onRemoveImage,
  imageError,
  error,
  t,
}: {
  title: string
  description: string
  onTitleChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  imagePreview: string | null
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: () => void
  imageError: string | null
  error: string | null
  t: ReturnType<typeof useTranslations<'owner.news'>>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="news-title">{t('titleLabel')}</Label>
        <Input
          id="news-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t('titlePlaceholder')}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="news-description">{t('descriptionLabel')}</Label>
        <Textarea
          id="news-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={t('descriptionPlaceholder')}
          rows={4}
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t('imageLabel')}</Label>
        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt=""
              className="w-full rounded-lg object-cover max-h-48 border border-gray-200"
            />
            <button
              type="button"
              onClick={() => {
                onRemoveImage()
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              aria-label={t('removeImage')}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="cursor-pointer flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors">
              <Upload size={13} />
              {t('selectImage')}
            </span>
            <span className="text-xs text-gray-400">max 5 MB</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onImageChange}
            />
          </label>
        )}
        {imageError && <p className="text-xs text-red-500">{imageError}</p>}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
