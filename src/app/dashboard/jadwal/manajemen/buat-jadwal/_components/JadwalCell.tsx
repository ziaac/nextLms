'use client'

import { useDraggable, useDroppable } from '@dnd-kit/core'
import { X, UserX, Ban, GripVertical } from 'lucide-react'
import type { CellKey, CellState, PaletteMapel } from './jadwal-form.types'
import type { MasterJam } from '@/types/master-jam.types'

interface Props {
  cellKey:      CellKey
  cellState:    CellState | undefined
  paletteMapel: PaletteMapel[]
  masterJam:    MasterJam
  isFocused:    boolean
  isForbidden:  boolean
  onFocus:      () => void
  onClear:      () => void
}

const KATEGORI_COLOR: Record<string, string> = {
  WAJIB:             'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  PEMINATAN:         'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  LINTAS_MINAT:      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  MULOK:             'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  PENGEMBANGAN_DIRI: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
}

export function JadwalCell({
  cellKey, cellState, paletteMapel, masterJam,
  isFocused, isForbidden, onFocus, onClear,
}: Props) {
  const isEmpty   = !cellState?.mataPelajaranId
  const mapelInfo = cellState ? paletteMapel.find((p) => p.id === cellState.mataPelajaranId) : null
  const guruNama  = cellState?.guruId
    ? (mapelInfo?.guruPool?.find((g) => g.guruId === cellState.guruId)?.namaLengkap ?? '—')
    : null

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id:       'cell-' + cellKey,
    disabled: isForbidden,
  })
  const { setNodeRef: setDragRef, listeners, attributes, isDragging } = useDraggable({
    id:       'cell-drag-' + cellKey,
    disabled: isEmpty || isForbidden,
    data:     { cellKey, cellState, sourceType: 'cell' },
  })

  const setRef = (el: HTMLElement | null) => {
    setDropRef(el)
    setDragRef(el)
  }

  if (isForbidden) {
    return (
      <div ref={setDropRef}
        className="rounded-lg min-h-[80px] flex items-center justify-center bg-gray-100/60 dark:bg-gray-800/20 border border-dashed border-gray-200 dark:border-gray-700 opacity-40"
        title="Beririsan dengan sesi yang sudah terisi">
        <Ban className="h-4 w-4 text-gray-300 dark:text-gray-600" />
      </div>
    )
  }

  return (
    <div
      ref={setRef}
      className={[
        'rounded-lg border transition-all min-h-[80px] flex flex-col',
        isDragging ? 'opacity-30' : '',
        isOver
          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 shadow-md'
          : isEmpty
          ? 'border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 hover:border-emerald-200 hover:bg-emerald-50/30'
          : isFocused
          ? 'border-emerald-400 ring-2 ring-emerald-200 dark:ring-emerald-800 bg-white dark:bg-gray-900'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-emerald-200',
      ].join(' ')}
    >
      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] text-gray-300 dark:text-gray-600 select-none">
            {isOver ? 'Lepaskan' : 'Drop mapel'}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-1 p-1.5">
          <div className="flex items-start gap-1">
            {/* Drag handle — lebih visible */}
            <div
              {...listeners}
              {...attributes}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 mt-0.5 p-0.5 rounded text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-grab active:cursor-grabbing touch-none transition-colors"
              title="Drag ke slot lain"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </div>

            <div className="flex-1 min-w-0 cursor-pointer" onClick={onFocus}>
              <span className={
                'inline-block text-[9px] font-bold px-1 py-0.5 rounded mr-0.5 leading-none ' +
                (KATEGORI_COLOR[mapelInfo?.kategori ?? ''] ?? 'bg-gray-100 text-gray-600')
              }>
                {cellState.mataPelajaranKode}
              </span>
              <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 leading-tight mt-0.5 line-clamp-2">
                {cellState.mataPelajaranNama}
              </p>
            </div>

            {/* X button — onPointerDown stopPropagation cegah drag/focus */}
            <button
              type="button"
              onPointerDown={(e) => { e.stopPropagation(); e.preventDefault() }}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClear() }}
              className="shrink-0 text-gray-300 hover:text-red-400 transition-colors mt-0.5 z-10"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <div className="cursor-pointer" onClick={onFocus}>
            {guruNama ? (
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium truncate">
                {guruNama}
              </p>
            ) : (
              /* Merah jika belum ada guru */
              <p className="text-[10px] flex items-center gap-1 text-red-400 dark:text-red-500">
                <UserX className="h-2.5 w-2.5" />
                {isFocused ? 'Pilih guru di panel kiri' : 'Belum ada guru'}
              </p>
            )}
            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
              {cellState.ruanganNama || 'Ruangan kelas'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
