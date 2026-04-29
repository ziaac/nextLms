'use client'

import { useState, useMemo }        from 'react'
import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'
import { SlideOver }                from '@/components/ui/SlideOver'
import { Spinner }                  from '@/components/ui/Spinner'
import { Select }                   from '@/components/ui'
import { useTahunAjaranList }       from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { useMyRiwayatAbsensi }      from '@/hooks/absensi/useRekapSiswa'
import { TIMEZONE } from '@/lib/constants'
import type { AbsensiHistoryItem }  from '@/types'

interface Props {
  open:    boolean
  onClose: () => void
}

const STATUS_CLS: Record<string, string> = {
  HADIR:     'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20',
  TERLAMBAT: 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20',
  SAKIT:     'text-blue-700 bg-blue-50 dark:bg-blue-900/20',
  IZIN:      'text-purple-700 bg-purple-50 dark:bg-purple-900/20',
  ALPA:      'text-red-700 bg-red-50 dark:bg-red-900/20',
}

const STAT_KEYS = [
  { key: 'HADIR',     label: 'Hadir',     color: 'text-emerald-600' },
  { key: 'TERLAMBAT', label: 'Terlambat', color: 'text-yellow-600'  },
  { key: 'SAKIT',     label: 'Sakit',     color: 'text-blue-600'    },
  { key: 'IZIN',      label: 'Izin',      color: 'text-purple-600'  },
  { key: 'ALPA',      label: 'Alpa',      color: 'text-red-600'     },
]

const LIMIT = 15

export function AbsensiArsipSiswaSlideover({ open, onClose }: Props) {
  const [taId,       setTaId]       = useState('')
  const [semesterId, setSemesterId] = useState('')
  const [page,       setPage]       = useState(1)

  const { data: taListRaw } = useTahunAjaranList()
  const taList = (taListRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? []

  // Hanya TA yang sudah tidak aktif
  const taOptions = useMemo(() =>
    taList
      .filter((t) => !t.isActive)
      .map((t)   => ({ label: t.nama, value: t.id })),
    [taList],
  )

  const { data: semListRaw } = useSemesterByTahunAjaran(taId || null)
  const semList = (semListRaw as { id: string; nama: string }[] | undefined) ?? []
  const semOptions = semList.map((s) => ({ label: s.nama, value: s.id }))

  const { data: riwayat, isLoading } = useMyRiwayatAbsensi({
    semesterId: semesterId || undefined,
    page,
    limit: LIMIT,
  })

  const items    = riwayat?.data ?? []
  const meta     = riwayat?.meta
  const lastPage = meta?.lastPage ?? 1
  const summary  = meta?.summary

  const handleTaChange = (v: string) => { setTaId(v); setSemesterId(''); setPage(1) }
  const handleSemChange = (v: string) => { setSemesterId(v); setPage(1) }

  const fmtTgl = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      timeZone: TIMEZONE,
    })

  const handleClose = () => {
    setTaId(''); setSemesterId(''); setPage(1)
    onClose()
  }

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title="Arsip Kehadiran"
      description="Riwayat absensi dari semester yang telah selesai"
      width="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Pilih tahun ajaran dan semester lampau untuk melihat riwayat kehadiran Anda.
        </p>

        {/* Filter TA + Semester */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">Tahun Ajaran</label>
            <Select
              options={[
                { label: taOptions.length === 0 ? 'Tidak ada arsip' : 'Pilih TA...', value: '' },
                ...taOptions,
              ]}
              value={taId}
              onChange={(e) => handleTaChange(e.target.value)}
              disabled={taOptions.length === 0}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">Semester</label>
            <Select
              options={[
                {
                  label: !taId
                    ? 'Pilih TA dulu...'
                    : semOptions.length === 0 ? 'Tidak ada semester' : 'Pilih Semester...',
                  value: '',
                },
                ...semOptions,
              ]}
              value={semesterId}
              onChange={(e) => handleSemChange(e.target.value)}
              disabled={!taId || semOptions.length === 0}
            />
          </div>
        </div>

        {/* Prompt awal */}
        {!semesterId && (
          <div className="flex flex-col items-center justify-center py-14 text-gray-300">
            <BarChart3 size={36} className="opacity-30 mb-2" />
            <p className="text-sm text-gray-400 font-medium">Pilih tahun ajaran dan semester</p>
            <p className="text-xs text-gray-400 opacity-60 mt-1 text-center">
              untuk menelusuri riwayat kehadiran semester lampau.
            </p>
          </div>
        )}

        {/* Content setelah semester dipilih */}
        {semesterId && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-10"><Spinner /></div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-5 gap-2">
                  {STAT_KEYS.map(({ key, label, color }) => (
                    <div
                      key={key}
                      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-2.5 text-center"
                    >
                      <p className={'text-xl font-bold tabular-nums ' + color}>
                        {summary ? (summary as unknown as Record<string, number>)[key] ?? 0 : 0}
                      </p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Riwayat list */}
                {items.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8 italic">
                    Tidak ada riwayat kehadiran pada semester ini.
                  </p>
                ) : (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                    {items.map((item: AbsensiHistoryItem) => (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {item.jadwalPelajaran?.mataPelajaran?.nama ?? 'Mata Pelajaran'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                            <span>{fmtTgl(item.tanggal)}</span>
                            {item.jadwalPelajaran?.masterJam && (
                              <span>
                                {item.jadwalPelajaran.masterJam.jamMulai}
                                {' – '}
                                {item.jadwalPelajaran.masterJam.jamSelesai}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={
                          'text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ' +
                          (STATUS_CLS[item.status] ?? 'text-gray-600 bg-gray-100')
                        }>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {lastPage > 1 && (
                  <div className="flex items-center justify-between px-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-200 hover:text-emerald-600 transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-xs text-gray-500 tabular-nums">
                      Halaman {page} / {lastPage}
                    </span>
                    <button
                      type="button"
                      disabled={page >= lastPage}
                      onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-200 hover:text-emerald-600 transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </SlideOver>
  )
}
