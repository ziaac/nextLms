'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Eye, Tag, ArrowRight, Newspaper } from 'lucide-react'
import { getPublicFileUrl } from '@/lib/constants'
import { PlaceholderImage } from '@/components/public/PlaceholderImage'
import { formatTanggalSaja } from '@/lib/helpers/timezone'

interface BeritaItem {
  id: string; judul: string; slug: string; excerpt?: string | null
  fotoUrl?: string | null; publishedAt?: string | null; viewCount: number
  kategori?: { nama: string } | null
  author?: { profile?: { namaLengkap: string } | null } | null
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function BeritaSkeleton() {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-10" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 h-[480px] rounded-3xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="lg:col-span-2 space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Image with loading state ──────────────────────────────────────────────────
function LazyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true)
  }, [src])

  return (
    <>
      {!loaded && (
        <div className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse ${className ?? ''}`} />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        fetchPriority="high"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  )
}

// ── Featured card ─────────────────────────────────────────────────────────────
function FeaturedCard({ item }: { item: BeritaItem }) {
  const imgUrl = item.fotoUrl ? getPublicFileUrl(item.fotoUrl) : null

  return (
    <Link href={`/berita/${item.slug}`} className="group block h-full">
      <article className="relative rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 h-full min-h-[480px]">
        {imgUrl ? (
          <LazyImage src={imgUrl} alt={item.judul} />
        ) : (
          <PlaceholderImage variant="news" className="absolute inset-0 w-full h-full" />
        )}

        {/* Overlay — fade bawah ke atas */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-96" style={{ background: 'linear-gradient(to top, #020d0a 0%, rgba(2,13,10,0.5) 50%, transparent 100%)' }} />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2.5">
          {item.kategori && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/80 text-white backdrop-blur-sm">
              <Tag size={9} />
              {item.kategori.nama}
            </span>
          )}
          <h3 className="text-xl font-bold text-white leading-snug line-clamp-3 group-hover:text-emerald-300 transition-colors drop-shadow">
            {item.judul}
          </h3>
          {item.excerpt && (
            <p className="text-sm text-white/85 line-clamp-2 leading-relaxed">
              {item.excerpt}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-white/70 pt-1">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatTanggalSaja(item.publishedAt ?? '')}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={11} />
              {item.viewCount.toLocaleString('id')}
            </span>
          </div>
        </div>

        <div className="absolute top-4 left-4">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 text-emerald-700 uppercase tracking-wider shadow-sm">
            Featured
          </span>
        </div>
      </article>
    </Link>
  )
}

// ── List card ─────────────────────────────────────────────────────────────────
function ListCard({ item }: { item: BeritaItem }) {
  const imgUrl = item.fotoUrl ? getPublicFileUrl(item.fotoUrl) : null
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true)
  }, [imgUrl])

  return (
    <Link href={`/berita/${item.slug}`} className="group block">
      <article className="flex gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-white dark:hover:bg-gray-800/50 transition-all">
        <div className="w-20 h-16 sm:w-24 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800 relative">
          {imgUrl ? (
            <>
              {!loaded && <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />}
              <img
                ref={imgRef}
                src={imgUrl}
                alt={item.judul}
                onLoad={() => setLoaded(true)}
                className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
              />
            </>
          ) : (
            <PlaceholderImage variant="news" className="w-full h-full" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          {item.kategori && (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">
              {item.kategori.nama}
            </span>
          )}
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            {item.judul}
          </h4>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {formatTanggalSaja(item.publishedAt ?? '')}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={10} />
              {item.viewCount}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function BeritaSection({ berita }: { berita: BeritaItem[] }) {
  if (!berita.length) return null

  const [featured, ...rest] = berita

  return (
    <section className="relative py-20 bg-white dark:bg-gray-900/50 overflow-hidden">
      {/* Diagonal strip ornament — diagonal \ (kiri atas ke kanan bawah) with gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          viewBox="0 0 1440 600"
          preserveAspectRatio="none"
          className="absolute top-0 left-0 w-full h-full"
        >
          <defs>
            {/* Gradient dari putih ke emerald-50 */}
            <linearGradient id="white-to-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(255 255 255)" />
              <stop offset="100%" stopColor="rgb(236 253 245)" />
            </linearGradient>
          </defs>
          
          {/* Layer 3 — terlebar, dengan gradient (diagonal \ dari kiri atas ke kanan bawah) */}
          <polygon points="0,0 1440,0 1440,600 0,380" fill="url(#white-to-emerald)" className="dark:hidden" />
          <polygon points="0,0 1440,0 1440,600 0,380" fill="rgba(6,78,59,0.08)" className="hidden dark:block" />
          {/* Layer 2 — medium */}
          <polygon points="0,0 1440,0 1440,440 0,220" fill="rgb(255 255 255)" fillOpacity="0.5" className="dark:hidden" />
          <polygon points="0,0 1440,0 1440,440 0,220" fill="rgba(6,78,59,0.12)" className="hidden dark:block" />
          {/* Layer 1 — tersempit */}
          <polygon points="0,0 1440,0 1440,240 0,60" fill="rgb(255 255 255)" className="dark:hidden" />
          <polygon points="0,0 1440,0 1440,240 0,60" fill="rgba(6,78,59,0.08)" className="hidden dark:block" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">

        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">
              Blog Madrasah
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Berita & Informasi
            </h2>
          </div>
          <Link
            href="/berita"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group"
          >
            Semua Berita
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Featured — 3 kolom, height lebih besar */}
          <div className="lg:col-span-3 lg:h-[480px]">
            <FeaturedCard item={featured} />
          </div>

          {/* List — 2 kolom */}
          <div className="lg:col-span-2 space-y-3">
            {rest.length > 0 ? (
              rest.map((item) => <ListCard key={item.id} item={item} />)
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <Newspaper size={32} className="text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-sm text-gray-400">Belum ada berita lainnya</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/berita"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group"
          >
            Lihat Informasi Selengkapnya
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
