'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Building2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveBusinessDetails } from '@/app/actions/business'
import type { Business, BusinessOpeningHours } from '@/lib/types/database'

const DAYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const
type Day = (typeof DAYS)[number]

interface DayHours {
  open: string
  close: string
}
type HoursState = Record<Day, DayHours | null>

function initHours(opening_hours: BusinessOpeningHours | null): HoursState {
  return Object.fromEntries(
    DAYS.map((d) => [d, opening_hours?.[d] ?? null]),
  ) as HoursState
}

interface Props {
  business: Business | null
  hasNoBusiness: boolean
}

export function BusinessForm({ business, hasNoBusiness }: Props) {
  const t = useTranslations('owner.business')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const [hours, setHours] = useState<HoursState>(() =>
    initHours(business?.opening_hours ?? null),
  )
  const [logoPreview, setLogoPreview] = useState<string | null>(
    business?.logo_url ?? null,
  )
  const [imagePreview, setImagePreview] = useState<string | null>(
    business?.image_url ?? null,
  )
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleImageChange(
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: (url: string | null) => void,
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  function toggleDay(day: Day) {
    setHours((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { open: '09:00', close: '18:00' },
    }))
  }

  function updateDayTime(day: Day, field: 'open' | 'close', value: string) {
    setHours((prev) => ({
      ...prev,
      [day]: prev[day] ? { ...prev[day]!, [field]: value } : prev[day],
    }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!formRef.current) return
    setSaved(false)
    setError(null)

    const fd = new FormData(formRef.current)

    for (const day of DAYS) {
      const h = hours[day]
      fd.set(`hours_${day}_is_open`, h ? 'true' : 'false')
      fd.set(`hours_${day}_from`, h?.open ?? '')
      fd.set(`hours_${day}_to`, h?.close ?? '')
    }

    startTransition(async () => {
      const result = await saveBusinessDetails(fd)
      if (!result.success) {
        setError(t('errorGeneric'))
        return
      }
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    })
  }

  if (hasNoBusiness) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Building2 size={32} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">{t('noBusiness')}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('subtitle')}</p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
        {/* Logo */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="space-y-3">
            <Label>{t('logoLabel')}</Label>
            <p className="text-xs text-gray-400">{t('logoHint')}</p>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="logo preview"
                  className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-300">
                  <Building2 size={24} />
                </div>
              )}
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                  <Upload size={13} />
                  {logoPreview ? t('changeImage') : t('selectImage')}
                </span>
                <input
                  type="file"
                  name="logo"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handleImageChange(e, setLogoPreview)}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Text fields */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="address">{t('addressLabel')}</Label>
            <Input
              id="address"
              name="address"
              defaultValue={business?.address ?? ''}
              placeholder={t('addressPlaceholder')}
            />
          </div>

          {/* Instagram */}
          <div className="space-y-1.5">
            <Label htmlFor="instagram">{t('instagramLabel')}</Label>
            <Input
              id="instagram"
              name="instagram"
              defaultValue={business?.instagram ?? ''}
              placeholder={t('instagramPlaceholder')}
            />
          </div>

          {/* Reward */}
          <div className="space-y-1.5">
            <Label htmlFor="reward">{t('rewardLabel')}</Label>
            <Input
              id="reward"
              name="reward"
              defaultValue={business?.reward ?? ''}
              placeholder={t('rewardPlaceholder')}
            />
          </div>
        </div>

        {/* Opening hours */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <Label>{t('openingHoursLabel')}</Label>
          <div className="space-y-2">
            {DAYS.map((day) => {
              const h = hours[day]
              return (
                <div key={day} className="flex items-center gap-3 min-h-[40px]">
                  {/* Day toggle */}
                  <button
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={[
                      'w-5 h-5 rounded flex-shrink-0 border-2 transition-colors flex items-center justify-center',
                      h
                        ? 'bg-brand-600 border-brand-600'
                        : 'bg-white border-gray-300 hover:border-gray-400',
                    ].join(' ')}
                    aria-pressed={!!h}
                    aria-label={t(`days.${day}`)}
                  >
                    {h && (
                      <svg
                        viewBox="0 0 10 8"
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M1 4l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  {/* Day name */}
                  <span className="w-24 text-sm font-medium text-gray-700 flex-shrink-0">
                    {t(`days.${day}`)}
                  </span>

                  {/* Time inputs or "Closed" */}
                  {h ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={h.open}
                        onChange={(e) => updateDayTime(day, 'open', e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <span className="text-xs text-gray-400">{t('to')}</span>
                      <input
                        type="time"
                        value={h.close}
                        onChange={(e) => updateDayTime(day, 'close', e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">{t('closed')}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Business image */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-3">
          <Label>{t('imageLabel')}</Label>
          <p className="text-xs text-gray-400">{t('imageHint')}</p>
          <div className="space-y-3">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="business preview"
                className="w-full max-w-sm h-40 rounded-xl object-cover border border-gray-200"
              />
            )}
            <label className="cursor-pointer inline-block">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                <Upload size={13} />
                {imagePreview ? t('changeImage') : t('selectImage')}
              </span>
              <input
                type="file"
                name="image"
                accept="image/*"
                className="sr-only"
                onChange={(e) => handleImageChange(e, setImagePreview)}
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? tCommon('saving') : tCommon('save')}
          </Button>
          {saved && <p className="text-sm text-green-600">{t('saved')}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </form>
    </div>
  )
}
