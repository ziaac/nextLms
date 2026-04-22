'use client'

import { AlertTriangle } from 'lucide-react'
import { useSiswaKritis } from '@/hooks/absensi/useAbsensiManajemen'

interface Props {
  semesterId: string
}

export function SiswaKritisWidget({ semesterId }: Props) {
  const { data, isLoading } = useSiswaKritis(semesterId)

  if (isLoading || !data || data.length === 0) return null

  return (
    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">
          Siswa Perlu Perhatian — Alpa Berlebihan
        </p>
        <span className="ml-auto text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
          {data.length} siswa
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {data.slice(0, 9).map((s) => (
          <div
            key={s.userId}
            className="flex items-center justify-between gap-2 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 border border-red-100 dark:border-red-900"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.nama}</p>
              <p className="text-xs text-gray-400">{s.kelasNama}</p>
            </div>
            <span className="text-xs font-bold text-red-600 dark:text-red-400 flex-shrink-0 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-lg">
              {s.jumlahAlpa}x Alpa
            </span>
          </div>
        ))}
        {data.length > 9 && (
          <div className="flex items-center justify-center text-xs text-red-400 italic">
            +{data.length - 9} siswa lainnya
          </div>
        )}
      </div>
    </div>
  )
}
