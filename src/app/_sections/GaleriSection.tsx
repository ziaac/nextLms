'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, ZoomIn, ArrowRight, GalleryHorizontal } from 'lucide-react'
import { getPublicFileUrl } from '@/lib/constants'
import { PlaceholderImage } from '@/components/public/PlaceholderImage'

interface GaleriFoto {
  id: string; fotoUrl: string; judul?: string | null
}

interface GaleriAlbum {
  id: string; nama: string; isActive: boolean
  _count?: { foto: number }
}

interface GaleriSectionProps {
  album:     { id: string; nama: string; foto: GaleriFoto[] } | null
  albumList: GaleriAlbum[]
}

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X size={18} />
      </button>
      <img
        src={url}
        alt="Preview"
        className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

export function GaleriSection({ album, albumList }: GaleriSectionProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const fotos = album?.foto?.slice(0, 9) ?? []
  const activeAlbums = albumList.filter((a) => a.isActive).slice(0, 5)

  if (!fotos.length && !activeAlbums.length) return null

  const [featured, ...rest] = fotos

  return (
    <section className="py-20 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">
              Dokumentasi
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Galeri Akademik
            </h2>
            {album?.nama && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{album.nama}</p>
            )}
          </div>
          <Link
            href="/galeri"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group"
          >
            Semua Galeri
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {fotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[160px]">
            {/* Featured — span 2x2 */}
            {featured && (
              <div
                className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden cursor-pointer group bg-gray-100 dark:bg-gray-800"
                onClick={() => setLightboxUrl(getPublicFileUrl(featured.fotoUrl))}
              >
                <img
                  src={getPublicFileUrl(featured.fotoUrl)}
                  alt={featured.judul ?? ''}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1.5 text-white text-xs bg-black/40 backdrop-blur-sm rounded-xl px-3 py-1.5 w-fit">
                    <ZoomIn size={12} />
                    Lihat foto
                  </div>
                </div>
                {/* Featured badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/80 text-white backdrop-blur-sm">
                    Featured
                  </span>
                </div>
              </div>
            )}

            {/* Rest */}
            {rest.map((foto) => (
              <div
                key={foto.id}
                className="relative rounded-2xl overflow-hidden cursor-pointer group bg-gray-100 dark:bg-gray-800"
                onClick={() => setLightboxUrl(getPublicFileUrl(foto.fotoUrl))}
              >
                <img
                  src={getPublicFileUrl(foto.fotoUrl)}
                  alt={foto.judul ?? ''}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}

            {/* Placeholder jika kurang dari 10 */}
            {Array.from({ length: Math.max(0, 8 - rest.length) }).map((_, i) => (
              <div key={`ph-${i}`} className="rounded-2xl overflow-hidden">
                <PlaceholderImage variant="gallery" className="w-full h-full" />
              </div>
            ))}
          </div>
        ) : (
          /* Album list jika tidak ada foto */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {activeAlbums.map((a) => (
              <Link
                key={a.id}
                href={`/galeri/${a.id}`}
                className="group block rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all"
              >
                <div className="aspect-square">
                  <PlaceholderImage variant="gallery" className="w-full h-full" label={a.nama} />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{a.nama}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a._count?.foto ?? 0} foto</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Album tabs */}
        {activeAlbums.length > 1 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {activeAlbums.map((a) => (
              <Link
                key={a.id}
                href={`/galeri/${a.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <GalleryHorizontal size={11} />
                {a.nama}
                <span className="text-gray-400">({a._count?.foto ?? 0})</span>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/galeri"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group"
          >
            Lihat Semua Galeri
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </section>
  )
}
