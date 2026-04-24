'use client'

import { Pencil } from 'lucide-react'
import type { MatrixResponse } from '@/types'

interface OverrideTarget {
  absensiId:         string | null   // null = record belum ada, pakai manual
  userId:            string
  namaSiswa:         string
  tanggal:           string
  jadwalPelajaranId: string
}

interface Props {
  matrix:     MatrixResponse
  onOverride: (target: OverrideTarget) => void
}

const STATUS_CLS: Record<string, string> = {
  H:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  S:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  I:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  A:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  TAP: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  T:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
}

export function MatrixTable({ matrix, onOverride }: Props) {
  const { metadata, listPertemuan, dataSiswa } = matrix
  const target            = metadata.targetPertemuan ?? listPertemuan.length
  const jadwalPelajaranId = metadata.jadwalPelajaranId ?? ''

  const fmtTgl = (iso: string) => {
    const [, m, d] = iso.split('-')
    return `${d}/${m}`
  }

  return (
    <div className="space-y-3">

      {/* Meta info */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {metadata.namaMapel}
        </span>
        <span className="text-xs text-gray-500">
          Realisasi: <strong>{metadata.realisasiPertemuan}</strong>
          {metadata.targetPertemuan ? ` / ${metadata.targetPertemuan}` : ''}
        </span>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {[
            { k: 'H', l: 'Hadir'  },
            { k: 'S', l: 'Sakit'  },
            { k: 'I', l: 'Izin'   },
            { k: 'A', l: 'Alpa'   },
            { k: 'T', l: 'Lambat' },
          ].map(({ k, l }) => (
            <span key={k} className={'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ' + (STATUS_CLS[k] ?? '')}>
              {k} <span className="font-normal text-[10px] opacity-75">{l}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-max w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8 sticky left-0 bg-gray-50 dark:bg-gray-800/60">
                No
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[160px] sticky left-8 bg-gray-50 dark:bg-gray-800/60">
                Nama
              </th>
              {Array.from({ length: target }, (_, i) => {
                const tgl    = listPertemuan[i]
                const isNull = tgl === null || tgl === undefined
                return (
                  <th
                    key={i}
                    className={[
                      'px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide w-14',
                      isNull ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500',
                    ].join(' ')}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{i + 1}</span>
                      {tgl && (
                        <span className="font-normal normal-case text-[9px] text-gray-400">
                          {fmtTgl(tgl)}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
              <th className="px-2 py-3 text-center text-xs font-bold w-12 text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700">
                Real.
              </th>
              {['H', 'S', 'I', 'A'].map((k) => (
                <th key={k} className={'px-2 py-3 text-center text-xs font-bold w-10 ' + (STATUS_CLS[k] ?? 'text-gray-500')}>
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {dataSiswa.map((siswa) => (
              <tr
                key={siswa.userId || siswa.nisn}
                className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors"
              >
                {/* No */}
                <td className="px-3 py-2.5 text-xs text-gray-400 text-right tabular-nums sticky left-0 bg-white dark:bg-gray-900">
                  {siswa.nomorAbsen}
                </td>
                {/* Nama */}
                <td className="px-3 py-2.5 sticky left-8 bg-white dark:bg-gray-900">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[160px]">
                    {siswa.nama}
                  </p>
                </td>
                {/* Sel absensi per pertemuan */}
                {Array.from({ length: target }, (_, i) => {
                  const tgl        = listPertemuan[i]
                  const kehadiran  = siswa.kehadiran[i]
                  const isActive   = tgl !== null && tgl !== undefined
                  const status     = kehadiran?.status
                  const absensiId  = kehadiran?.id ?? null
                  const hasStatus  = !!status && status !== '-'

                  return (
                    <td key={i} className="px-1 py-2 text-center">
                      {!isActive ? (
                        // Belum terealisasi
                        <span className="inline-block w-8 h-6 rounded bg-gray-50 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-700" />
                      ) : (
                        // Sel aktif — ada atau tidak ada data
                        <div className="relative inline-flex group">
                          {hasStatus ? (
                            <span className={[
                              'inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold',
                              STATUS_CLS[status] ?? 'bg-gray-100 text-gray-600',
                            ].join(' ')}>
                              {status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 text-xs">
                              -
                            </span>
                          )}
                          {/* Edit overlay — selalu bisa diklik jika kolom aktif */}
                          <button
                            onClick={() => onOverride({
                              absensiId,
                              userId:            siswa.userId,
                              namaSiswa:         siswa.nama,
                              tanggal:           tgl ?? '',
                              jadwalPelajaranId,
                            })}
                            className="absolute inset-0 flex items-center justify-center rounded bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                            title={absensiId ? 'Koreksi absensi' : 'Input absensi'}
                          >
                            <Pencil size={10} className="text-white" />
                          </button>
                        </div>
                      )}
                    </td>
                  )
                })}
                {/* Realisasi Sesi */}
                <td className="px-2 py-2 text-center text-xs font-semibold tabular-nums border-l border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">
                    {metadata.realisasiPertemuan ?? 0}
                  </span>
                </td>
                {/* Summary H/S/I/A */}
                {(['H', 'S', 'I', 'A'] as const).map((k) => (
                  <td key={k} className="px-2 py-2 text-center text-xs font-semibold tabular-nums">
                    <span className={siswa.summary[k] > 0
                      ? (STATUS_CLS[k] ?? '') + ' px-1.5 py-0.5 rounded'
                      : 'text-gray-300'
                    }>
                      {siswa.summary[k]}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
            {dataSiswa.length === 0 && (
              <tr>
                <td colSpan={target + 7} className="text-center py-10 text-sm text-gray-400 italic">
                  Tidak ada data siswa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
