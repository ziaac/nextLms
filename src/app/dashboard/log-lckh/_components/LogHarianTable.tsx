'use client'

import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui'
import type { HarianItem } from '@/types/guru-log.types'
import { ClipboardList } from 'lucide-react'

interface LogHarianTableProps {
  data:      HarianItem[]
  isLoading: boolean
  guruId?:   string   // jika ada, mode manajemen — link detail menyertakan guruId
}

// Urutan kolom: Senin (1) → Minggu (0)
const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
const HARI_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

// Mapping nama hari → index kolom (0-based, Senin=0)
const HARI_TO_COL: Record<string, number> = {
  Senin: 0, Selasa: 1, Rabu: 2, Kamis: 3, Jumat: 4, Sabtu: 5, Minggu: 6,
}

export function LogHarianTable({ data, isLoading, guruId }: LogHarianTableProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden p-4 space-y-3">
        {/* Header skeleton */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full rounded" />
          ))}
        </div>
        {/* Row skeletons */}
        {Array.from({ length: 3 }).map((_, row) => (
          <div key={row} className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }).map((_, col) => (
              <Skeleton key={col} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center">
        <ClipboardList className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Tidak ada data untuk bulan ini.</p>
      </div>
    )
  }

  // Kelompokkan data ke dalam minggu-minggu
  // Setiap minggu adalah array 7 slot (Senin–Minggu), null jika tidak ada tanggal
  const weeks: (HarianItem | null)[][] = []
  let currentWeek: (HarianItem | null)[] = Array(7).fill(null)

  for (const item of data) {
    const col = HARI_TO_COL[item.namaHari] ?? 0

    // Jika Senin dan currentWeek sudah punya data → mulai minggu baru
    if (col === 0 && currentWeek.some((c) => c !== null)) {
      weeks.push(currentWeek)
      currentWeek = Array(7).fill(null)
    }

    currentWeek[col] = item
  }
  // Tambahkan minggu terakhir
  if (currentWeek.some((c) => c !== null)) {
    weeks.push(currentWeek)
  }

  const handleNavigate = (item: HarianItem) => {
    const href = guruId
      ? `/dashboard/log-lckh/${item.tanggal}?guruId=${guruId}`
      : `/dashboard/log-lckh/${item.tanggal}`
    router.push(href)
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header hari */}
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        {HARI_ORDER.map((hari, i) => {
          const isWeekend = i >= 5
          return (
            <div
              key={hari}
              className={`py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide ${
                isWeekend
                  ? 'text-gray-300 dark:text-gray-600'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className="hidden sm:inline">{hari}</span>
              <span className="sm:hidden">{HARI_SHORT[i]}</span>
            </div>
          )
        })}
      </div>

      {/* Minggu-minggu */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800/60 p-2 space-y-1.5">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 gap-1.5 pt-1.5 first:pt-0">
            {week.map((item, colIdx) => {
              const isWeekend = colIdx >= 5

              if (!item) {
                // Slot kosong (awal/akhir bulan)
                return (
                  <div
                    key={colIdx}
                    className="h-16 rounded-xl bg-gray-50/50 dark:bg-gray-800/20"
                  />
                )
              }

              const [, , d] = item.tanggal.split('-')
              const dayNum = parseInt(d, 10)
              const hasActivity = item.jumlahInternal > 0 || item.jumlahEksternal > 0

              return (
                <button
                  key={item.tanggal}
                  type="button"
                  onClick={() => handleNavigate(item)}
                  className={`
                    h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 px-1
                    transition-all text-center group
                    ${isWeekend
                      ? 'bg-gray-50 dark:bg-gray-800/20 hover:bg-gray-100 dark:hover:bg-gray-800/40'
                      : hasActivity
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40'
                        : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/30 border border-gray-100 dark:border-gray-800'
                    }
                  `}
                >
                  {/* Tanggal */}
                  <span className={`text-sm font-bold leading-none ${
                    isWeekend
                      ? 'text-gray-300 dark:text-gray-600'
                      : hasActivity
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {dayNum}
                  </span>

                  {/* Badge aktivitas */}
                  {hasActivity && (
                    <div className="flex items-center gap-1 mt-0.5">
                      {item.jumlahInternal > 0 && (
                        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${
                          isWeekend
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                            : 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                        }`}>
                          {item.jumlahInternal}i
                        </span>
                      )}
                      {item.jumlahEksternal > 0 && (
                        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${
                          isWeekend
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                            : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {item.jumlahEksternal}e
                        </span>
                      )}
                    </div>
                  )}

                  {/* Dot kosong jika tidak ada aktivitas */}
                  {!hasActivity && (
                    <span className={`w-1 h-1 rounded-full mt-0.5 ${
                      isWeekend ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">2i</span>
          <span className="text-[11px] text-gray-400">Internal sistem</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">1e</span>
          <span className="text-[11px] text-gray-400">Eksternal (input manual)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800 inline-block" />
          <span className="text-[11px] text-gray-400">Sabtu / Minggu</span>
        </div>
      </div>
    </div>
  )
}
