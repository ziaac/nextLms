'use client'

import { useRef } from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { PaletteMapel } from './jadwal-form.types'

const KATEGORI_COLOR: Record<string, string> = {
  WAJIB:             'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  PEMINATAN:         'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  LINTAS_MINAT:      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  MULOK:             'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  PENGEMBANGAN_DIRI: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
}

interface Props {
  paletteMapel:   PaletteMapel[]
  placementCount: Record<string, number>
}

export function MapelPalette({ paletteMapel, placementCount }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Mata Pelajaran
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Drag ke slot jadwal</p>
      </div>
      <div className="p-2 space-y-1.5 overflow-y-auto flex-1">
        {paletteMapel.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4 italic">
            Belum ada mata pelajaran
          </p>
        )}
        {paletteMapel.map((mapel) => (
          <DraggableMapelCard
            key={mapel.id}
            mapel={mapel}
            count={placementCount[mapel.id] ?? 0}
          />
        ))}
      </div>
    </div>
  )
}

function DraggableMapelCard({ mapel, count }: { mapel: PaletteMapel; count: number }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id:   'mapel-' + mapel.id,
    data: { mapel, sourceType: 'palette' },
  })

  // Track apakah ini drag atau click biasa
  // Jika mouse bergerak > 4px = drag, bukan click
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null)
  const wasDragged     = useRef(false)

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onPointerDown={(e) => {
        pointerDownPos.current = { x: e.clientX, y: e.clientY }
        wasDragged.current = false
        listeners?.onPointerDown?.(e)
      }}
      onPointerMove={(e) => {
        if (!pointerDownPos.current) return
        const dx = Math.abs(e.clientX - pointerDownPos.current.x)
        const dy = Math.abs(e.clientY - pointerDownPos.current.y)
        if (dx > 4 || dy > 4) wasDragged.current = true
      }}
      className={[
        'flex items-start gap-2 rounded-lg border px-2.5 py-2 select-none transition-all',
        isDragging
          ? 'opacity-30 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 cursor-grabbing'
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-grab',
      ].join(' ')}
    >
      <span className={
        'shrink-0 mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ' +
        (KATEGORI_COLOR[mapel.kategori] ?? 'bg-gray-100 text-gray-600')
      }>
        {mapel.kode}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-tight truncate">
          {mapel.nama}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {mapel.guruPool.length} guru
        </p>
      </div>
      {count > 0 && (
        <span className="shrink-0 text-[10px] font-bold bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
          {count}
        </span>
      )}
    </div>
  )
}
