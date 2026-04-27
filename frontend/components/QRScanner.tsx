'use client'

import { useEffect, useRef, useState } from 'react'

// html5-qrcode accesses document/window, so it is loaded dynamically inside
// useEffect to guarantee it only runs in the browser (never during SSR).

const SCANNER_ELEMENT_ID = 'html5-qr-scanner'

export type ScannerStatus = 'starting' | 'scanning' | 'stopped' | 'error'

interface QRScannerProps {
  onScan: (decodedText: string) => void
  onError?: (message: string) => void
  startingLabel: string // translated "Starting camera..."
  aimLabel: string // translated "Aim at the QR code"
}

export function QRScanner({ onScan, onError, startingLabel, aimLabel }: QRScannerProps) {
  const [status, setStatus] = useState<ScannerStatus>('starting')
  // Guard against calling onScan more than once if the scanner fires twice
  // before stop() completes.
  const hasScannedRef = useRef(false)
  const scannerRef = useRef<{ stop: () => Promise<void>; isScanning: boolean } | null>(null)

  useEffect(() => {
    let cancelled = false

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelled) return

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID)
      scannerRef.current = scanner

      scanner
        .start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            // Suppress per-frame "QR not found" noise in the console
            disableFlip: false,
          },
          (decodedText) => {
            if (hasScannedRef.current) return
            hasScannedRef.current = true

            // Stop scanning after first successful read
            scanner
              .stop()
              .catch(() => {})
              .finally(() => {
                if (!cancelled) setStatus('stopped')
              })

            onScan(decodedText)
          },
          // QR-not-found callback — intentionally ignored to avoid console spam
          () => {},
        )
        .then(() => {
          if (!cancelled) setStatus('scanning')
        })
        .catch((err: unknown) => {
          if (cancelled) return
          setStatus('error')
          onError?.(err instanceof Error ? err.message : String(err))
        })
    })

    return () => {
      cancelled = true
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {})
      }
    }
    // onScan and onError are stable refs in practice (passed from parent with useCallback
    // or as inline functions from a component that re-renders infrequently).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* html5-qrcode mounts the video feed directly into this div by ID */}
      <div
        id={SCANNER_ELEMENT_ID}
        className="w-full max-w-sm rounded-xl overflow-hidden border border-gray-200 shadow"
      />

      {status === 'starting' && (
        <p className="text-sm text-gray-500 animate-pulse">{startingLabel}</p>
      )}
      {status === 'scanning' && (
        <p className="text-sm text-gray-500">{aimLabel}</p>
      )}
    </div>
  )
}
