'use client'

import type { MatrixSiswaResponse } from '@/types'

interface Props {
  matrix: MatrixSiswaResponse
}

const STATUS_CLS: Record<string, string> = {
  H: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  I: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  S: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  A: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const STATUS_LABEL: Record<string, string> = {
  H: 'Hadir', I: 'Izin', S: 'Sakit', A: 'Alpa',
}

function fmtTgl(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

export function MatrixSiswaTable({ matrix }: Props) {
  const { maxPertemuan, mapel } = matrix

  if (mapel.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-10 italic">
        Tidak ada data absensi untuk semester ini.
      </p>
    )
  }

  const cols = Array.from({ length: Math.min(maxPertemuan, 30) }, (_, i) => i + 1)

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(STATUS_LABEL).map(([k, l]) => (
          <span key={k} className={'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ' + (STATUS_CLS[k] ?? '')}>
            {k} <span className="font-normal text-[10px] opacity-75">{l}</span>
          </span>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
        <table className="min-w-max w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700">
              {/* Sticky: Mata Pelajaran */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[140px] sticky left-0 bg-gray-50 dark:bg-gray-800/60 z-10">
                Mata Pelajaran
              </th>
              {/* Pertemuan headers */}
              {cols.map((n) => (
                <th key={n} className="px-1 py-3 text-center text-[10px] font-semibold text-gray-400 uppercase w-[52px]">
                  P{n}
                </th>
              ))}
              {/* Rekap */}
              <th className="px-2 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase w-12 border-l border-gray-200 dark:border-gray-700">
                Real.
              </th>
              {['H', 'I', 'S', 'A'].map((k) => (
                <th key={k} className={'px-2 py-3 text-center text-xs font-bold w-9 ' + (STATUS_CLS[k] ?? '')}>
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {mapel.map((row) => (
              <tr key={row.mataPelajaranId} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/20 transition-colors">
                {/* Mapel name — sticky */}
                <td className="px-3 py-2 sticky left-0 bg-white dark:bg-gray-900 z-10">
                  <p className="font-medium text-gray-800 dark:text-gray-200 text-xs leading-tight truncate max-w-[136px]">
                    {row.namaMapel}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Real. {row.realisasiPertemuan}/{row.targetPertemuan}
                  </p>
                </td>
                {/* Sel per pertemuan — aligned to maxPertemuan */}
                {cols.map((n) => {
                  const sesi = row.sesi[n - 1]
                  const isActive = !!sesi?.tanggal
                  const status = sesi?.status ?? null

                  if (!isActive) {
                    return (
                      <td key={n} className="px-1 py-1.5 text-center">
                        <span className="inline-block w-[44px] h-[48px] rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-dashed border-gray-100 dark:border-gray-700/50" />
                      </td>
                    )
                  }

                  return (
                    <td key={n} className="px-1 py-1.5 text-center">
                      <div className={[
                        'inline-flex flex-col items-center justify-center w-[44px] min-h-[48px] rounded-lg px-0.5 py-1 gap-0.5',
                        status ? (STATUS_CLS[status] ?? 'bg-gray-50 text-gray-400') : 'bg-gray-50 dark:bg-gray-800 text-gray-300',
                      ].join(' ')}>
                        <span className="text-[11px] font-bold leading-none">
                          {status ?? '—'}
                        </span>
                        {sesi?.waktuMasuk && (
                          <span className="text-[8px] leading-none opacity-75">
                            {sesi.waktuMasuk}
                          </span>
                        )}
                        {sesi?.tanggal && (
                          <span className="text-[8px] leading-none opacity-60">
                            {fmtTgl(sesi.tanggal)}
                          </span>
                        )}
                      </div>
                    </td>
                  )
                })}
                {/* Realisasi sesi */}
                <td className="px-2 py-2 text-center border-l border-gray-100 dark:border-gray-800">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {row.realisasiPertemuan}
                  </span>
                </td>
                {/* Summary */}
                {(['H', 'I', 'S', 'A'] as const).map((k) => (
                  <td key={k} className="px-2 py-2 text-center">
                    <span className={[
                      'text-xs font-semibold tabular-nums',
                      row.summary[k] > 0 ? (STATUS_CLS[k] ?? '') + ' px-1.5 py-0.5 rounded' : 'text-gray-300',
                    ].join(' ')}>
                      {row.summary[k]}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
