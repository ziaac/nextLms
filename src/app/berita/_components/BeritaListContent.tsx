'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Eye, Tag, Search, ArrowRight } from 'lucide-react'
import { getPublicFileUrl } from '@/lib/constants'
import { PlaceholderImage } from '@/components/public/PlaceholderImage'

function formatDate(iso: string | null | undefined) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function LazyImg({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => { if (ref.current?.complete) setLoaded(true) }, [src])
  return (
    <div className="absolute inset-0">
      {!loaded && <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />}
      <img ref={ref} src={src} alt={alt} onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 group-hover:scale-105 transition-transform ${loaded ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}

interface Props {
  beritaData: { data: any[]; total: number }
  kategori:   any[]
}

export function BeritaListContent({ beritaData, kategori }: Props) {
  const [search,      setSearch]      = useState('')
  const [activeKat,   setActiveKat]   = useState<string | null>(null)

  const berita = beritaData.data ?? []

  const filtered = berita.filter((b) => {
    const matchSearch = !search || b.judul.toLowerCase().includes(search.toLowerCase())
    const matchKat    = !activeKat || b.kategori?.id === activeKat
    return matchSearch && matchKat
  })

  const [featured, ...rest] = filtered

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs text-emerald-300 uppercase tracking-widest mb-2">Blog Madrasah</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">Berita & Informasi</h1>

          {/* Search */}
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Cari berita..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Filter kategori */}
        {kategori.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              type="button"
              onClick={() => setActiveKat(null)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !activeKat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
              }`}
            >
              Semua
            </button>
            {kategori.map((k: any) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setActiveKat(k.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeKat === k.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                }`}
              >
                {k.nama}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">Tidak ada berita ditemukan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Featured */}
            {featured && (
              <div className="lg:col-span-2">
                <Link href={`/berita/${featured.slug}`} className="group block">
                  <article className="relative rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-[16/9]">
                    {featured.fotoUrl
                      ? <LazyImg src={getPublicFileUrl(featured.fotoUrl)} alt={featured.judul} />
                      : <PlaceholderImage variant="news" className="absolute inset-0 w-full h-full" />
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      {featured.kategori && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/80 text-white mb-2">
                          <Tag size={9} />{featured.kategori.nama}
                        </span>
                      )}
                      <h2 className="text-xl font-bold text-white leading-snug group-hover:text-emerald-300 transition-colors line-clamp-2">
                        {featured.judul}
                      </h2>
                      <div className="flex items-center gap-3 text-xs text-white/55 mt-2">
                        <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(featured.publishedAt)}</span>
                        <span className="flex items-center gap-1"><Eye size={11} />{featured.viewCount}</span>
                      </div>
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 text-emerald-700 uppercase">Featured</span>
                    </div>
                  </article>
                </Link>
              </div>
            )}

            {/* Sidebar list */}
            <div className="space-y-3">
              {rest.slice(0, 4).map((b) => (
                <Link key={b.id} href={`/berita/${b.slug}`} className="group block">
                  <article className="flex gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
                    <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0 relative bg-gray-100 dark:bg-gray-800">
                      {b.fotoUrl
                        ? <LazyImg src={getPublicFileUrl(b.fotoUrl)} alt={b.judul} />
                        : <PlaceholderImage variant="news" className="absolute inset-0 w-full h-full" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {b.judul}
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar size={10} />{formatDate(b.publishedAt)}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* Grid sisa */}
            {rest.slice(4).map((b) => (
              <Link key={b.id} href={`/berita/${b.slug}`} className="group block">
                <article className="rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
                  <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                    {b.fotoUrl
                      ? <LazyImg src={getPublicFileUrl(b.fotoUrl)} alt={b.judul} />
                      : <PlaceholderImage variant="news" className="absolute inset-0 w-full h-full" />
                    }
                  </div>
                  <div className="p-4">
                    {b.kategori && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{b.kategori.nama}</span>
                    )}
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-1 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {b.judul}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                      <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(b.publishedAt)}</span>
                      <span className="flex items-center gap-1"><Eye size={10} />{b.viewCount}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
