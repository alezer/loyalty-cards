'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { RefreshCw } from 'lucide-react'
import { generateStampQR, generateRewardQR } from '@/lib/qr'

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
  rewardLabel: string
}

export function RewardQRCard({ rewardCode, rewardLabel }: RewardQRCardProps) {
  const qrValue = generateRewardQR(rewardCode)

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200">
      <div className="p-3 bg-white rounded-xl shadow-sm">
        <QRCodeSVG value={qrValue} size={180} level="M" />
      </div>
      <p className="text-xs text-amber-600 text-center">{rewardLabel}</p>
    </div>
  )
}
