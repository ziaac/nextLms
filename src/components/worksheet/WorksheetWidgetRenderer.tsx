'use client'

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { getStroke } from 'perfect-freehand'
import { Play, Pause, Volume2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TipeWidgetWorksheet, AUTO_GRADE_TYPES } from '@/types/worksheet.types'
import type { WidgetWorksheet, WidgetDraft, KonfigurasiWidget, MatchingPair } from '@/types/worksheet.types'

export type WidgetMode = 'builder' | 'player' | 'preview' | 'grading'

interface WidgetRendererProps {
  widget: WidgetWorksheet | WidgetDraft
  mode:   WidgetMode
  value?: string          // jawaban siswa (player / grading)
  onChange?: (v: string) => void
  isSelected?: boolean
  isReadOnly?: boolean
  // Grading: tampilkan benar/salah
  showCorrect?: boolean
}

// ── SVG path helper untuk drawing ─────────────────────────────────────────

function getSvgPathFromStroke(points: number[][]): string {
  if (!points.length) return ''
  const d = points.reduce((acc, [x0, y0], i, arr) => {
    const [x1, y1] = arr[(i + 1) % arr.length]
    acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
    return acc
  }, ['M', points[0][0], points[0][1], 'Q'])
  d.push('Z')
  return d.join(' ')
}

// ── DrawingCanvas ─────────────────────────────────────────────────────────

/**
 * VBOX: logical coordinate space for device-independent drawing.
 * All points are normalized to [0, VBOX] so strokes scale correctly
 * across different screen / window sizes (mobile ↔ desktop).
 * Stroke sizes are also stored in VBOX units.
 */
const VBOX = 1000

interface DrawingCanvasProps {
  value?:      string
  onChange?:   (v: string) => void
  isReadOnly?: boolean
  bgColor?:    string
  label?:      string   // instruksi / pertanyaan (ditampilkan di atas canvas)
}

interface DrawPath {
  points:   [number, number, number][]
  color:    string
  size:     number    // ukuran dalam VBOX units (device-independent)
  opacity:  number    // 0.0 – 1.0
  eraser?:  boolean   // path penghapus
}

/**
 * Format v2: { v: 2, paths: DrawPath[] } — koordinat dinormalisasi ke VBOX.
 * Format lama (legacy): DrawPath[] langsung — koordinat piksel absolut.
 * Keduanya dibaca dengan benar; hanya format v2 yang ditulis.
 */
function parsePaths(raw: string | undefined): DrawPath[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed))                           return parsed          // legacy
    if (parsed?.v === 2 && Array.isArray(parsed.paths)) return parsed.paths    // v2
    return []
  } catch { return [] }
}

function serializePaths(paths: DrawPath[]): string {
  return JSON.stringify({ v: 2, paths })
}

