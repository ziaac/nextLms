'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Download, Share, Plus, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt:     () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    __deferredPrompt?: BeforeInstallPromptEvent | null
  }
}

// ── Persistence ──────────────────────────────────────────────────────
// Gunakan localStorage agar dismiss bertahan lintas session/refresh.
// Prompt tidak akan muncul lagi selama COOLDOWN_DAYS hari.
const STORAGE_KEY   = 'pwa-prompt-dismissed-at'
const COOLDOWN_DAYS = 30
const SHOW_DELAY_MS = 4000  // Tunda 4 detik agar tidak langsung muncul saat load

function isDismissedRecently(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY)
    if (!val) return false
    const daysSince = (Date.now() - parseInt(val, 10)) / (1000 * 60 * 60 * 24)
    return daysSince < COOLDOWN_DAYS
  } catch {
    return false
  }
}

function markDismissed() {
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch { /* ignore */ }
}

// ── Helpers ──────────────────────────────────────────────────────────
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as Record<string, unknown>).MSStream
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator &&
      (window.navigator as unknown as Record<string, boolean>).standalone === true)
  )
}

// ── Component ────────────────────────────────────────────────────────
export function PWAInstallPrompt() {
  const [show,           setShow]           = useState(false)
  const [isIOSDevice,    setIsIOSDevice]    = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing,     setInstalling]     = useState(false)

  useEffect(() => {
    // Tidak perlu prompt jika sudah standalone (sudah di-install)
    if (isInStandaloneMode()) return
    // Tidak perlu prompt jika baru saja di-dismiss
    if (isDismissedRecently()) return

    const ios = isIOS()
    setIsIOSDevice(ios)

    // Tunda kemunculan agar tidak langsung muncul saat halaman baru load
    const timer = setTimeout(() => {
      if (!ios) {
        if (window.__deferredPrompt) {
          setDeferredPrompt(window.__deferredPrompt)
          setShow(true)
          return
        }
        // Fallback: pasang listener jika event belum fire saat mount
        const handler = (e: Event) => {
          e.preventDefault()
          window.__deferredPrompt = e as BeforeInstallPromptEvent
          setDeferredPrompt(e as BeforeInstallPromptEvent)
          setShow(true)
        }
        window.addEventListener('beforeinstallprompt', handler, { once: true })
        return () => window.removeEventListener('beforeinstallprompt', handler)
      } else {
        // iOS: tampilkan panduan install sekali, lalu cooldown
        setShow(true)
      }
    }, SHOW_DELAY_MS)

    return () => clearTimeout(timer)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    setInstalling(true)
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setInstalling(false)
    setDeferredPrompt(null)
    window.__deferredPrompt = null
    // Jika accepted, sembunyikan selamanya (tidak perlu cooldown)
    if (outcome === 'accepted') {
      markDismissed()
    }
    setShow(false)
  }

  function handleLater() {
    markDismissed()
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-end sm:justify-center p-4 bg-black/50"
      onClick={handleLater}
    >
      <button
        onClick={handleLater}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
        aria-label="Tutup"
      >
        <X size={16} />
      </button>

      <div
        className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* App identity */}
        <div className="flex items-center gap-3.5 px-6 pt-5 pb-5">
          <div className="shrink-0 rounded-2xl overflow-hidden">
            <Image
              src="/android-chrome-192x192.png"
              alt="App Icon"
              width={56}
              height={56}
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-base text-gray-900 dark:text-white leading-tight">
              LMS MAN 2 Makassar
            </p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              lms.man2kotamakassar.sch.id
            </p>
          </div>
        </div>

        <div className="mx-6 border-t border-gray-100 dark:border-gray-800" />

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-gray-900 dark:text-white font-semibold text-[15px] mb-1">
            Pasang Aplikasi
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 leading-relaxed">
            {isIOSDevice
              ? 'Tambahkan ke Home Screen untuk akses cepat seperti aplikasi native.'
              : 'Install agar bisa dibuka langsung dari layar utama tanpa browser.'}
          </p>

          {isIOSDevice && (
            <div className="space-y-2.5 mb-5">
              <div className="flex items-center gap-3 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                <Share size={16} className="text-emerald-600 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Tap tombol <strong>Share</strong> di Safari
                </span>
              </div>
              <div className="flex items-center gap-3 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                <Plus size={16} className="text-emerald-600 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Pilih <strong>Add to Home Screen</strong>
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2.5">
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
                <Download size={15} />
                {installing ? 'Memasang...' : 'Pasang'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
