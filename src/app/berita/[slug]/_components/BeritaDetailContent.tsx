'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Eye, Tag, ArrowLeft, User } from 'lucide-react'
import { getPublicFileUrl } from '@/lib/constants'

function formatDate(iso: string | null | undefined) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface Props { berita: any }

export function BeritaDetailContent({ berita }: Props) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  useEffect(() => { if (imgRef.current?.complete) setImgLoaded(true) }, [berita.fotoUrl])

  const fotoUrl    = berita.fotoUrl ? getPublicFileUrl(berita.fotoUrl) : null
  const fotoAuthor = berita.author?.profile?.fotoUrl ? getPublicFileUrl(berita.author.profile.fotoUrl) : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-16">
      {/* Back */}
      <Link href="/berita" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-8">
        <ArrowLeft size={15} />
        Kembali ke Berita
      </Link>

      {/* Kategori */}
      {berita.kategori && (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 mb-4">
          <Tag size={10} />{berita.kategori.nama}
        </span>
      )}

      {/* Judul */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
        {berita.judul}
      </h1>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
        <span className="flex items-center gap-1.5">
          {fotoAuthor
            ? <img src={fotoAuthor} alt="" className="w-6 h-6 rounded-full object-cover" />
            : <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><User size={12} /></div>
          }
          {berita.author?.profile?.namaLengkap ?? 'Admin'}
        </span>
        <span className="flex items-center gap-1"><Calendar size={13} />{formatDate(berita.publishedAt)}</span>
        <span className="flex items-center gap-1"><Eye size={13} />{berita.viewCount} kali dilihat</span>
      </div>

      {/* Foto utama */}
      {fotoUrl && (
        <div className="relative rounded-2xl overflow-hidden aspect-video mb-8 bg-gray-100 dark:bg-gray-800">
          {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />}
          <img
            ref={imgRef}
            src={fotoUrl}
            alt={berita.judul}
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>
      )}

      {/* Konten */}
      <div
        className="prose prose-base dark:prose-invert max-w-none
          prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
          prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed
          prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
          prose-img:rounded-xl prose-img:shadow-md
          prose-blockquote:border-emerald-400 prose-blockquote:bg-emerald-50 dark:prose-blockquote:bg-emerald-900/20 prose-blockquote:rounded-r-xl prose-blockquote:py-1"
        dangerouslySetInnerHTML={{ __html: berita.konten }}
      />
    </div>
  )
}
