'use client'

import type { HariEnum } from '@/types/jadwal.types'

const HARI_LIST: HariEnum[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']
const HARI_LABEL: Record<HariEnum, string> = {
  SENIN: 'Sen', SELASA: 'Sel', RABU: 'Rab',
  KAMIS: 'Kam', JUMAT: 'Jum', SABTU: 'Sab',
}

interface Props {
  available:  HariEnum[]           // hari yang ada datanya
  selected:   HariEnum | 'ALL'
  onChange:   (hari: HariEnum | 'ALL') => void
}

export function HariFilter({ available, selected, onChange }: Props) {
  if (available.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Tombol "Semua" */}
      <button
        type="button"
        onClick={() => onChange('ALL')}
        className={[
          'text-xs font-medium px-2.5 py-1 rounded-full border transition-colors',
          selected === 'ALL'
            ? 'border-gray-400 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-500'
            : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300 hover:text-gray-600',
        ].join(' ')}
      >
        Semua
      </button>

      {/* Tombol per hari */}
      {available.map((hari) => (
        <button
          key={hari}
          type="button"
          onClick={() => onChange(hari === selected ? 'ALL' : hari)}
          className={[
            'text-xs font-medium px-2.5 py-1 rounded-full border transition-colors',
            selected === hari
              ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-600'
              : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-emerald-200 hover:text-emerald-600',
          ].join(' ')}
        >
          {HARI_LABEL[hari]}
        </button>
      ))}
    </div>
  )
}
