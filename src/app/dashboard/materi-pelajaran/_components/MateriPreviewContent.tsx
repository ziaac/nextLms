'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, Volume2 } from 'lucide-react'
import { getPresignedUrl } from '@/lib/api/upload.api'
import dynamic from 'next/dynamic'
import type { TipeMateri, HybridFileUrls } from '@/types/materi-pelajaran.types'

const PdfSlideshowViewer = dynamic(
  () => import('@/components/ui/PdfSlideshowViewer').then(m => m.PdfSlideshowViewer),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex items-center gap-2 py-6 text-sm text-gray-400">
        <Loader2 size={16} className="animate-spin" /> Memuat viewer...
      </div>
    )
  }
)
// ── Extract YouTube video ID ──────────────────────────────────
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

// ── Presigned URL hook ─────────────────────────────────────────
function usePresignedUrl(key: string | null | undefined) {
  const [url,    setUrl]    = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,  setError]  = useState(false)

  useEffect(() => {
    if (!key) { setUrl(null); return }
    setLoading(true); setError(false)
    getPresignedUrl(key, 3600)
      .then((u) => { setUrl(u); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [key])

  return { url, loading, error }
}

// ── YouTube player ─────────────────────────────────────────────
function YouTubePlayer({ url }: { url: string }) {
  const videoId = extractYouTubeId(url)
  if (!videoId) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
        <AlertCircle size={16} /> URL YouTube tidak valid
      </div>
    )
  }
  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  )
}

// ── PDF / Slideshow viewer ─────────────────────────────────────
function FileViewer({ fileKey }: { fileKey: string }) {
  const { url, loading, error } = usePresignedUrl(fileKey)

  if (loading) return (
    <div className="flex items-center gap-2 py-6 text-sm text-gray-400">
      <Loader2 size={16} className="animate-spin" /> Memuat file...
    </div>
  )
  if (error || !url) return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
      <AlertCircle size={16} /> Gagal memuat file
    </div>
  )

  return <PdfSlideshowViewer url={url} slideHeight={520} />
}

// ── Audio player ───────────────────────────────────────────────
function AudioPlayer({ fileKey }: { fileKey: string }) {
  const { url, loading, error } = usePresignedUrl(fileKey)

  if (loading) return (
    <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
      <Loader2 size={16} className="animate-spin" /> Memuat audio...
    </div>
  )
  if (error || !url) return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
      <AlertCircle size={16} /> Gagal memuat audio
    </div>
  )

  return (
    <div className="flex items-center gap-3 px-4 py-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
      <Volume2 size={20} className="text-purple-500 shrink-0" />
      <audio controls src={url} className="flex-1 h-10" />
    </div>
  )
}

// ── TEXT viewer ────────────────────────────────────────────────
function TextViewer({ konten }: { konten: string }) {
  return (
    <div
      className={[
        'prose prose-sm dark:prose-invert max-w-none',
        'text-gray-800 dark:text-gray-200 leading-relaxed',
        '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-4',
        '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-3',
        '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-1.5 [&_h3]:mt-2',
        '[&_p]:mb-2',
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2',
        '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2',
        '[&_li]:mb-0.5',
        '[&_a]:text-emerald-600 [&_a]:underline',
        '[&_code]:bg-gray-100 dark:[&_code]:bg-gray-800 [&_code]:px-1 [&_code]:rounded [&_code]:font-mono [&_code]:text-[13px]',
        '[&_hr]:border-gray-200 dark:[&_hr]:border-gray-700 [&_hr]:my-3',
      ].join(' ')}
      dangerouslySetInnerHTML={{ __html: konten }}
    />
  )
}

// ── Main export ────────────────────────────────────────────────
interface Props {
  tipe:      TipeMateri
  konten?:   string | null
  fileUrls?: string[] | HybridFileUrls | null
}

export function MateriPreviewContent({ tipe, konten, fileUrls }: Props) {
  const isHybridUrls = fileUrls && !Array.isArray(fileUrls)
  const firstFile    = Array.isArray(fileUrls) ? fileUrls[0] : undefined

  switch (tipe) {
    case 'TEXT':
      return konten
        ? <TextViewer konten={konten} />
        : <p className="text-sm text-gray-400 italic">Tidak ada konten teks.</p>

    case 'VIDEO_YOUTUBE':
      return firstFile
        ? <YouTubePlayer url={firstFile} />
        : <p className="text-sm text-gray-400 italic">URL YouTube belum diisi.</p>

    case 'PDF':
    case 'SLIDESHOW':
      return firstFile
        ? <FileViewer fileKey={firstFile} />
        : <p className="text-sm text-gray-400 italic">File belum diunggah.</p>

    case 'AUDIO':
      return firstFile
        ? <AudioPlayer fileKey={firstFile} />
        : <p className="text-sm text-gray-400 italic">File audio belum tersedia.</p>

    case 'HYBRID': {
      const hybrid = isHybridUrls ? (fileUrls as HybridFileUrls) : {}
      return (
        <div className="space-y-5">
          {konten && <TextViewer konten={konten} />}
          {hybrid.youtube && <YouTubePlayer url={hybrid.youtube} />}
          {hybrid.slideshow && <FileViewer fileKey={hybrid.slideshow} />}
          {!konten && !hybrid.youtube && !hybrid.slideshow && (
            <p className="text-sm text-gray-400 italic">Belum ada konten.</p>
          )}
        </div>
      )
    }

    default:
      return null
  }
}