const DRAW_COLORS = ['#1d4ed8', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0f172a']
const DRAW_SIZES  = [2, 4, 8, 14]
const OPACITIES   = [
  { label: '100%', value: 1 },
  { label: '70%',  value: 0.7 },
  { label: '40%',  value: 0.4 },
  { label: '20%',  value: 0.2 },
]

function DrawingCanvas({ value, onChange, isReadOnly, bgColor, label }: DrawingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const [paths, setPaths] = useState<DrawPath[]>(() => parsePaths(value))
  const [currentPath, setCurrentPath] = useState<[number, number, number][]>([])
  const [isDrawing,   setIsDrawing]   = useState(false)
  const [color,       setColor]       = useState('#1d4ed8')
  const [strokeSize,  setStrokeSize]  = useState(4)
  const [opacity,     setOpacity]     = useState(1)
  const [isEraser,    setIsEraser]    = useState(false)

  // Sync value → paths untuk grading / read-only
  useEffect(() => {
    setPaths(parsePaths(value))
  }, [value])

  // Normalise pointer position ke VBOX coordinate space agar coretan
  // tampil identik di semua ukuran layar.
  const getRelativePos = (e: React.PointerEvent): [number, number, number] => {
    const rect = containerRef.current!.getBoundingClientRect()
    return [
      (e.clientX - rect.left) / rect.width  * VBOX,
      (e.clientY - rect.top)  / rect.height * VBOX,
      e.pressure || 0.5,
    ]
  }

  // Skala ukuran stroke fisik (px) ke VBOX units.
  const getScaledSize = (physicalPx: number): number => {
    const rect = containerRef.current?.getBoundingClientRect()
    const refW = rect && rect.width > 0 ? rect.width : VBOX
    return physicalPx * (VBOX / refW)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (isReadOnly) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDrawing(true)
    setCurrentPath([getRelativePos(e)])
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || isReadOnly) return
    setCurrentPath((p) => [...p, getRelativePos(e)])
  }

  const onPointerUp = () => {
    if (!isDrawing || isReadOnly) return
    setIsDrawing(false)
    if (currentPath.length > 2) {
      const physicalSize = isEraser ? strokeSize * 3 : strokeSize
      const newPath: DrawPath = {
        points:  currentPath,
        color:   isEraser ? '#ffffff' : color,
        size:    getScaledSize(physicalSize), // simpan dalam VBOX units
        opacity: isEraser ? 1 : opacity,
        eraser:  isEraser,
      }
      const newPaths = [...paths, newPath]
      setPaths(newPaths)
      onChange?.(serializePaths(newPaths))
    }
    setCurrentPath([])
  }

  const undoLast = () => {
    const newPaths = paths.slice(0, -1)
    setPaths(newPaths)
    onChange?.(serializePaths(newPaths))
  }

  const clearAll = () => {
    setPaths([])
    onChange?.(serializePaths([]))
  }

  const activeColor = isEraser ? '#ffffff' : color

  return (
    <div className="w-full h-full flex flex-col">

      {/* Instruksi / label — latar hijau solid, tidak mengikuti bgColor canvas */}
      {label && (
        <div className="px-2.5 py-1.5 shrink-0 flex items-start gap-1.5"
          style={{ background: 'rgba(22, 163, 74, 0.82)' }}
        >
          <span className="mt-0.5 shrink-0 w-3 h-3 rounded-full bg-white/30 flex items-center justify-center text-white text-[7px] font-bold leading-none">?</span>
          <p className="text-[10px] text-white font-medium leading-snug">{label}</p>
        </div>
      )}

      {/* Toolbar */}
      {!isReadOnly && (
        <div className="flex items-center gap-1 px-1.5 py-1 bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-700 rounded-t-md shrink-0 flex-wrap">

          {/* Warna */}
          <div className="flex items-center gap-1">
            {DRAW_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setColor(c); setIsEraser(false) }}
                className={cn(
                  'w-5 h-5 rounded-full border-2 transition-all touch-manipulation',
                  !isEraser && color === c
                    ? 'border-gray-700 dark:border-gray-300 scale-125 shadow-sm'
                    : 'border-transparent opacity-80 hover:opacity-100',
                )}
                style={{ background: c }}
              />
            ))}
            {/* Transparan / checkerboard swatch */}
            <button
              type="button"
              onClick={() => { setIsEraser(false); setOpacity(0.3) }}
              title="Transparan (opacity 30%)"
              className={cn(
                'w-5 h-5 rounded-full border-2 transition-all touch-manipulation overflow-hidden',
                !isEraser && opacity < 0.5
                  ? 'border-gray-700 dark:border-gray-300 scale-125 shadow-sm'
                  : 'border-gray-300 opacity-80 hover:opacity-100',
              )}
              style={{
                background: `
                  linear-gradient(45deg, #ccc 25%, transparent 25%),
                  linear-gradient(-45deg, #ccc 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #ccc 75%),
                  linear-gradient(-45deg, transparent 75%, #ccc 75%)
                `,
                backgroundSize: '6px 6px',
                backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
              }}
            />
          </div>

          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

          {/* Ukuran stroke */}
          <div className="flex items-center gap-1">
            {DRAW_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStrokeSize(s)}
                title={`Ukuran ${s}`}
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded transition-all touch-manipulation',
                  strokeSize === s
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : 'opacity-40 hover:opacity-80',
                )}
              >
                <span
                  className="rounded-full bg-gray-700 dark:bg-gray-300"
                  style={{ width: s + 1, height: s + 1 }}
                />
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

          {/* Opacity */}
          <div className="flex items-center gap-0.5">
            {OPACITIES.map((op) => (
              <button
                key={op.value}
                type="button"
                onClick={() => { setOpacity(op.value); setIsEraser(false) }}
                title={`Opacity ${op.label}`}
                className={cn(
                  'text-[9px] font-semibold px-1.5 py-0.5 rounded transition-all touch-manipulation',
                  !isEraser && opacity === op.value
                    ? 'bg-gray-700 text-white dark:bg-gray-300 dark:text-gray-900'
                    : 'text-gray-400 hover:text-gray-600',
                )}
              >
                {op.label}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

          {/* Eraser */}
          <button
            type="button"
            onClick={() => setIsEraser((v) => !v)}
            title="Penghapus"
            className={cn(
              'text-[9px] font-semibold px-1.5 py-0.5 rounded transition-all touch-manipulation',
              isEraser
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-orange-500',
            )}
          >
            Hapus
          </button>

          <div className="flex-1" />

          {/* Undo + Clear */}
          <button
            type="button"
            onClick={undoLast}
            disabled={paths.length === 0}
            className="text-[9px] text-gray-400 hover:text-gray-600 disabled:opacity-20 px-1 touch-manipulation"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="text-[9px] text-red-500 hover:text-red-700 font-semibold px-1 touch-manipulation"
          >
            Clear
          </button>
        </div>
      )}

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden"
        style={{
          cursor:      isReadOnly ? 'default' : isEraser ? 'cell' : 'crosshair',
          background:  bgColor ?? 'transparent',
          touchAction: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/*
          * viewBox="0 0 VBOX VBOX" + preserveAspectRatio="none":
          * Semua koordinat path tersimpan dalam ruang logis [0, VBOX].
          * SVG otomatis menskalakan ke ukuran container aktual,
          * sehingga coretan tampil proporsional di semua ukuran layar.
          */}
        <svg
          viewBox={`0 0 ${VBOX} ${VBOX}`}
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          style={{ display: 'block' }}
        >
          {/* Normal paths */}
          {paths.filter((p) => !p.eraser).map((p, i) => {
            const stroke = getStroke(p.points, { size: p.size, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })
            return (
              <path
                key={i}
                d={getSvgPathFromStroke(stroke)}
                fill={p.color}
                fillOpacity={p.opacity ?? 1}
              />
            )
          })}
          {/* Eraser paths — destination-out via mix-blend-mode */}
          <g style={{ mixBlendMode: 'destination-out' as React.CSSProperties['mixBlendMode'] }}>
            {paths.filter((p) => p.eraser).map((p, i) => {
              const stroke = getStroke(p.points, { size: p.size, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })
              return <path key={i} d={getSvgPathFromStroke(stroke)} fill="black" />
            })}
          </g>
          {/* Current path preview — ukuran juga dinormalisasi ke VBOX */}
          {currentPath.length > 2 && (() => {
            const physicalPreview = isEraser ? strokeSize * 3 : strokeSize
            const previewSize = getScaledSize(physicalPreview)
            const stroke = getStroke(currentPath, { size: previewSize, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })
            return (
              <path
                d={getSvgPathFromStroke(stroke)}
                fill={isEraser ? 'rgba(255,100,0,0.3)' : activeColor}
                fillOpacity={isEraser ? 0.5 : opacity}
              />
            )
          })()}
        </svg>
      </div>
    </div>
  )
}

