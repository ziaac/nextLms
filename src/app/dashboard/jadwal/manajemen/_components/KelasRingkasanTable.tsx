'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { BookOpen, Clock, RefreshCw, CalendarDays, Info } from 'lucide-react'
import type { RingkasanKelasItem } from '@/types/jadwal.types'
import { RosterSlideOver } from './RosterSlideOver'

interface Props {
  data:       RingkasanKelasItem[]
  isLoading:  boolean
  semesterId: string
  onRefresh:  () => void
}

interface RosterTarget { kelasId: string; namaKelas: string }

export function KelasRingkasanTable({ data, isLoading, semesterId, onRefresh }: Props) {
  const router = useRouter()
  const [rosterTarget, setRosterTarget] = useState<RosterTarget | null>(null)
  const [noMapelKelas, setNoMapelKelas] = useState<string | null>(null)

  if (isLoading) return <TableSkeleton />

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
        <CalendarDays className="h-12 w-12 opacity-30" />
        <p className="text-sm">Belum ada data kelas untuk semester ini.</p>
        <Button variant="secondary" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Refresh
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
        {/* Hint bar */}
        <div className="flex items-center gap-2 px-5 py-2 bg-emerald-50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-800/30">
          <Info className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Klik baris untuk melihat jadwal mingguan · Badge mapel dapat diklik untuk setup mapel
          </p>
        </div>

        {/* Header */}
        <div className="grid grid-cols-[1fr_110px_260px] gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          <span>Kelas</span>
          <span className="text-center">Total JP</span>
          <span className="text-right">Aksi</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.map((kelas) => {
            const rincian   = kelas.rincianMapel ?? []
            const hasMapel  = (kelas.jumlahMapel ?? rincian.length) > 0
            const hasJadwal = kelas.totalJam > 0
            const canClick  = hasJadwal

            return (
              <div
                key={kelas.kelasId}
                onClick={() => canClick && setRosterTarget({ kelasId: kelas.kelasId, namaKelas: kelas.namaKelas })}
                className={[
                  'grid grid-cols-[1fr_110px_260px] gap-4 px-5 py-3.5 items-center transition-colors group',
                  canClick
                    ? 'cursor-pointer hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10'
                    : 'cursor-default opacity-75',
                ].join(' ')}
              >
                {/* Nama Kelas */}
                <div className="flex items-center gap-2 min-w-0">
                  <CalendarDays className={[
                    'h-3.5 w-3.5 shrink-0 transition-opacity',
                    canClick
                      ? 'text-emerald-500 dark:text-emerald-400 opacity-0 group-hover:opacity-100'
                      : 'text-gray-300 dark:text-gray-600 opacity-40',
                  ].join(' ')} />
                  <span className={[
                    'font-semibold text-sm truncate',
                    canClick
                      ? 'text-emerald-700 dark:text-emerald-400 group-hover:underline underline-offset-2'
                      : 'text-gray-500 dark:text-gray-400',
                  ].join(' ')}>
                    {kelas.namaKelas}
                  </span>
                </div>

                {/* Total JP */}
                <div className="flex items-center justify-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {kelas.totalJam}
                  </span>
                  <span className="text-xs text-gray-400">JP</span>
                </div>

                {/* Aksi */}
                <div
                  className="flex items-center justify-end gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Badge Mapel — klikable */}
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        '/dashboard/pembelajaran/manajemen?kelasId=' + kelas.kelasId +
                        '&semesterId=' + semesterId,
                      )
                    }
                    className={[
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all',
                      'hover:opacity-80 hover:shadow-sm active:scale-95',
                      hasJadwal
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                        : hasMapel
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
                        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
                    ].join(' ')}
                  >
                    <BookOpen className="h-3 w-3" />
                    {kelas.jumlahMapel ?? rincian.length} mapel
                  </button>

                  {/* Tombol Jadwal */}
                  {!hasMapel ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setNoMapelKelas(kelas.namaKelas)}
                    >
                      Lengkapi Mapel
                    </Button>
                  ) : hasJadwal ? (
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() =>
                        router.push(
                          '/dashboard/jadwal/manajemen/buat-jadwal?kelasId=' +
                          kelas.kelasId + '&semesterId=' + semesterId,
                        )
                      }
                    >
                      Revisi Jadwal
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        router.push(
                          '/dashboard/jadwal/manajemen/buat-jadwal?kelasId=' +
                          kelas.kelasId + '&semesterId=' + semesterId,
                        )
                      }
                    >
                      Susun Jadwal
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <RosterSlideOver
        open={!!rosterTarget}
        onClose={() => setRosterTarget(null)}
        kelasId={rosterTarget?.kelasId ?? ''}
        semesterId={semesterId}
        namaKelas={rosterTarget?.namaKelas ?? ''}
      />

      {noMapelKelas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setNoMapelKelas(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Mapel Belum Disetup</h3>
                <p className="text-xs text-gray-500 mt-0.5">{noMapelKelas}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              Kelas ini belum memiliki mata pelajaran. Setup mata pelajaran terlebih dahulu sebelum mengatur jadwal.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setNoMapelKelas(null)}>
                Tutup
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setNoMapelKelas(null)
                  const kelas = data.find((k) => k.namaKelas === noMapelKelas)
                  if (kelas) router.push(
                    '/dashboard/pembelajaran/manajemen?kelasId=' + kelas.kelasId +
                    '&semesterId=' + semesterId,
                  )
                }}
              >
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />Setup Mapel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
      <div className="h-8 bg-emerald-50 dark:bg-emerald-900/10 border-b border-emerald-100" />
      <div className="h-10 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="w-20 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="w-44 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg" />
        </div>
      ))}
    </div>
  )
}