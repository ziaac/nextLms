'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, ZoomIn } from 'lucide-react'

const BASE_URL = 'https://storagelms.man2kotamakassar.sch.id/static-assets'

interface Props {
  filename: string
  alt:      string
  className?: string
}

export function ScreenshotImage({ filename, alt, className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const src = `${BASE_URL}/${filename}`

  // Tutup lightbox dengan Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  // Cegah scroll saat lightbox terbuka
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Thumbnail */}
      <div
        className={`relative group cursor-zoom-in overflow-hidden ${className}`}
        onClick={() => setOpen(true)}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 800px"
        />
        {/* Overlay hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/60 text-white rounded-full p-2">
            <ZoomIn className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            onClick={() => setOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Caption */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs text-center max-w-lg px-4">
            {alt}
          </p>

          {/* Image */}
          <div
            className="relative max-w-5xl max-h-[85vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              width={1280}
              height={800}
              className="object-contain rounded-lg shadow-2xl max-h-[85vh] w-auto mx-auto"
              priority
            />
          </div>
        </div>
      )}
    </>
  )
}