// ── AudioPlayer ────────────────────────────────────────────────────────────

function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else         { audioRef.current.play(); setPlaying(true) }
  }

  return (
    <div className="flex items-center gap-2 w-full h-full px-2">
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={() => {
          if (!audioRef.current) return
          setProgress(audioRef.current.currentTime / (audioRef.current.duration || 1) * 100)
        }}
      />
      <button
        type="button"
        onClick={toggle}
        className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shrink-0 text-white transition-colors"
      >
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <Volume2 size={12} className="text-gray-400 shrink-0" />
    </div>
  )
}

// ── MatchingWidget ────────────────────────────────────────────────────────

const MATCH_COLORS = [
  'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-200',
  'bg-violet-100 border-violet-400 text-violet-800 dark:bg-violet-900/40 dark:border-violet-500 dark:text-violet-200',
  'bg-amber-100 border-amber-400 text-amber-800 dark:bg-amber-900/40 dark:border-amber-500 dark:text-amber-200',
  'bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-500 dark:text-emerald-200',
  'bg-rose-100 border-rose-400 text-rose-800 dark:bg-rose-900/40 dark:border-rose-500 dark:text-rose-200',
  'bg-cyan-100 border-cyan-400 text-cyan-800 dark:bg-cyan-900/40 dark:border-cyan-500 dark:text-cyan-200',
]

