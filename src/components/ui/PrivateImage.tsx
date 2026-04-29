'use client'

import { useState, useEffect } from 'react'
import { getPresignedUrl } from '@/lib/api/upload.api'
import { Loader2 } from 'lucide-react'

interface Props {
  fileKey: string
  alt?: string
  className?: string
  /** Tinggi placeholder saat loading — default 160px */
  skeletonHeight?: number
}

/**
 * Komponen gambar untuk file private MinIO.
 * Otomatis fetch presigned URL, tampilkan skeleton saat loading,
 * dan cegah layout shift dengan aspect-ratio container.
 */
export function PrivateImage({ fileKey, alt = 'Gambar', className, skeletonHeight = 160 }: Props) {
  const [url,     setUrl]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(() => {
    if (!fileKey) { setLoading(false); return }
    setLoading(true)
    setError(false)
    setImgLoaded(false)
    setUrl(null)

    getPresignedUrl(fileKey)
      .then((u) => { setUrl(u); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [fileKey])

  // Skeleton saat fetch presigned URL
  if (loading) {
    return (
      <div
        className="rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center"
        style={{ height: skeletonHeight }}
      >
        <Loader2 size={20} className="text-gray-300 dark:text-gray-600 animate-spin" />
      </div>
    )
  }

  if (error || !url) return null

  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
      {/* Skeleton tetap tampil sampai gambar benar-benar loaded */}
      {!imgLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center animate-pulse"
          style={{ minHeight: skeletonHeight }}
        >
          <Loader2 size={20} className="text-gray-300 dark:text-gray-600 animate-spin" />
        </div>
      )}
      <img
        src={url}
        alt={alt}
        onLoad={() => setImgLoaded(true)}
        className={[
          'w-full object-contain transition-opacity duration-300',
          imgLoaded ? 'opacity-100' : 'opacity-0',
          className ?? '',
        ].join(' ')}
        style={{ maxHeight: 320 }}
      />
    </div>
  )
}
