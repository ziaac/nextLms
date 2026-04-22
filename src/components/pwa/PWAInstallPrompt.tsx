'use client'

import { useEffect, useState } from 'react'
import { Download, Share, Plus } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as Record<string, unknown>).MSStream
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as unknown as Record<string, boolean>).standalone === true)
  )
}

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false)
  const [isIOSDevice, setIsIOSDevice] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // Jangan tampilkan jika sudah diinstall
    if (isInStandaloneMode()) return

    const ios = isIOS()
    setIsIOSDevice(ios)

    if (!ios) {
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e as BeforeInstallPromptEvent)
        setShow(true)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    } else {
      // iOS: tampilkan panduan manual
      // Hanya tampil sekali per session
      if (!sessionStorage.getItem('pwa-ios-shown')) {
        setShow(true)
      }
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    setInstalling(true)
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
    }
    setInstalling(false)
    setDeferredPrompt(null)
  }

  function handleLater() {
    if (isIOSDevice) {
      sessionStorage.setItem('pwa-ios-shown', '1')
    }
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-end sm:justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-600 px-6 py-5 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/android-chrome-192x192.png" alt="App Icon" className="w-14 h-14 rounded-2xl shadow-lg" />
          <div>
            <p className="text-white font-bold text-lg leading-tight">LMS MAN 2 Makassar</p>
            <p className="text-emerald-100 text-sm">lms.man2kotamakassar.sch.id</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-gray-900 dark:text-white font-semibold text-base mb-1">
            Install Aplikasi
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            {isIOSDevice
              ? 'Tambahkan ke Home Screen agar bisa diakses seperti aplikasi.'
              : 'Install aplikasi agar bisa diakses lebih cepat tanpa membuka browser.'}
          </p>

          {isIOSDevice ? (
            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Share size={18} className="text-emerald-600 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Tap tombol <strong>Share</strong> di browser Safari
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Plus size={18} className="text-emerald-600 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Pilih <strong>Add to Home Screen</strong>
                </span>
              </div>
            </div>
          ) : null}

          <div className="flex gap-3">
            <button
              onClick={handleLater}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Nanti
            </button>
            {!isIOSDevice && (
              <button
                onClick={handleInstall}
                disabled={installing}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <Download size={16} />
                {installing ? 'Menginstall...' : 'Install'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