interface MatchingWidgetProps {
  pairs:      MatchingPair[]
  value:      string   // JSON: Record<leftItem, rightItem>
  onChange?:  (v: string) => void
  isReadOnly: boolean
  showCorrect: boolean
}

function MatchingWidget({ pairs, value, onChange, isReadOnly, showCorrect }: MatchingWidgetProps) {
  // Shuffle right items once, stable across re-renders using useMemo
  const shuffledRight = useMemo(() => {
    const rights = pairs.map((p) => p.right)
    for (let i = rights.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rights[i], rights[j]] = [rights[j], rights[i]]
    }
    return rights
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairs.length])

  const matchMap: Record<string, string> = useMemo(() => {
    try { return value ? JSON.parse(value) : {} } catch { return {} }
  }, [value])

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)

  // Correct pairs map: left → right
  const correctMap = useMemo(
    () => Object.fromEntries(pairs.map((p) => [p.left, p.right])),
    [pairs],
  )

  // Color index for a left item (based on its match)
  const colorIdx = (left: string) => pairs.findIndex((p) => p.left === left) % MATCH_COLORS.length

  const handleLeftClick = (left: string) => {
    if (isReadOnly) return
    setSelectedLeft(selectedLeft === left ? null : left)
  }

  const handleRightClick = (right: string) => {
    if (isReadOnly || !selectedLeft) return
    const next = { ...matchMap, [selectedLeft]: right }
    onChange?.(JSON.stringify(next))
    setSelectedLeft(null)
  }

  const getMatchedLeft = (right: string) =>
    Object.entries(matchMap).find(([, r]) => r === right)?.[0] ?? null

  if (pairs.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 italic">
        Belum ada pasangan
      </div>
    )
  }

  return (
    <div className="w-full h-full flex gap-1 p-1 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm rounded-md border border-indigo-200/60 overflow-hidden">
      {/* Left column */}
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
        {pairs.map((p, i) => {
          const isSelected = selectedLeft === p.left
          const isMatched  = matchMap[p.left] !== undefined
          const isCorrectMatch = showCorrect && matchMap[p.left] === correctMap[p.left]
          const isWrongMatch   = showCorrect && isMatched && matchMap[p.left] !== correctMap[p.left]
          return (
            <button
              key={i}
              type="button"
              disabled={isReadOnly}
              onClick={() => handleLeftClick(p.left)}
              className={cn(
                'text-left px-1.5 py-0.5 rounded border text-[10px] font-medium transition-all truncate',
                isCorrectMatch && 'bg-emerald-50 border-emerald-400 text-emerald-800 dark:bg-emerald-900/30',
                isWrongMatch   && 'bg-red-50 border-red-400 text-red-800 dark:bg-red-900/30',
                isSelected     && !showCorrect && `${MATCH_COLORS[i % MATCH_COLORS.length]} ring-1 ring-offset-1`,
                isMatched  && !isSelected && !showCorrect && `${MATCH_COLORS[i % MATCH_COLORS.length]} opacity-70`,
                !isMatched && !isSelected && !showCorrect && 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300',
                !isReadOnly && !isSelected && 'hover:opacity-90',
              )}
            >
              {p.left || <em className="opacity-40">Item {i + 1}</em>}
            </button>
          )
        })}
      </div>

      {/* Arrow column */}
      <div className="flex flex-col justify-around py-1">
        {pairs.map((_, i) => (
          <ArrowRight key={i} size={10} className="text-gray-300 dark:text-gray-600 shrink-0" />
        ))}
      </div>

      {/* Right column */}
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
        {shuffledRight.map((right, i) => {
          const matchedLeft  = getMatchedLeft(right)
          const isMatched    = matchedLeft !== null
          const colorIndex   = isMatched ? colorIdx(matchedLeft!) : -1
          const isCorrectMatch = showCorrect && isMatched && correctMap[matchedLeft!] === right
          const isWrongMatch   = showCorrect && isMatched && correctMap[matchedLeft!] !== right
          const isTarget       = selectedLeft !== null && !isReadOnly
          return (
            <button
              key={i}
              type="button"
              disabled={isReadOnly && !isMatched}
              onClick={() => handleRightClick(right)}
              className={cn(
                'text-left px-1.5 py-0.5 rounded border text-[10px] font-medium transition-all truncate',
                isCorrectMatch && 'bg-emerald-50 border-emerald-400 text-emerald-800 dark:bg-emerald-900/30',
                isWrongMatch   && 'bg-red-50 border-red-400 text-red-800 dark:bg-red-900/30',
                isMatched && !showCorrect && colorIndex >= 0 && `${MATCH_COLORS[colorIndex]} opacity-80`,
                !isMatched && !showCorrect && 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300',
                isTarget && !isMatched && 'hover:bg-indigo-50 hover:border-indigo-400 dark:hover:bg-indigo-900/20 cursor-pointer',
                isTarget && 'ring-1 ring-indigo-300 dark:ring-indigo-700',
              )}
            >
              {right || <em className="opacity-40">Pasangan {i + 1}</em>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Widget Renderer ───────────────────────────────────────────────────

export function WorksheetWidgetRenderer({
  widget, mode, value = '', onChange,
  isReadOnly = false, showCorrect = false,
}: WidgetRendererProps) {
  const cfg = (widget.konfigurasi ?? {}) as KonfigurasiWidget
  const isPlayer   = mode === 'player'
  const isGrading  = mode === 'grading'
  const isBuilder  = mode === 'builder'
  const readOnly   = isReadOnly || isBuilder || mode === 'preview'

  // Grading: benar / salah indicator
  const isAutoGrade = AUTO_GRADE_TYPES.includes(widget.tipe)
  const isCorrect = showCorrect && isAutoGrade && cfg.correctAnswer
    ? value.trim().toLowerCase() === cfg.correctAnswer.trim().toLowerCase()
    : null

  const baseInput = cn(
    'w-full h-full bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm',
    'border rounded-md text-sm px-2 py-1 outline-none transition-colors resize-none',
    'placeholder:text-gray-300 dark:placeholder:text-gray-600',
    readOnly
      ? 'border-gray-200/60 dark:border-gray-700/40 cursor-default'
      : 'border-blue-400/70 dark:border-blue-600/60 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30',
    isCorrect === true  && 'border-emerald-400 bg-emerald-50/90',
    isCorrect === false && 'border-red-400 bg-red-50/90',
  )

  return (
    <div className="relative w-full h-full">
      {/* Grading: correct/wrong indicator badge */}
      {showCorrect && isCorrect !== null && (
        <span className={cn(
          'absolute -top-2 -right-2 z-10 rounded-full',
          isCorrect ? 'text-emerald-500' : 'text-red-500',
        )}>
          {isCorrect
            ? <CheckCircle2 size={14} className="drop-shadow-sm" />
            : <XCircle     size={14} className="drop-shadow-sm" />
          }
        </span>
      )}

      {widget.tipe === TipeWidgetWorksheet.TEXT_INPUT && (
        <textarea
          className={cn(baseInput, 'text-sm leading-snug')}
          placeholder={cfg.placeholder ?? 'Jawaban…'}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          rows={2}
        />
      )}

      {widget.tipe === TipeWidgetWorksheet.NUMBER_INPUT && (
        <input
          type="number"
          className={baseInput}
          placeholder={cfg.placeholder ?? '0'}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )}

      {widget.tipe === TipeWidgetWorksheet.FILL_IN_BLANK && (
        <input
          type="text"
          className={cn(baseInput, 'text-center font-medium tracking-wide')}
          placeholder={cfg.placeholder ?? '…'}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )}

      {widget.tipe === TipeWidgetWorksheet.MULTIPLE_CHOICE && (
        <div className="w-full h-full overflow-auto flex flex-col gap-1 p-1 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm rounded-md border border-blue-200/60">
          {(cfg.options ?? []).map((opt, i) => {
            const letter = String.fromCharCode(65 + i)
            const isSel = value === opt
            const isCorrectOpt = showCorrect && cfg.correctAnswer === opt
            return (
              <button
                key={i}
                type="button"
                disabled={readOnly}
                onClick={() => !readOnly && onChange?.(opt)}
                className={cn(
                  'flex items-center gap-1.5 text-left px-2 py-1 rounded text-xs font-medium transition-all',
                  'border',
                  isSel && !showCorrect    && 'bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300',
                  isCorrectOpt             && 'bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-900/30',
                  isSel && !isCorrectOpt && showCorrect && 'bg-red-50 border-red-400 text-red-700 dark:bg-red-900/30',
                  !isSel && !isCorrectOpt  && 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
                  !readOnly && !isSel && 'hover:bg-blue-50/50 hover:border-blue-300',
                )}
              >
                <span className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0',
                  isSel ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500',
                )}>
                  {letter}
                </span>
                <span className="truncate">{opt || <em className="opacity-40">Opsi {letter}</em>}</span>
              </button>
            )
          })}
        </div>
      )}

      {widget.tipe === TipeWidgetWorksheet.DROPDOWN && (
        <select
          className={cn(baseInput, 'cursor-pointer')}
          value={value}
          disabled={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
        >
          <option value="">— Pilih —</option>
          {(cfg.options ?? []).map((opt, i) => (
            <option key={i} value={opt}>{opt || `Opsi ${i + 1}`}</option>
          ))}
        </select>
      )}

      {widget.tipe === TipeWidgetWorksheet.AUDIO_PLAYER && (
        <div className="w-full h-full rounded-md bg-emerald-50/90 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center overflow-hidden">
          {(cfg.audioUrl || (widget as any).audioUrl) ? (
            <AudioPlayer src={cfg.audioUrl ?? (widget as any).audioUrl ?? ''} />
          ) : (
            <div className="flex items-center gap-2 px-3 text-xs text-emerald-600 dark:text-emerald-400 opacity-60">
              <Volume2 size={14} />
              {isBuilder ? 'Upload audio…' : 'Audio tidak tersedia'}
            </div>
          )}
        </div>
      )}

      {widget.tipe === TipeWidgetWorksheet.DRAWING_AREA && (
        <div className={cn(
          'w-full h-full rounded-md border overflow-hidden',
          readOnly
            ? 'border-gray-200/60 dark:border-gray-700/40'
            : 'border-purple-300 dark:border-purple-700',
        )}>
          <DrawingCanvas
            value={value}
            onChange={onChange}
            isReadOnly={readOnly}
            bgColor={cfg.bgColor}
            label={!isBuilder && widget.label ? widget.label : undefined}
          />
        </div>
      )}

      {widget.tipe === TipeWidgetWorksheet.MATCHING && (
        isBuilder ? (
          <div className="w-full h-full flex items-center justify-center bg-indigo-50/80 dark:bg-indigo-900/20 rounded-md border border-indigo-200/60 dark:border-indigo-800/60">
            <div className="text-center">
              <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">Pasangkan</p>
              <p className="text-[9px] text-indigo-400 dark:text-indigo-600 mt-0.5">{(cfg.pairs ?? []).length} pasangan</p>
            </div>
          </div>
        ) : (
          <MatchingWidget
            pairs={cfg.pairs ?? []}
            value={value}
            onChange={onChange}
            isReadOnly={readOnly}
            showCorrect={showCorrect}
          />
        )
      )}
    </div>
  )
}
