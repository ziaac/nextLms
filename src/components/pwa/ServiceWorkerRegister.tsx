'use client'

import { useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt:     () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Deklarasi global agar TypeScript tidak komplain
declare global {
  interface Window {
    __deferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

// ── Tangkap beforeinstallprompt SESEGERA mungkin ────────────────────────
// Module ini di-load sebagai bagian dari bundle utama (non-dynamic),
// sehingga listener ini terpasang sebelum chunk PWAInstallPrompt selesai load.
// PWAInstallPrompt (dynamic ssr:false) akan membaca window.__deferredPrompt dari sini.
if (typeof window !== 'undefined') {
  window.addEventListener(
    'beforeinstallprompt',
    (e) => { 
      e.preventDefault(); 
      window.__deferredPrompt = e as BeforeInstallPromptEvent; 
    },
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