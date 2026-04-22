'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, AlertCircle, Download, ExternalLink } from 'lucide-react'
import { getPresignedUrl } from '@/lib/api/upload.api'
import { cn } from '@/lib/utils'

interface FilePreviewProps {
  open: boolean
  onClose: () => void
  docKey: string | null
  label?: string
}

type FileType = 'pdf' | 'image' | 'unknown'

function getFileType(key: string): FileType {
  const ext = key.split('.').pop()?.toLowerCase()
  if (!ext) return 'unknown'
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  return 'unknown'
}

const urlCache = new Map<string, { url: string; expiredAt: number }>()

export function FilePreview({ open, onClose, docKey, label = 'Dokumen' }: FilePreviewProps) {
  const [url, setUrl]         = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark]   = useState(false)

  useEffect(() => {
    setMounted(true)
    const update = () => setIsDark(document.documentElement.classList.contains('dark'))
    update()
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  // Fetch presigned URL saat open
  useEffect(() => {
    if (!open || !docKey) return

    // Cek cache dulu
    const cached = urlCache.get(docKey)
    if (cached && cached.expiredAt > Date.now()) {
      setUrl(cached.url)
      return
    }

    setUrl(null)
    setError(null)
    setLoading(true)

    getPresignedUrl(docKey)
      .then((presignedUrl) => {
        // Simpan ke cache — expire 55 menit (lebih pendek dari 1 jam server)
        urlCache.set(docKey, {
          url: presignedUrl,
          expiredAt: Date.now() + 55 * 60 * 1000,
        })
        setUrl(presignedUrl)
      })
      .catch(() => setError('Gagal memuat file. Coba lagi.'))
      .finally(() => setLoading(false))
  }, [open, docKey])
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!mounted || !open || !docKey) return null

  const fileType = getFileType(docKey)

  return createPortal(
    <div className={isDark ? 'dark' : ''}>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Panel */}
        <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-400/40 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-400/40 flex-shrink-0"
            style={{ backgroundColor: isDark ? 'rgb(17,24,39)' : 'white' }}>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{label}</h3>
            <div className="flex items-center gap-2">
              {url && (
                <>
                  <a
                    href={url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Download size={14} />
                    Unduh
                  </a>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ExternalLink size={14} />
                    Buka Tab Baru
                  </a>
                </>
              )}
              <button
                onClick={onClose}
                title="Tutup"
                aria-label="Tutup dialog"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-auto bg-gray-50 dark:bg-gray-800/50">
            {loading && (
              <div className="flex items-center justify-center h-64 gap-3">
                <Loader2 size={24} className="animate-spin text-emerald-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Memuat file...</span>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <AlertCircle size={32} className="text-red-400" />
                <p className="text-sm text-red-500">{error}</p>
                <button
                  onClick={() => {
                    setError(null)
                    setLoading(true)
                    getPresignedUrl(docKey)
                      .then(setUrl)
                      .catch(() => setError('Gagal memuat file. Coba lagi.'))
                      .finally(() => setLoading(false))
                  }}
                  className="text-sm text-emerald-600 hover:underline"
                >
                  Coba lagi
                </button>
              </div>
            )}

            {url && !loading && !error && (
              <>
                {fileType === 'pdf' && (
                  <iframe
                    src={url}
                    className="w-full h-full min-h-[70vh]"
                    title={label}
                  />
                )}

                {fileType === 'image' && (
                  <ImageViewer url={url} label={label} />
                )}
                {fileType === 'unknown' && (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      File ini tidak dapat ditampilkan langsung.
                    </p>
                    <a
                      href={url}
                      download
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      Unduh File
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
function ImageViewer({ url, label }: { url: string; label: string }) {
  const [imgLoaded, setImgLoaded] = useState(false)

  return (
    <div className="flex items-center justify-center p-4 min-h-[70vh] relative">
      {!imgLoaded && (
        <div className="absolute inset-0 flex items-center justify-center gap-3">
          <Loader2 size={24} className="animate-spin text-emerald-500" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Memuat gambar...</span>
        </div>
      )}
      <img
        src={url}
        alt={label}
        onLoad={() => setImgLoaded(true)}
        className={cn(
          'max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg transition-opacity duration-300',
          imgLoaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  )
}
