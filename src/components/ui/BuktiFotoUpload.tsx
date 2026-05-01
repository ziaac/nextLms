'use client'

/**
 * BuktiFotoUpload
 * Komponen upload foto bukti yang:
 * - Support kamera (mobile) dan galeri
 * - Kompres otomatis ke WebP max 500KB sebelum upload
 * - Upload ke MinIO via backend
 * - Tampilkan preview + progress
 *
 * Reusable untuk perizinan, bukti bayar, catatan sikap, dll.
 */

import { useRef, useState }               from 'react'
import { Camera, ImagePlus, X, Loader2 }  from 'lucide-react'
import { compressImageToFile, formatFileSize } from '@/lib/helpers/image-compress'
import { uploadPrivateFile }              from '@/lib/api/upload.api'
import { getPresignedUrl }                from '@/lib/api/upload.api'
import { validateImageFile }              from '@/lib/api/pendaftaran.api'

export interface BuktiFotoUploadProps {
  /** Key MinIO yang sudah tersimpan (dari form state) */
  value?:         string | null
  onChange:       (key: string | null) => void
  /** Endpoint upload backend, default: /upload/perizinan */
  uploadEndpoint?: string
  /** Label tombol, default: "Foto Bukti" */
  label?:          string
  disabled?:       boolean
}

export function BuktiFotoUpload({
  value,
  onChange,
  uploadEndpoint = '/upload/perizinan',
  label          = 'Foto Bukti',
  disabled,
}: BuktiFotoUploadProps) {
  const inputRef    = useRef<HTMLInputElement>(null)
  const [previewing, setPreviewing] = useState<string | null>(null)
  const [uploading,  setUploading]  = useState(false)
  const [sizeInfo,   setSizeInfo]   = useState<string | null>(null)
  const [error,      setError]      = useState<string | null>(null)

  // Saat ada key tersimpan & belum ada preview, buat presigned URL untuk preview
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  const loadPresigned = async (key: string) => {
    if (presignedUrl) return
    setLoadingPreview(true)
    try {
      const url = await getPresignedUrl(key)
      setPresignedUrl(url)
    } catch {
      // silent — preview tidak kritis
    } finally {
      setLoadingPreview(false)
    }
  }

  // Panggil presigned saat key ada tapi belum ada local preview
  if (value && !previewing && !presignedUrl && !loadingPreview) {
    void loadPresigned(value)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''   // reset agar bisa pilih file yang sama lagi

    setError(null)
    setSizeInfo(null)

    // Validasi MIME type dan ukuran file sebelum upload
    try {
      validateImageFile(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'File tidak valid.')
      return
    }

    // Buat local preview dulu (sebelum kompres)
    const localUrl = URL.createObjectURL(file)
    setPreviewing(localUrl)
    setPresignedUrl(null)

    setUploading(true)
    try {
      // Kompres
      const compressed = await compressImageToFile(file, file.name, {
        maxPx:    1200,
        quality:  0.80,
        maxBytes: 500_000,
      })
      setSizeInfo(formatFileSize(file.size) + ' → ' + formatFileSize(compressed.size))

      // Upload
      const key = await uploadPrivateFile(compressed, uploadEndpoint)
      onChange(key)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Gagal upload foto'
      setError(msg)
      setPreviewing(null)
      onChange(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreviewing(null)
    setPresignedUrl(null)
    setSizeInfo(null)
    setError(null)
    onChange(null)
  }

  const displayUrl = previewing ?? presignedUrl
  const hasFile    = !!value

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {label} <span className="text-gray-400 font-normal">(opsional · max 500 KB)</span>
      </label>

      {/* Preview */}
      {displayUrl && (
        <div className="relative inline-block">
          <img
            src={displayUrl}
            alt="Bukti"
            className="h-32 w-32 object-cover rounded-xl border border-gray-200 dark:border-gray-700"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Upload buttons */}
      {!hasFile && !uploading && !disabled && (
        <div className="flex gap-2">
          {/* Kamera (mobile) */}
          <button
            type="button"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.setAttribute('capture', 'environment')
                inputRef.current.click()
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <Camera className="h-3.5 w-3.5" />
            Kamera
          </button>

          {/* Galeri */}
          <button
            type="button"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.removeAttribute('capture')
                inputRef.current.click()
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Galeri
          </button>
        </div>
      )}

      {/* Loading */}
      {uploading && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Mengompres & mengupload...
        </div>
      )}

      {/* Size info */}
      {sizeInfo && !uploading && (
        <p className="text-[10px] text-gray-400">
          Ukuran: {sizeInfo}
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
    </div>
  )
}
