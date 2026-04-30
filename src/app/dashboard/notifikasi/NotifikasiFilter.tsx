'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { getTipeLabel } from '@/components/dashboard/notifikasi-utils'
import type { TipeNotifikasi } from '@/types/enums'

const TIPE_OPTIONS: TipeNotifikasi[] = [
  'INFO', 'TUGAS', 'PENILAIAN', 'PEMBAYARAN',
  'ABSENSI', 'PENGUMUMAN', 'SIKAP', 'PERIZINAN',
  'EKSTRAKURIKULER', 'SISTEM',
]

const STATUS_OPTIONS = [
  { label: 'Semua', value: '' },
  { label: 'Belum Dibaca', value: 'false' },
  { label: 'Sudah Dibaca', value: 'true' },
]

export function NotifikasiFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentTipe = searchParams.get('tipe') ?? ''
  const currentIsRead = searchParams.get('isRead') ?? ''

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page') // reset ke halaman 1 saat filter berubah
    router.push(`/dashboard/notifikasi?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Filter Tipe */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => updateFilter('tipe', '')}
          className={`
            px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
            ${currentTipe === ''
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
        >
          Semua Tipe
        </button>
        {TIPE_OPTIONS.map((tipe) => (
          <button
            key={tipe}
            onClick={() => updateFilter('tipe', tipe)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${currentTipe === tipe
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            {getTipeLabel(tipe)}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px bg-gray-200 dark:bg-gray-700 self-stretch mx-1" />

      {/* Filter Status Baca */}
      <div className="flex gap-1.5">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateFilter('isRead', opt.value)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${currentIsRead === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
