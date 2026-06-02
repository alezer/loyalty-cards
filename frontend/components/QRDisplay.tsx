'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { RefreshCw } from 'lucide-react'
import { generateStampQR, generateRewardQR, QR_EXPIRY_MS, formatCountdown } from '@/lib/qr'

const REFRESH_INTERVAL_MS = 20 * 1000

interface StampQRCardProps {
  customerId: string
  generateNewLabel: string
  showToStaffLabel: string
}

export function StampQRCard({ customerId, generateNewLabel, showToStaffLabel }: StampQRCardProps) {
  const [qrValue, setQrValue] = useState(() => generateStampQR(customerId))

  function regenerate() {
    setQrValue(generateStampQR(customerId))
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="p-4 bg-white rounded-2xl shadow-md border border-gray-100">
        <QRCodeSVG value={qrValue} size={240} level="M" />
      </div>
      <button
        onClick={regenerate}
        className="flex items-center gap-1.5 text-sm text-brand-600 font-medium hover:text-brand-700 active:scale-95 transition-transform"
      >
        <RefreshCw size={14} />
        {generateNewLabel}
      </button>
      <p className="text-xs text-gray-400 text-center max-w-xs">{showToStaffLabel}</p>
    </div>
  )
}

interface RewardQRCardProps {
  rewardCode: string
  expiresInLabel: string
  rewardLabel: string
}

export function RewardQRCard({ rewardCode, expiresInLabel, rewardLabel }: RewardQRCardProps) {
  const [qrValue, setQrValue] = useState(() => generateRewardQR(rewardCode))
  const [generatedAt, setGeneratedAt] = useState(() => Date.now())
  const [remainingMs, setRemainingMs] = useState(QR_EXPIRY_MS)

  useEffect(() => {
    const refreshTimer = setInterval(() => {
      const now = Date.now()
      setQrValue(generateRewardQR(rewardCode))
      setGeneratedAt(now)
      setRemainingMs(QR_EXPIRY_MS)
    }, REFRESH_INTERVAL_MS)

    const countdownTimer = setInterval(() => {
      setRemainingMs(QR_EXPIRY_MS - (Date.now() - generatedAt))
    }, 1000)

    return () => {
      clearInterval(refreshTimer)
      clearInterval(countdownTimer)
    }
  }, [rewardCode, generatedAt])

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200">
      <div className="p-3 bg-white rounded-xl shadow-sm">
        <QRCodeSVG value={qrValue} size={180} level="M" />
      </div>
      <p className="text-xs text-amber-700 font-medium">
        {expiresInLabel}: {formatCountdown(remainingMs)}
      </p>
      <p className="text-xs text-amber-600 text-center">{rewardLabel}</p>
    </div>
  )
}
