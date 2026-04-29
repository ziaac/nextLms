'use client'

import { Search, X } from 'lucide-react'

const BULAN_OPTIONS = [
  { value: 1,  label: 'Januari' },
  { value: 2,  label: 'Februari' },
  { value: 3,  label: 'Maret' },
  { value: 4,  label: 'April' },
  { value: 5,  label: 'Mei' },
  { value: 6,  label: 'Juni' },
  { value: 7,  label: 'Juli' },
  { value: 8,  label: 'Agustus' },
  { value: 9,  label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
]

interface GuruLckhFilterBarProps {
  bulan:         number
  tahun:         number
  search:        string
  onBulanChange: (v: number) => void
  onTahunChange: (v: number) => void
  onSearchChange:(v: string) => void
}

export function GuruLckhFilterBar({
  bulan, tahun, search,
  onBulanChange, onTahunChange, onSearchChange,
}: GuruLckhFilterBarProps) {
  const currentYear = new Date().getFullYear()
  const tahunOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search nama guru */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari nama guru..."
          className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Bulan */}
      <select
        value={bulan}
        onChange={(e) => onBulanChange(Number(e.target.value))}
        className="py-2 pl-3 pr-8 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
      >
        {BULAN_OPTIONS.map((b) => (
          <option key={b.value} value={b.value}>{b.label}</option>
        ))}
      </select>

      {/* Filter Tahun */}
      <select
        value={tahun}
        onChange={(e) => onTahunChange(Number(e.target.value))}
        className="py-2 pl-3 pr-8 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
      >
        {tahunOptions.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}
