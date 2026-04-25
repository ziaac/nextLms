'use client'

import { Spinner } from '@/components/ui/Spinner'
import { useRekapSemesterKelas } from '@/hooks/absensi/useWaliKelas'
import type { RekapSemesterSiswaItem } from '@/types'

interface Props {
  kelasId:    string
  semesterId: string
}

const REKAP_COLS: { key: keyof import('@/types').RekapSemesterSiswaRekap; label: string; color: string }[] = [
  { key: 'H', label: 'Hadir',     color: 'text-emerald-600' },
  { key: 'I', label: 'Izin',      color: 'text-purple-600'  },
  { key: 'S', label: 'Sakit',     color: 'text-blue-600'    },
  { key: 'A', label: 'Alpa',      color: 'text-red-600'     },
]

export function RekapSemesterTab({ kelasId, semesterId }: Props) {
  const { data, isLoading } = useRekapSemesterKelas(
    kelasId || null,
    semesterId || null,
  )

  if (isLoading) return (
    <div className="flex items-center justify-center py-16"><Spinner /></div>
  )

  if (!data || data.length === 0) return (
    <p className="text-sm text-gray-400 text-center py-10 italic">
      {!semesterId
        ? 'Pilih semester untuk melihat rekap.'
        : 'Belum ada data rekap semester ini.'}
    </p>
  )

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8 sticky left-0 bg-gray-50 dark:bg-gray-800/60">
              No
            </th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[160px] sticky left-8 bg-gray-50 dark:bg-gray-800/60">
              Nama
            </th>
            {REKAP_COLS.map(({ key, label, color }) => (
              <th key={key} className={'px-3 py-3 text-center text-xs font-bold w-16 ' + color}>
                {key}
                <span className="font-normal text-[9px] block opacity-70">{label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.map((siswa: RekapSemesterSiswaItem, idx: number) => (
            <tr key={siswa.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
              <td className="px-3 py-2.5 text-xs text-gray-400 text-right tabular-nums sticky left-0 bg-white dark:bg-gray-900">
                {idx + 1}
              </td>
              <td className="px-3 py-2.5 sticky left-8 bg-white dark:bg-gray-900">
                <p className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[160px]">
                  {siswa.nama}
                </p>
                <p className="text-[10px] text-gray-400 font-mono">{siswa.nisn}</p>
              </td>
              {REKAP_COLS.map(({ key, color }) => (
                <td key={key} className="px-3 py-2.5 text-center">
                  <span className={
                    'text-sm font-bold tabular-nums ' +
                    (siswa.rekap[key] > 0 ? color : 'text-gray-300 dark:text-gray-600')
                  }>
                    {siswa.rekap[key]}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
