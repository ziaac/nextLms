'use client'

import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { uploadTandaTangan, saveTandaTanganKey } from '@/lib/api/guru-log.api'
import { getPresignedUrl } from '@/lib/api/upload.api'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui'
import { Upload, Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface TandaTanganUploadProps {
  currentKey?: string | null
  label?: string
  /**
   * Opsional: callback yang dipanggil setelah file berhasil diupload ke storage.
   * Menerima `key` (storage key) dan harus menyimpannya ke profil yang sesuai.
   * Jika tidak disediakan, akan menyimpan ke `/users/me/tanda-tangan` (default).
   */
  onUploadComplete?: (key: string) => Promise<unknown>
}

export function TandaTanganUpload({
  currentKey,
  label = 'Tanda Tangan',
  onUploadComplete,
}: TandaTanganUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const key = await uploadTandaTangan(file)
      if (onUploadComplete) {
        await onUploadComplete(key)
      } else {
        await saveTandaTanganKey(key)
      }
      return key
    },
    onSuccess: () => toast.success('Tanda tangan berhasil disimpan'),
    onError: () => toast.error('Gagal menyimpan tanda tangan'),
  })

  // Presigned URL untuk TTD yang sudah tersimpan
  const { data: savedUrl, isLoading: loadingSaved } = useQuery({
    queryKey: ['presigned', 'ttd', currentKey],
    queryFn: () => getPresignedUrl(currentKey!),
    enabled: !!currentKey && !previewUrl,
    staleTime: 1000 * 60 * 50,
  })

  const displayUrl = previewUrl ?? savedUrl ?? null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview lokal
    const reader = new FileReader()
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string)
    reader.readAsDataURL(file)

    // Upload
    uploadMutation.mutate(file)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </p>

      <div
        className="relative w-48 h-24 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors group"
        onClick={() => inputRef.current?.click()}
      >
        {loadingSaved ? (
          <Skeleton className="w-full h-full rounded-xl" />
        ) : displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt="Tanda Tangan"
              className="max-h-20 max-w-44 object-contain"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Pencil className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-gray-400">
            <Upload className="w-6 h-6" />
            <p className="text-[11px] text-center px-2">Klik untuk upload TTD</p>
          </div>
        )}

        {uploadMutation.isPending && (
          <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <p className="text-[11px] text-gray-400">
        Format: PNG, JPG, WEBP · Maks 2MB · Latar transparan (PNG) lebih baik
      </p>
    </div>
  )
}
