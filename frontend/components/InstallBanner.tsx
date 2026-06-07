'use client'

import { useEffect, useState } from 'react'
import { X, Share, PlusSquare } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type BannerState = 'hidden' | 'ios' | 'android'

export function InstallBanner() {
  const [state, setState] = useState<BannerState>('hidden')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Already installed as standalone app
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // User already dismissed this session
    if (sessionStorage.getItem('pwa-banner-dismissed')) return

    const isIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !('MSStream' in window)

    if (isIOS) {
      setState('ios')
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setState('android')
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    sessionStorage.setItem('pwa-banner-dismissed', '1')
    setState('hidden')
  }

  async function installAndroid() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setState('hidden')
    else dismiss()
  }

  if (state === 'hidden') return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 bg-white shadow-lg">
      <div className="mx-auto max-w-lg p-4">
        <button
          onClick={dismiss}
          aria-label="Cerrar"
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-192.png"
            alt=""
            className="h-12 w-12 rounded-xl flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900">Instalar Loyalty Cards</p>

            {state === 'android' && (
              <>
                <p className="text-xs text-gray-500 mt-0.5">
                  Añade la app a tu pantalla de inicio para acceso rápido.
                </p>
                <button
                  onClick={installAndroid}
                  className="mt-3 rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 active:bg-green-800"
                >
                  Instalar
                </button>
              </>
            )}

            {state === 'ios' && (
              <>
                <p className="text-xs text-gray-500 mt-0.5">
                  Añade la app a tu pantalla de inicio:
                </p>
                <ol className="mt-2 space-y-1.5 text-xs text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="font-medium">1.</span>
                    <span>Toca</span>
                    <Share className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="font-medium">Compartir</span>
                    <span>en Safari</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-medium">2.</span>
                    <span>Toca</span>
                    <PlusSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">Añadir a pantalla de inicio</span>
                  </li>
                </ol>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
