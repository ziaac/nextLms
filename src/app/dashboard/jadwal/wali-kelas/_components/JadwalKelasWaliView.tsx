'use client'

import { useMemo }          from 'react'
import { BookOpen, User, MapPin } from 'lucide-react'
import type { KelasWali, SesiWali } from '@/types/jadwal-wali.types'

const HARI_LIST = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'] as const
const HARI_LABEL: Record<string, string> = {
  SENIN: 'Senin', SELASA: 'Selasa', RABU: 'Rabu',
  KAMIS: 'Kamis', JUMAT: "Jum'at", SABTU: 'Sabtu',
}

interface Props {
  kelas:      KelasWali
  isLoading:  boolean
  hideStats?: boolean
}

/** Parse "07:00 - 07:45" → { mulai, selesai } */
function parseJam(jam: string) {
  const [mulai = '', selesai = ''] = jam.split(' - ').map((s) => s.trim())
  return { mulai, selesai }
}

/** Ubah "HH:MM" ke menit untuk sorting */
function toMinutes(hhmm: string) {
  const [h = 0, m = 0] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function JadwalKelasWaliView({ kelas, isLoading, hideStats = false }: Props) {
  // ── Hooks harus dipanggil sebelum early return ──
  // Kumpulkan semua slot jam unik dari semua hari, lalu sort by waktu mulai
  const sortedJams = useMemo(() => {
    const seen = new Set<string>()
    HARI_LIST.forEach((h) => {
      ;(kelas.jadwal[h] ?? []).forEach((s) => seen.add(s.jam))
    })
    return [...seen].sort((a, b) => toMinutes(parseJam(a).mulai) - toMinutes(parseJam(b).mulai))
  }, [kelas.jadwal])

  // Lookup: `${jam}-${hari}` → SesiWali
  const cellMap = useMemo(() => {
    const m = new Map<string, SesiWali>()
    HARI_LIST.forEach((h) => {
      ;(kelas.jadwal[h] ?? []).forEach((s) => m.set(`${s.jam}-${h}`, s))
    })
    return m
  }, [kelas.jadwal])

  const totalSesi = HARI_LIST.reduce((s, h) => s + (kelas.jadwal[h]?.length ?? 0), 0)

  // ── Early returns setelah semua hooks ──────────────────────────
  if (isLoading) return <Skeleton />

  if (sortedJams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <BookOpen className="h-10 w-10 text-gray-300" />
        <p className="text-sm text-gray-400">Belum ada jadwal untuk kelas ini</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Summary — bisa disembunyikan jika stats sudah ditampilkan di luar */}
      {!hideStats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Total Sesi</p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{totalSesi}
              <span className="text-sm font-medium text-gray-400 ml-1">sesi</span>
            </p>
            <p className="text-[10px] text-gray-400">per minggu</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Jam Mengajar</p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{sortedJams.length}
              <span className="text-sm font-medium text-gray-400 ml-1">jam</span>
            </p>
            <p className="text-[10px] text-gray-400">unik per minggu</p>
          </div>
        </div>
      )}

      {/* Matrix table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/60">
              {/* Kolom jam */}
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-r border-gray-200 dark:border-gray-700 w-24 whitespace-nowrap sticky left-0 bg-gray-50 dark:bg-gray-800/60 z-10">
                Waktu
              </th>
              {/* Kolom per hari — semua hari selalu tampil */}
              {HARI_LIST.map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-r last:border-r-0 border-gray-200 dark:border-gray-700 min-w-[130px]"
                >
                  {HARI_LABEL[h]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedJams.map((jam, rowIdx) => {
              const { mulai, selesai } = parseJam(jam)
              return (
                <tr
                  key={jam}
                  className={rowIdx % 2 === 0
                    ? 'bg-white dark:bg-gray-900'
                    : 'bg-gray-50/60 dark:bg-gray-800/20'}
                >
                  {/* Kolom waktu — sticky */}
                  <td className="px-3 py-3 border-b border-r border-gray-100 dark:border-gray-800 align-middle sticky left-0 bg-inherit z-10">
                    <p className="text-sm font-bold font-mono text-gray-700 dark:text-gray-200 leading-tight tabular-nums">
                      {mulai}
                    </p>
                    <p className="text-[11px] font-mono text-gray-400 leading-tight tabular-nums">
                      {selesai}
                    </p>
                  </td>

                  {/* Sel per hari */}
                  {HARI_LIST.map((h) => {
                    const sesi = cellMap.get(`${jam}-${h}`)
                    return (
                      <td
                        key={h}
                        className="px-2.5 py-2 border-b border-r last:border-r-0 border-gray-100 dark:border-gray-800 align-top"
                      >
                        {sesi ? (
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-snug line-clamp-2">
                              {sesi.mapel}
                            </p>
                            <div className="flex items-center gap-1">
                              <User className="h-2.5 w-2.5 text-gray-400 shrink-0" />
                              <span className="text-[10px] text-gray-500 truncate">{sesi.guru}</span>
                            </div>
                            {sesi.ruangan && sesi.ruangan !== '-' && sesi.ruangan !== 'Tanpa Ruang' && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-2.5 w-2.5 text-gray-400 shrink-0" />
                                <span className="text-[10px] text-gray-400 truncate">{sesi.ruangan}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-200 dark:text-gray-700 text-sm select-none">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((i) => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg" />)}
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="h-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900" />
        ))}
      </div>
    </div>
  )
}
