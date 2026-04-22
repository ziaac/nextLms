'use client'

import type { RosterKelasResponse, RosterItem } from '@/types/jadwal.types'
import { HARI_LABEL, collectTimeSlots, getActiveHari, getMapelPalette } from './MatrixUtils'

interface Props {
  roster: RosterKelasResponse
}

export function JadwalKelasMatrix({ roster }: Props) {
  const timeSlots = collectTimeSlots(roster.roster as any)
  const activeHari = getActiveHari(roster.roster as any)

  if (timeSlots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <div className="text-5xl mb-3">📋</div>
        <p className="text-base font-medium">Belum ada jadwal</p>
        <p className="text-sm mt-1">Kelas ini belum memiliki jadwal pada semester ini</p>
      </div>
    )
  }

  const rosterMap: Record<string, Record<string, RosterItem>> = {}
  for (const hari of activeHari) {
    rosterMap[hari] = {}
    for (const item of (roster.roster[hari] ?? [])) {
      rosterMap[hari][item.jamMulai] = item
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700/50">
      <table className="w-full border-collapse text-sm min-w-[600px]">
        <thead>
          <tr>
            {/* Kolom waktu */}
            <th className="sticky left-0 z-10 w-28 min-w-[7rem] bg-gray-50 dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 px-3 py-3 text-left">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Jam</span>
            </th>
            {activeHari.map((hari) => (
              <th
                key={hari}
                className="bg-emerald-600 dark:bg-emerald-700 px-3 py-3 text-center border-b border-r last:border-r-0 border-emerald-700 dark:border-emerald-600"
              >
                <span className="text-xs font-bold text-white uppercase tracking-widest">{HARI_LABEL[hari]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((jamMulai, rowIdx) => {
            // Cari jamSelesai dari baris manapun yang punya slot ini
            let jamSelesai = ''
            for (const hari of activeHari) {
              if (rosterMap[hari][jamMulai]) { jamSelesai = rosterMap[hari][jamMulai].jamSelesai; break }
            }
            const isEven = rowIdx % 2 === 0
            return (
              <tr key={jamMulai} className={isEven ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/60 dark:bg-gray-800/40'}>
                {/* Kolom waktu sticky */}
                <td className={`sticky left-0 z-10 border-r border-b border-gray-100 dark:border-gray-700/80 px-3 py-2.5 ${isEven ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/80 dark:bg-gray-800/60'}`}>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 tabular-nums">{jamMulai.slice(0, 5)}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">{jamSelesai.slice(0, 5)}</p>
                </td>
                {activeHari.map((hari) => {
                  const item = rosterMap[hari][jamMulai]
                  if (!item) {
                    return (
                      <td key={hari} className="border-r border-b last:border-r-0 border-gray-100 dark:border-gray-700/80 px-2 py-2 text-center">
                        <span className="text-gray-200 dark:text-gray-700 text-xs">—</span>
                      </td>
                    )
                  }
                  const pal = getMapelPalette(item.mataPelajaran.nama)
                  return (
                    <td key={hari} className="border-r border-b last:border-r-0 border-gray-100 dark:border-gray-700/80 px-2 py-2">
                      <div className={`rounded-xl px-2.5 py-2 ${pal.bg}`}>
                        <div className="flex items-start gap-1.5">
                          <span className={`mt-0.5 shrink-0 h-2 w-2 rounded-full ${pal.dot}`} />
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold leading-tight truncate ${pal.title}`}>{item.mataPelajaran.nama}</p>
                            <p className={`text-[10px] mt-0.5 truncate ${pal.sub}`}>{item.guru.namaLengkap}</p>
                            {item.ruangan && (
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{item.ruangan.nama}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
