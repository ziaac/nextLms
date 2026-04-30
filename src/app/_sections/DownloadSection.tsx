'use client'

import { useState } from 'react'
import { Button } from '@heroui/react'
import { Download, Monitor, X, ArrowRight } from 'lucide-react'

// Custom Play Store Icon
const PlayStoreIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
  </svg>
)

// Custom App Store Icon
const AppStoreIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
  </svg>
)

export function DownloadSection() {
  const [showPWAModal, setShowPWAModal] = useState(false)
  const [showDevModal, setShowDevModal] = useState(false)

  return (
    <>
      <section className="py-20 bg-white dark:bg-gray-950 relative overflow-hidden">
        {/* SVG Gradient Background - Diagonal Pattern */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="emerald-diagonal-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.04" />
                <stop offset="100%" stopColor="rgb(5, 150, 105)" stopOpacity="0.01" />
              </linearGradient>
              <linearGradient id="emerald-diagonal-2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(52, 211, 153)" stopOpacity="0.03" />
                <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.01" />
              </linearGradient>
            </defs>
            {/* Large Triangle Top Left */}
            <polygon 
              points="0,0 60%,0 0,70%" 
              fill="url(#emerald-diagonal-1)" 
            />
            {/* Large Triangle Bottom Right */}
            <polygon 
              points="100%,100% 40%,100% 100%,30%" 
              fill="url(#emerald-diagonal-2)" 
            />
            {/* Diagonal Accent Line */}
            <line 
              x1="0%" y1="100%" 
              x2="100%" y2="0%" 
              stroke="rgb(16, 185, 129)" 
              strokeOpacity="0.02" 
              strokeWidth="2"
            />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Header */}
          <div className="mb-10">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">
              Download Aplikasi
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Akses LMS di Perangkat Anda
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Download aplikasi atau install sebagai Progressive Web App
            </p>
          </div>

          {/* Download Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Play Store */}
            <button
              onClick={() => setShowDevModal(true)}
              className="group flex items-start gap-4 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all text-left"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-2 border-emerald-500/30 group-hover:border-emerald-500/50 transition-colors">
                <PlayStoreIcon className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold mb-1 text-gray-900 dark:text-white">
                  Google Play Store
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Download untuk Android
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Download
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>

            {/* App Store */}
            <button
              onClick={() => setShowDevModal(true)}
              className="group flex items-start gap-4 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all text-left"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-2 border-emerald-500/30 group-hover:border-emerald-500/50 transition-colors">
                <AppStoreIcon className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold mb-1 text-gray-900 dark:text-white">
                  Apple App Store
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Download untuk iOS
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Download
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>

            {/* PWA */}
            <button
              onClick={() => setShowPWAModal(true)}
              className="group flex items-start gap-4 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all text-left"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-2 border-emerald-500/30 group-hover:border-emerald-500/50 transition-colors">
                <Monitor className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold mb-1 text-gray-900 dark:text-white">
                  Progressive Web App
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Install dari browser
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Cara Install
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* PWA Installation Modal */}
      {showPWAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    Cara Install Progressive Web App
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Install LMS sebagai aplikasi di perangkat Anda
                  </p>
                </div>
                <button
                  onClick={() => setShowPWAModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Android Chrome */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <PlayStoreIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">Android (Chrome)</h4>
                </div>
                <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300 ml-13">
                  <li className="flex gap-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-[24px]">1.</span>
                    <span>Buka website LMS di browser Chrome</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-[24px]">2.</span>
                    <span>Tap ikon <strong>menu (⋮)</strong> di pojok kanan atas</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-[24px]">3.</span>
                    <span>Pilih <strong>"Tambahkan ke layar utama"</strong> atau <strong>"Install app"</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-[24px]">4.</span>
                    <span>Tap <strong>"Install"</strong> atau <strong>"Tambahkan"</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-[24px]">5.</span>
                    <span>Aplikasi akan muncul di home screen Anda</span>
                  </li>
                </ol>
              </div>

              {/* iOS Safari */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <AppStoreIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">iOS (Safari)</h4>
                </div>
                <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300 ml-13">
                  <li className="flex gap-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-[24px]">1.</span>
                    <span>Buka website LMS di browser Safari</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-[24px]">2.</span>
                    <span>Tap ikon <strong>Share (□↑)</strong> di bagian bawah layar</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-[24px]">3.</span>
                    <span>Scroll ke bawah dan pilih <strong>"Add to Home Screen"</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-[24px]">4.</span>
                    <span>Edit nama aplikasi jika perlu, lalu tap <strong>"Add"</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-[24px]">5.</span>
                    <span>Aplikasi akan muncul di home screen Anda</span>
                  </li>
                </ol>
              </div>

              {/* Desktop */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">Desktop (Chrome/Edge)</h4>
                </div>
                <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300 ml-13">
                  <li className="flex gap-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-[24px]">1.</span>
                    <span>Buka website LMS di browser Chrome atau Edge</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-[24px]">2.</span>
                    <span>Klik ikon <strong>Install (⊕)</strong> di address bar (pojok kanan)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-[24px]">3.</span>
                    <span>Klik <strong>"Install"</strong> pada popup yang muncul</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-[24px]">4.</span>
                    <span>Aplikasi akan terbuka di window terpisah</span>
                  </li>
                </ol>
              </div>

              <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-emerald-900 dark:text-emerald-300">
                  <strong>Tips:</strong> Setelah install, aplikasi akan berjalan seperti aplikasi native dengan icon di home screen/desktop dan bisa dibuka tanpa browser bar.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <Button 
                color="primary" 
                onPress={() => setShowPWAModal(false)}
                className="font-semibold bg-emerald-600 hover:bg-emerald-700"
              >
                Mengerti
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Under Development Modal */}
      {showDevModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Dalam Pengembangan
                </h3>
                <button
                  onClick={() => setShowDevModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Aplikasi mobile untuk <strong>Play Store</strong> dan <strong>App Store</strong> sedang dalam tahap pengembangan.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sementara ini, Anda dapat menggunakan <strong>Progressive Web App (PWA)</strong> yang memiliki fitur hampir sama dengan aplikasi native.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex gap-2 justify-end">
              <Button 
                variant="flat" 
                onPress={() => setShowDevModal(false)}
              >
                Tutup
              </Button>
              <Button 
                color="primary" 
                onPress={() => {
                  setShowDevModal(false)
                  setShowPWAModal(true)
                }}
                className="font-semibold bg-emerald-600 hover:bg-emerald-700"
              >
                Lihat Cara Install PWA
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
