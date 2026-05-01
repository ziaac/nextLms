'use client'

import { TIPE_KALENDER_LABEL, TIPE_KALENDER_COLOR } from '@/types/kalender-akademik.types'
import type { TipeKalender } from '@/types/kalender-akademik.types'

const SEMUA_TIPE: TipeKalender[] = [
  'LIBUR_NASIONAL',
  'LIBUR_SEKOLAH',
  'UJIAN',
  'KEGIATAN_SEKOLAH',
  'RAPAT',
  'LAINNYA',
]

interface KalenderLegendaProps {
  filterTipe: TipeKalender | null
  onFilterChange: (tipe: TipeKalender | null) => void
}

export function KalenderLegenda({ filterTipe, onFilterChange }: KalenderLegendaProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter tipe kalender">
      <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>

      {/* Tombol "Semua" */}
      <button
        type="button"
        onClick={() => onFilterChange(null)}
        aria-pressed={filterTipe === null}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 ${
          filterTipe === null
            ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900 ring-2 ring-gray-800 dark:ring-gray-200'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        Semua
      </button>

      {/* Tombol per tipe */}
      {SEMUA_TIPE.map((tipe) => (
        <button
          key={tipe}
          type="button"
          onClick={() => onFilterChange(filterTipe === tipe ? null : tipe)}
          aria-pressed={filterTipe === tipe}
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current ${
            TIPE_KALENDER_COLOR[tipe]
          } ${
            filterTipe === tipe
              ? 'ring-2 ring-offset-1 ring-current'
              : 'opacity-70 hover:opacity-100'
          }`}
        >
          {TIPE_KALENDER_LABEL[tipe]}
        </button>
      ))}
    </div>
  )
}
