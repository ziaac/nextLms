'use client'

import { useRouter } from 'next/navigation'
import { Skeleton, Badge } from '@/components/ui'
import type { HarianItem } from '@/types/guru-log.types'
import { ClipboardList } from 'lucide-react'

interface LogHarianTableProps {
  data:      HarianItem[]
  isLoading: boolean
  guruId?:   string   // jika ada, mode manajemen — link detail menyertakan guruId
}

export function LogHarianTable({ data, isLoading, guruId }: LogHarianTableProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-5 w-12 rounded-full ml-auto" />
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          ))}
        </div>
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

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[2fr_1fr_auto_auto_auto] gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tanggal</p>
        <p className="hidden sm:block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">Hari</p>
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">Internal</p>
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">Eksternal</p>
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-right">Aksi</p>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {data.map((item) => {
          const [, m, d] = item.tanggal.split('-')
          const isWeekend = item.namaHari === 'Minggu' || item.namaHari === 'Sabtu'
          const hasActivity = item.jumlahInternal > 0 || item.jumlahEksternal > 0

          return (
            <div
              key={item.tanggal}
              className={`grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[2fr_1fr_auto_auto_auto] gap-3 items-center px-4 py-3 transition-colors ${
                isWeekend
                  ? 'bg-gray-50/50 dark:bg-gray-800/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
              }`}
            >
              {/* Tanggal */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                  hasActivity
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}>
                  {parseInt(d, 10)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {item.namaHari}, {parseInt(d, 10)} / {parseInt(m, 10)}
                  </p>
                </div>
              </div>

              {/* Hari (hidden on mobile) */}
              <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 text-center">
                {item.namaHari}
              </p>

              {/* Badge Internal */}
              <div className="flex justify-center">
                {item.jumlahInternal > 0 ? (
                  <Badge variant="info">{item.jumlahInternal}</Badge>
                ) : (
                  <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                )}
              </div>

              {/* Badge Eksternal */}
              <div className="flex justify-center">
                {item.jumlahEksternal > 0 ? (
                  <Badge variant="success">{item.jumlahEksternal}</Badge>
                ) : (
                  <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                )}
              </div>

              {/* Aksi */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const href = guruId
                      ? `/dashboard/log-lckh/${item.tanggal}?guruId=${guruId}`
                      : `/dashboard/log-lckh/${item.tanggal}`
                    router.push(href)
                  }}
                  className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                >
                  Detail
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
