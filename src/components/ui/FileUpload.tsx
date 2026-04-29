'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, X, Loader2, CheckCircle, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FilePreview } from './FilePreview'
import { compressImageToFile } from '@/lib/helpers/image-compress'

interface FileUploadProps {
  label: string
  hint?: string
  accept?: string
  onUpload: (file: File) => Promise<string>
  onSuccess: (key: string) => void
  currentKey?: string | null
  disabled?: boolean
  previewLabel?: string
  /** Sembunyikan box "File tersedia" dan tombol preview — cocok saat ada inline preview di bawah */
  compact?: boolean
  /** Kompres gambar sebelum upload (default: true untuk gambar, false untuk PDF) */
  compressImage?: boolean
}

export function FileUpload({
  label, hint, accept = '.pdf,.jpg,.jpeg,.png',
  onUpload, onSuccess, currentKey, disabled,
  previewLabel, compact, compressImage = true,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [uploaded, setUploaded]   = useState(!!currentKey)
  const [previewOpen, setPreviewOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync currentKey → uploaded state
  useEffect(() => {
    setUploaded(!!currentKey)
  }, [currentKey])

  const handleFile = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      let fileToUpload = file
      
      // Kompres gambar jika diaktifkan dan file adalah gambar (bukan PDF)
      if (compressImage && file.type.startsWith('image/')) {
        try {
          fileToUpload = await compressImageToFile(file, file.name, {
            maxPx: 1600,       // Dokumen scan perlu resolusi lebih tinggi
            quality: 0.85,     // Kualitas tinggi untuk dokumen
            maxBytes: 800_000, // Target 800KB untuk dokumen scan
          })
        } catch (compressErr) {
          // Jika kompresi gagal, gunakan file asli
          console.warn('Kompresi gagal, menggunakan file asli:', compressErr)
          fileToUpload = file
        }
      }
      
      const key = await onUpload(fileToUpload)
      onSuccess(key)
      setUploaded(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload gagal. Coba lagi.'
      setError(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleReset = () => {
    setUploaded(false)
    setError(null)
    onSuccess('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {uploaded && !uploading ? (
        compact ? (
          /* ── Mode compact: preview ada di bawah, cukup tombol hapus/ganti ── */
          <div className="flex items-center gap-2">
            {!disabled && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-red-300 hover:text-red-500 dark:hover:border-red-700 dark:hover:text-red-400 transition-colors"
              >
                <X size={12} />
                Hapus / Ganti
              </button>
            )}
          </div>
        ) : (
          /* ── Mode normal: box hijau + tombol lihat file ── */
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 space-y-2">
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
              <span className="text-sm text-emerald-700 dark:text-emerald-400 flex-1">
                File tersedia
              </span>
              {!disabled && (
                <button type="button" onClick={handleReset}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Hapus file">
                  <X size={16} />
                </button>
              )}
            </div>
            {currentKey && (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors"
              >
                <Eye size={13} />
                Lihat File
              </button>
            )}
          </div>
        )
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-2',
            'rounded-xl border-2 border-dashed px-4 py-5',
            'transition-colors cursor-pointer',
            disabled || uploading
              ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700'
              : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20',
          )}
        >
          {uploading
            ? <Loader2 size={20} className="animate-spin text-emerald-500" />
            : <Upload size={20} className="text-gray-400" />
          }
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {uploading ? 'Mengupload...' : 'Klik atau drag & drop file'}
            </p>
            {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled || uploading}
        aria-label={label}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Preview Modal */}
      <FilePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        docKey={currentKey ?? null}
        label={previewLabel ?? label}
      />
    </div>
  )
}
