'use client'

import { useEffect } from 'react'

// ── Tangkap beforeinstallprompt SESEGERA mungkin ────────────────────────
// Module ini di-load sebagai bagian dari bundle utama (non-dynamic),
// sehingga listener ini terpasang sebelum chunk PWAInstallPrompt selesai load.
// PWAInstallPrompt (dynamic ssr:false) akan membaca _earlyPrompt dari sini.
export let _earlyPrompt: BeforeInstallPromptEvent | null = null

interface BeforeInstallPromptEvent extends Event {
  prompt:     () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

if (typeof window !== 'undefined') {
  window.addEventListener(
    'beforeinstallprompt',
    (e) => { e.preventDefault(); _earlyPrompt = e as BeforeInstallPromptEvent },
    { once: true },
  )
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  return null
}
