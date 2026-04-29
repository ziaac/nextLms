'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPublicFileUrl } from '@/lib/constants'
import { compressImageToFile } from '@/lib/helpers/image-compress'

interface FotoProfilUploadProps {
  currentKey?: string | null
  onUpload: (file: File) => Promise<string>
  onSuccess: (key: string) => void
  onSaveToProfile?: (key: string) => Promise<void>
  namaLengkap?: string
  disabled?: boolean
}

export function FotoProfilUpload({
  currentKey, onUpload, onSuccess, onSaveToProfile, namaLengkap = '', disabled,
}: FotoProfilUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fotoUrl = previewUrl ?? (currentKey ? getPublicFileUrl(currentKey) : null)
  const initials = namaLengkap
    .split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('')

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    setError(null)
    setUploading(true)

    try {
      // Kompres gambar sebelum upload (foto profil tidak perlu resolusi tinggi)
      const compressed = await compressImageToFile(file, file.name, {
        maxPx: 800,        // Foto profil cukup 800px
        quality: 0.85,     // Kualitas tinggi untuk foto profil
        maxBytes: 300_000, // Target 300KB
      })
      
      const key = await onUpload(compressed)
      onSuccess(key)
      // Simpan ke database jika ada handler
      if (onSaveToProfile) await onSaveToProfile(key)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal upload foto. Coba lagi.'
      setError(msg)
      setPreviewUrl(null)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    onSuccess('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        {/* Avatar */}
        <div className={cn(
          'w-24 h-24 rounded-full overflow-hidden flex items-center justify-center',
          'bg-emerald-100 dark:bg-emerald-900/40',
          'border-2 border-dashed border-emerald-200 dark:border-emerald-700',
          'transition-all',
        )}>
          {fotoUrl ? (
            <img src={fotoUrl} alt={namaLengkap} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {initials || <Camera className="h-8 w-8 text-emerald-400" />}
            </span>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Tombol kamera overlay */}
        {!disabled && !uploading && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              'absolute bottom-0 right-0 w-7 h-7 rounded-full',
              'bg-emerald-600 hover:bg-emerald-700 text-white',
              'flex items-center justify-center shadow-md transition-colors',
            )}
            title="Ganti foto"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Tombol hapus */}
        {fotoUrl && !disabled && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-0 right-0 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow"
            title="Hapus foto"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
        disabled={disabled || uploading}
      />

      <div className="text-center">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
        >
          {uploading ? 'Mengupload...' : fotoUrl ? 'Ganti Foto' : 'Upload Foto Profil'}
        </button>
        <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG, WebP · Maks 5MB</p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  )
}
