'use client'

import { BookOpen, Clock, Award } from 'lucide-react'
import { Spinner }                from '@/components/ui/Spinner'
import { useKinerjaGuru }         from '@/hooks/absensi/useWaliKelas'

interface Props {
  guruId:     string
  semesterId: string
}

export function KinerjaSemesterTab({ guruId, semesterId }: Props) {
  const { data, isLoading } = useKinerjaGuru(
    guruId || null,
    semesterId || null,
  )

  if (isLoading) return (
    <div className="flex items-center justify-center py-16"><Spinner /></div>
  )

  if (!data) return (
    <p className="text-sm text-gray-400 text-center py-10 italic">
      Belum ada data kinerja untuk semester ini.
    </p>
  )

  return (
    <div className="space-y-4 max-w-2xl">

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
            <Award size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
              {data.totalPertemuan}
            </p>
            <p className="text-xs text-gray-400">Total Pertemuan</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
            <Clock size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
              {data.totalJamMengajar}
            </p>
            <p className="text-xs text-gray-400">Total JP</p>
          </div>
        </div>
      </div>

      {/* Rincian per mapel */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
          Rincian Per Mata Pelajaran
        </p>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {data.rincianPerMapel.map((r: import('@/types').KinerjaGuruRincian, i: number) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <BookOpen size={14} className="text-gray-400" />
              </div>
              <p className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">
                {r.namaMapel}
              </p>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                  {r.jumlahPertemuan}x
                </p>
                <p className="text-[10px] text-gray-400">{r.totalJP} JP</p>
              </div>
            </div>
          ))}
          {data.rincianPerMapel.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8 italic">
              Belum ada data rincian.
            </p>
          )}
        </div>
      </div>

    </div>
  )
}
