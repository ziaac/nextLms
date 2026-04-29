'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { X, ZoomIn, ArrowLeft, GalleryHorizontal } from 'lucide-react'
import { getPublicFileUrl } from '@/lib/constants'
import { PlaceholderImage } from '@/components/public/PlaceholderImage'

function LazyImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => { if (ref.current?.complete) setLoaded(true) }, [src])
  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      {!loaded && <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />}
      <img ref={ref} src={src} alt={alt} onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 group-hover:scale-105 transition-transform ${loaded ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4" onClick={onClose}>
      <button type="button" onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
        <X size={18} />
      </button>
      <img src={url} alt="Preview"
        className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()} />
    </div>
  )
}

interface Props {
  album:  any
  albums: any[]
}

export function GaleriDetailContent({ album, albums }: Props) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const fotos        = album.foto ?? []
  const otherAlbums  = albums.filter((a) => a.isActive && a.id !== album.id).slice(0, 6)

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Link href="/galeri" className="inline-flex items-center gap-1.5 text-sm text-emerald-300 hover:text-white transition-colors mb-4">
            <ArrowLeft size={14} />Semua Album
          </Link>
          <p className="text-xs text-emerald-300 uppercase tracking-widest mb-2">Galeri Akademik</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">{album.nama}</h1>
          {album.deskripsi && <p className="text-white/60 mt-2 text-sm max-w-xl">{album.deskripsi}</p>}
          <p className="text-white/40 text-xs mt-2">{fotos.length} foto</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {fotos.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Belum ada foto di album ini.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[180px]">
            {fotos.map((foto: any, i: number) => {
              const url     = getPublicFileUrl(foto.fotoUrl)
              const isBig   = i === 0
              return (
                <div
                  key={foto.id}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer group bg-gray-100 dark:bg-gray-800 ${isBig ? 'col-span-2 row-span-2' : ''}`}
                  onClick={() => setLightboxUrl(url)}
                >
                  <LazyImg src={url} alt={foto.judul ?? ''} className="absolute inset-0 w-full h-full" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <ZoomIn size={isBig ? 28 : 20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {foto.judul && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs truncate">{foto.judul}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Album lain */}
        {otherAlbums.length > 0 && (
          <div className="mt-16">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Album Lainnya</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {otherAlbums.map((a) => {
                const cover = a.coverUrl ? getPublicFileUrl(a.coverUrl)
                  : a.foto?.[0]?.fotoUrl ? getPublicFileUrl(a.foto[0].fotoUrl)
                  : null
                return (
                  <Link key={a.id} href={`/galeri/${a.id}`} className="group block">
                    <div className="aspect-square rounded-xl overflow-hidden relative bg-gray-100 dark:bg-gray-800 mb-2">
                      {cover
                        ? <LazyImg src={cover} alt={a.nama} className="absolute inset-0 w-full h-full" />
                        : <PlaceholderImage variant="gallery" className="absolute inset-0 w-full h-full" />
                      }
                    </div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{a.nama}</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <GalleryHorizontal size={10} />{a._count?.foto ?? 0} foto
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </>
  )
}
