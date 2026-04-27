'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { TipeWidgetWorksheet } from '@/types/worksheet.types'
import type { WidgetDraft } from '@/types/worksheet.types'
import { useWorksheetBuilderStore } from '@/stores/worksheet-builder.store'
import { WorksheetWidgetRenderer } from '../WorksheetWidgetRenderer'
import { GripVertical, FileImage } from 'lucide-react'

// ── Widget tipe → label singkat ───────────────────────────────────────────
const WIDGET_LABEL: Record<TipeWidgetWorksheet, string> = {
  TEXT_INPUT:      'Text',
  NUMBER_INPUT:    'Number',
  MULTIPLE_CHOICE: 'MC',
  DROPDOWN:        'Dropdown',
  FILL_IN_BLANK:   'Isian',
  AUDIO_PLAYER:    'Audio',
  DRAWING_AREA:    'Drawing',
  MATCHING:        'Pasangkan',
}

// ── Widget tipe → border accent color ────────────────────────────────────
const WIDGET_COLOR: Record<TipeWidgetWorksheet, string> = {
  TEXT_INPUT:      'border-blue-400',
  NUMBER_INPUT:    'border-cyan-400',
  MULTIPLE_CHOICE: 'border-violet-400',
  DROPDOWN:        'border-indigo-400',
  FILL_IN_BLANK:   'border-amber-400',
  AUDIO_PLAYER:    'border-emerald-400',
  DRAWING_AREA:    'border-purple-400',
  MATCHING:        'border-rose-400',
}

// ── Drag state ────────────────────────────────────────────────────────────
type DragMode = 'move' | 'resize-se' | 'resize-e' | 'resize-s'

interface DragState {
  widgetId:       string
  startMouseX:    number
  startMouseY:    number
  startPosX:      number
  startPosY:      number
  startLebarPct:  number   // ukuran asli saat drag mulai
  startTinggiPct: number
  mode:           DragMode
}

interface Props {
  showLabels?: boolean
}

