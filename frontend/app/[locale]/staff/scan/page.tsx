'use client'

import { useCallback, useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { processScan, ScanResult, ScanErrorCode } from '@/app/actions/scan'

// QRScanner uses html5-qrcode (browser-only) — must not run during SSR
const QRScanner = dynamic(
  () => import('@/components/QRScanner').then((m) => m.QRScanner),
  { ssr: false },
)

type PageState =
  | { phase: 'scanning' }
  | { phase: 'processing' }
  | { phase: 'result'; result: ScanResult }
  | { phase: 'camera_error'; message: string }

export default function StaffScanPage() {
  const t = useTranslations('staff.scan')
  const [state, setState] = useState<PageState>({ phase: 'scanning' })
  const [isPending, startTransition] = useTransition()

  const handleScan = useCallback(
    (decodedText: string) => {
      setState({ phase: 'processing' })

      startTransition(async () => {
        const result = await processScan(decodedText)
        setState({ phase: 'result', result })
      })
    },
    [],
  )

  const handleCameraError = useCallback((message: string) => {
    setState({ phase: 'camera_error', message })
  }, [])

  const reset = () => setState({ phase: 'scanning' })

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 to-white py-10 px-4">
      <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">{t('title')}</h1>

      {/* Camera / scanning phase */}
      {state.phase === 'scanning' && (
        <div className="max-w-sm mx-auto">
          <QRScanner
            onScan={handleScan}
            onError={handleCameraError}
            startingLabel={t('startCamera')}
            aimLabel={t('aim')}
          />
        </div>
      )}

      {/* Processing indicator */}
      {(state.phase === 'processing' || isPending) && (
        <div className="flex flex-col items-center gap-4 mt-12">
          <RefreshCw className="animate-spin text-brand-600" size={40} />
          <p className="text-gray-500">{t('processing')}</p>
        </div>
      )}

      {/* Result */}
      {state.phase === 'result' && (
        <div className="max-w-sm mx-auto flex flex-col items-center gap-6 mt-6">
          <ResultCard result={state.result} t={t} />
          <button
            onClick={reset}
            className="w-full py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors"
          >
            {t('scanAgain')}
          </button>
        </div>
      )}

      {/* Camera error */}
      {state.phase === 'camera_error' && (
        <div className="max-w-sm mx-auto flex flex-col items-center gap-4 mt-6">
          <XCircle className="text-red-500" size={48} />
          <p className="text-red-600 text-center text-sm">{t('errors.camera_error')}</p>
          <p className="text-gray-400 text-xs text-center">{state.message}</p>
          <button
            onClick={reset}
            className="w-full py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors"
          >
            {t('scanAgain')}
          </button>
        </div>
      )}
    </main>
  )
}

function ResultCard({
  result,
  t,
}: {
  result: ScanResult
  t: ReturnType<typeof useTranslations<'staff.scan'>>
}) {
  if (!result.success) {
    const errorKey = result.error as ScanErrorCode
    return (
      <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-col items-center gap-3">
        <XCircle className="text-red-500" size={40} />
        <p className="text-red-700 font-semibold text-center">
          {t(`errors.${errorKey}` as `errors.${ScanErrorCode}`)}
        </p>
      </div>
    )
  }

  if (result.type === 'stamp') {
    return (
      <div className="w-full rounded-2xl border border-green-200 bg-green-50 p-6 flex flex-col items-center gap-3">
        <CheckCircle className="text-green-500" size={40} />
        <p className="text-green-700 font-bold text-lg">{t('stamped')}</p>
        <p className="text-green-600 text-sm">
          {t('stampsProgress', {
            count: result.stampsCount,
            goal: result.stampsGoal,
          })}
        </p>
        {result.rewardAvailable && (
          <div className="mt-2 rounded-xl bg-amber-100 border border-amber-300 px-4 py-2">
            <p className="text-amber-700 font-semibold text-sm text-center">
              🎉 {t('rewardAvailable')}
            </p>
          </div>
        )}
      </div>
    )
  }

  // reward redemption
  return (
    <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-6 flex flex-col items-center gap-3">
      <CheckCircle className="text-amber-500" size={40} />
      <p className="text-amber-700 font-bold text-lg">{t('rewardRedeemed')}</p>
    </div>
  )
}
