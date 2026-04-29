'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { GalleryHorizontal, Images } from 'lucide-react'
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

interface Props { albums: any[] }

export function GaleriListContent({ albums }: Props) {
  const active = albums.filter((a) => a.isActive)

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs text-emerald-300 uppercase tracking-widest mb-2">Dokumentasi</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Galeri Akademik</h1>
          <p className="text-white/60 mt-2 text-sm">{active.length} album tersedia</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {active.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Images size={40} className="mx-auto mb-3 opacity-30" />
            <p>Belum ada album galeri.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {active.map((album) => {
              const cover = album.coverUrl ? getPublicFileUrl(album.coverUrl)
                : album.foto?.[0]?.fotoUrl ? getPublicFileUrl(album.foto[0].fotoUrl)
                : null
              return (
                <Link key={album.id} href={`/galeri/${album.id}`} className="group block">
                  <article className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-700 transition-all shadow-sm hover:shadow-md">
                    <div className="aspect-video relative bg-gray-100 dark:bg-gray-800">
                      {cover
                        ? <LazyImg src={cover} alt={album.nama} className="absolute inset-0 w-full h-full" />
                        : <PlaceholderImage variant="gallery" className="absolute inset-0 w-full h-full" label={album.nama} />
                      }
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-900">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                          {album.nama}
                        </h3>
                        <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0 ml-2">
                          <GalleryHorizontal size={12} />
                          {album._count?.foto ?? 0}
                        </span>
                      </div>
                      {album.deskripsi && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{album.deskripsi}</p>
                      )}
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