export function WorksheetCanvas({ showLabels = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef       = useRef<HTMLImageElement>(null)
  const dragRef      = useRef<DragState | null>(null)

  const {
    getHalamanAktif, widgetTerpilihId,
    selectWidget, addWidget, updateWidget,
  } = useWorksheetBuilderStore()

  const halaman = getHalamanAktif()
  const [imgLoaded, setImgLoaded] = useState(false)

  // Reset loading state setiap ganti halaman aktif
  useEffect(() => {
    setImgLoaded(false)
  }, [halaman?.id])

  // ── Drop zone ─────────────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const tipe = e.dataTransfer.getData('widget-tipe') as TipeWidgetWorksheet
    if (!tipe || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const relY = (e.clientY - rect.top)  / rect.height
    addWidget(tipe, relX, relY)
  }, [addWidget])

  // ── Start drag / resize ───────────────────────────────────────────────
  const startDrag = useCallback((
    e: React.PointerEvent,
    widget: WidgetDraft,
    mode: DragMode,
  ) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    selectWidget(widget.id)
    dragRef.current = {
      widgetId:       widget.id,
      startMouseX:    e.clientX,
      startMouseY:    e.clientY,
      startPosX:      widget.posisiX,
      startPosY:      widget.posisiY,
      startLebarPct:  widget.lebarPct,   // simpan ukuran awal
      startTinggiPct: widget.tinggiPct,
      mode,
    }
  }, [selectWidget])

  // ── Pointer move ──────────────────────────────────────────────────────
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = (e.clientX - drag.startMouseX) / rect.width
    const dy = (e.clientY - drag.startMouseY) / rect.height

    const hal    = getHalamanAktif()
    const widget = hal?.widget.find((w) => w.id === drag.widgetId)
    if (!widget) return

    if (drag.mode === 'move') {
      updateWidget(drag.widgetId, {
        posisiX: Math.max(0, Math.min(1 - drag.startLebarPct,  drag.startPosX + dx)),
        posisiY: Math.max(0, Math.min(1 - drag.startTinggiPct, drag.startPosY + dy)),
      })
    } else if (drag.mode === 'resize-se') {
      // Corner: lebar + tinggi
      updateWidget(drag.widgetId, {
        lebarPct:  Math.max(0.06, Math.min(1 - widget.posisiX, drag.startLebarPct  + dx)),
        tinggiPct: Math.max(0.04, Math.min(1 - widget.posisiY, drag.startTinggiPct + dy)),
      })
    } else if (drag.mode === 'resize-e') {
      // Sisi kanan: lebar saja
      updateWidget(drag.widgetId, {
        lebarPct: Math.max(0.06, Math.min(1 - widget.posisiX, drag.startLebarPct + dx)),
      })
    } else if (drag.mode === 'resize-s') {
      // Sisi bawah: tinggi saja
      updateWidget(drag.widgetId, {
        tinggiPct: Math.max(0.04, Math.min(1 - widget.posisiY, drag.startTinggiPct + dy)),
      })
    }
  }, [getHalamanAktif, updateWidget])

  const onPointerUp = useCallback(() => { dragRef.current = null }, [])

  // ── Empty states ──────────────────────────────────────────────────────
  if (!halaman) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
        <div className="text-center">
          <p className="text-sm text-gray-400 dark:text-gray-600">Belum ada halaman</p>
          <p className="text-xs text-gray-300 dark:text-gray-700 mt-1">Tambah halaman atau upload PDF di sebelah kiri</p>
        </div>
      </div>
    )
  }

  if (!halaman.imageUrl) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 min-h-[400px]">
        <div className="text-center">
          <FileImage className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-600 font-medium">Halaman belum memiliki gambar</p>
          <p className="text-xs text-gray-300 dark:text-gray-700 mt-1">Klik "Ganti Gambar" di atas atau upload di panel kiri</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1 select-none rounded-xl shadow-md bg-gray-100 dark:bg-gray-900"
      style={{ touchAction: 'none' }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={() => selectWidget(null)}
    >
      {/* Background image */}
      <img
        ref={imgRef}
        src={halaman.imageUrl}
        alt="worksheet"
        onLoad={() => setImgLoaded(true)}
        className="w-full h-auto block"
        draggable={false}
      />

      {!imgLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
        </div>
      )}

      {/* Widget overlays */}
      {imgLoaded && halaman.widget.map((widget) => {
        const isSelected = widgetTerpilihId === widget.id
        return (
          <div
            key={widget.id}
            className={cn('absolute', isSelected && 'z-10')}
            style={{
              left:   `${widget.posisiX  * 100}%`,
              top:    `${widget.posisiY  * 100}%`,
              width:  `${widget.lebarPct  * 100}%`,
              height: `${widget.tinggiPct * 100}%`,
            }}
            onClick={(e) => { e.stopPropagation(); selectWidget(widget.id) }}
          >
            {/* ── Widget border + content ── */}
            <div className={cn(
              'w-full h-full rounded-md border-2 overflow-hidden',
              'transition-all duration-150',
              isSelected
                ? `${WIDGET_COLOR[widget.tipe]} shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/30`
                : `${WIDGET_COLOR[widget.tipe]} opacity-80 border-dashed hover:opacity-100 hover:border-solid`,
            )}>
              <WorksheetWidgetRenderer widget={widget} mode="builder" />
            </div>

            {/* ── Label chip ── */}
            {showLabels && (
              <span className={cn(
                'absolute -top-5 left-0 text-[9px] font-bold px-1.5 py-0.5 rounded-t',
                'pointer-events-none',
                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                'bg-blue-500 text-white whitespace-nowrap',
              )}>
                {WIDGET_LABEL[widget.tipe]}
                {widget.label ? ` — ${widget.label.slice(0, 20)}` : ''}
              </span>
            )}

            {isSelected && (
              <>
                {/* ── Move bar (atas widget) ── */}
                <div
                  className="absolute inset-0 cursor-move"
                  style={{ zIndex: 5 }}
                  onPointerDown={(e) => startDrag(e, widget, 'move')}
                />

                {/* ── Handle: sisi kanan (resize lebar) ── */}
                <div
                  className={cn(
                    'absolute top-1/2 -translate-y-1/2 -right-3',
                    'w-6 h-10 cursor-ew-resize',
                    'flex items-center justify-center',
                    'bg-blue-500 rounded-full shadow-md',
                    'touch-manipulation',
                  )}
                  style={{ zIndex: 20 }}
                  onPointerDown={(e) => { e.stopPropagation(); startDrag(e, widget, 'resize-e') }}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="w-0.5 h-3 bg-white/70 rounded-full" />
                  </div>
                </div>

                {/* ── Handle: sisi bawah (resize tinggi) ── */}
                <div
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2 -bottom-3',
                    'h-6 w-10 cursor-ns-resize',
                    'flex items-center justify-center',
                    'bg-blue-500 rounded-full shadow-md',
                    'touch-manipulation',
                  )}
                  style={{ zIndex: 20 }}
                  onPointerDown={(e) => { e.stopPropagation(); startDrag(e, widget, 'resize-s') }}
                >
                  <div className="flex gap-0.5">
                    <div className="h-0.5 w-3 bg-white/70 rounded-full" />
                  </div>
                </div>

                {/* ── Handle: pojok kanan bawah (resize keduanya) ── */}
                <div
                  className={cn(
                    'absolute -bottom-3 -right-3',
                    'w-7 h-7 cursor-se-resize',
                    'flex items-center justify-center',
                    'bg-blue-600 rounded-full shadow-md border-2 border-white dark:border-gray-900',
                    'touch-manipulation',
                  )}
                  style={{ zIndex: 25 }}
                  onPointerDown={(e) => { e.stopPropagation(); startDrag(e, widget, 'resize-se') }}
                >
                  <GripVertical size={10} className="text-white rotate-45" />
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
