'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import {
  ChevronLeft, ChevronRight, Loader2, Maximize2, Minimize2, AlertCircle,
  ZoomIn, ZoomOut, RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3]
const DEFAULT_ZOOM_IDX = 2 // 1.0

interface Props {
  url:        string
  className?: string
  /** Hanya dipakai saat fullscreen. Mode normal auto-fit ke tinggi halaman PDF. */
  slideHeight?: number
}

export function PdfSlideshowViewer({ url, className, slideHeight = 480 }: Props) {
  const [numPages,    setNumPages]    = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [fullscreen,  setFullscreen]  = useState(false)
  const [baseWidth,   setBaseWidth]   = useState(0)
  const [zoomIdx,     setZoomIdx]     = useState(DEFAULT_ZOOM_IDX)

  const containerRef = useRef<HTMLDivElement>(null)

  const zoom = ZOOM_STEPS[zoomIdx]
  const pageWidth = baseWidth > 0 ? baseWidth * zoom : undefined

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setBaseWidth(el.clientWidth - 32))
    ro.observe(el)
    setBaseWidth(el.clientWidth - 32)
    return () => ro.disconnect()
  }, [fullscreen])

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setCurrentPage(1)
  }, [])

  const goTo = useCallback((page: number) => {
    setCurrentPage((prev) => {
      const next = Math.max(1, Math.min(page, numPages))
      return next !== prev ? next : prev
    })
  }, [numPages])

  const zoomIn  = () => setZoomIdx((i) => Math.min(i + 1, ZOOM_STEPS.length - 1))
  const zoomOut = () => setZoomIdx((i) => Math.max(i - 1, 0))
  const zoomReset = () => setZoomIdx(DEFAULT_ZOOM_IDX)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!fullscreen) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(currentPage + 1)
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goTo(currentPage - 1)
      if (e.key === 'Escape')                               setFullscreen(false)
      if (e.key === '+' || e.key === '=')                   zoomIn()
      if (e.key === '-')                                    zoomOut()
      if (e.key === '0')                                    zoomReset()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [fullscreen, currentPage, goTo])

  const showDots = numPages > 1 && numPages <= 24
  const fsHeight = typeof window !== 'undefined' ? window.innerHeight - 96 : 600

  const canPrev = currentPage > 1
  const canNext = currentPage < numPages

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900',
        fullscreen && 'fixed inset-0 z-50 rounded-none border-0 bg-gray-950',
        className,
      )}
    >
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0 gap-2">
        {/* Navigasi halaman */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={!canPrev}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Slide sebelumnya (←)"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[64px] text-center tabular-nums">
            {numPages ? `${currentPage} / ${numPages}` : '—'}
          </span>
          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={!canNext}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Slide berikutnya (→)"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            disabled={zoomIdx === 0}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Zoom out (-)"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={zoomReset}
            className="px-2 py-1 rounded-lg text-xs font-mono font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-w-[44px] text-center"
            title="Reset zoom (0)"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={zoomIn}
            disabled={zoomIdx === ZOOM_STEPS.length - 1}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Zoom in (+)"
          >
            <ZoomIn size={14} />
          </button>
        </div>

        {/* Fullscreen toggle */}
        <button
          onClick={() => setFullscreen((f) => !f)}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          title={fullscreen ? 'Keluar fullscreen (Esc)' : 'Fullscreen'}
        >
          {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* ── Area slide ── */}
      <div
        ref={containerRef}
        className="overflow-auto flex items-start justify-center p-4 bg-gray-100 dark:bg-gray-800 relative"
        style={fullscreen ? { minHeight: fsHeight } : undefined}
      >
        {/* Panah kiri — overlay di dalam slide */}
        {canPrev && numPages > 1 && (
          <button
            onClick={() => goTo(currentPage - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors backdrop-blur-sm"
            title="Slide sebelumnya"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <Document
          file={url}
          onLoadSuccess={onLoadSuccess}
          loading={
            <div className="flex flex-col items-center gap-3 text-gray-400 pt-16">
              <Loader2 size={28} className="animate-spin text-emerald-500" />
              <span className="text-sm">Memuat dokumen...</span>
            </div>
          }
          error={
            <div className="flex flex-col items-center gap-3 text-red-400 pt-16">
              <AlertCircle size={28} />
              <span className="text-sm">Gagal memuat dokumen</span>
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            width={pageWidth}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            loading={
              <div
                className="flex items-center justify-center"
                style={{ width: pageWidth || 400, height: Math.round((pageWidth || 400) * 9 / 16) }}
              >
                <Loader2 size={20} className="animate-spin text-gray-300" />
              </div>
            }
            className="shadow-lg rounded"
          />
        </Document>

        {/* Panah kanan — overlay di dalam slide */}
        {canNext && numPages > 1 && (
          <button
            onClick={() => goTo(currentPage + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors backdrop-blur-sm"
            title="Slide berikutnya"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* ── Dot navigation (≤24 halaman) ── */}
      {showDots && (
        <div className="flex items-center justify-center gap-1.5 py-2.5 shrink-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-wrap px-4">
          {Array.from({ length: numPages }, (_, i) => (
            <button
              key={i}
              onClick={() => goTo(i + 1)}
              title={`Slide ${i + 1}`}
              className={cn(
                'rounded-full transition-all duration-200',
                i + 1 === currentPage
                  ? 'w-5 h-2 bg-emerald-500'
                  : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-emerald-400',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
