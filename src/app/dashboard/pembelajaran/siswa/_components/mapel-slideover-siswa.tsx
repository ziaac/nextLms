'use client'

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import { useQuery }            from '@tanstack/react-query'
import {
  BookOpen, ClipboardList, CalendarDays,
  Users, AlertCircle, Clock, CheckCircle2, X,
} from 'lucide-react'
import { SlideOver, Button, Badge, Skeleton } from '@/components/ui'
import { reportApi }              from '@/lib/api/report.api'
import { formatTanggalLengkap, formatHariJam, formatJam } from '@/lib/helpers/timezone'
import type { MapelSiswaItem }    from '@/types/akademik.types'

interface Props {
  mapel:         MapelSiswaItem | null
  onClose:       () => void
  kelasId:       string
  tahunAjaranId: string
  siswaId?:      string
}

function StatusAbsenBadge({ status }: { status: string }) {
  if (status === 'AKSI_DIBUTUHKAN') return <Badge variant="danger">Perlu Absen</Badge>
  return <Badge variant="warning">Menunggu Guru</Badge>
}

export function MapelSlideoverSiswa({
  mapel, onClose, kelasId, tahunAjaranId, siswaId,
}: Props) {
  const router = useRouter()

  // ── Dismiss todo (visual-only, reset saat mapel berganti) ────
  const [dismissedTodo, setDismissedTodo] = useState<Set<string>>(new Set())
  const dismissTodo = (key: string) =>
    setDismissedTodo((prev) => new Set([...prev, key]))

  useEffect(() => {
    setDismissedTodo(new Set())
  }, [mapel?.id])

  // ── Todo per mapel ────────────────────────────────────────────
  const { data: todo, isLoading: loadingTodo } = useQuery({
    queryKey: ['siswa-todo', mapel?.id, tahunAjaranId, siswaId],
    queryFn:  () => reportApi.getSiswaTodo({
      tahunAjaranId,
      mataPelajaranId: mapel!.id,
      siswaId,
    }),
    enabled:   !!mapel?.id && !!tahunAjaranId,
    staleTime: 1000 * 60 * 2,
  })

  const tugasPending    = todo?.tugasPending ?? []
  const absensiPending  = todo?.absensiPending ?? []
  const absensiPerluAksi = absensiPending.filter((a) => a.status === 'AKSI_DIBUTUHKAN')

  const totalTodo =
    tugasPending.filter((t) => !dismissedTodo.has('tugas-' + t.id)).length +
    absensiPerluAksi.filter((a) => !dismissedTodo.has('absen-' + a.jadwalId)).length

  if (!mapel) return null

  function nav(path: string) { router.push(path); onClose() }

  // ── Stat helpers ──────────────────────────────────────────────
  const pctHadir    = mapel.stats.absensiPercentage
  const tugasTotal   = mapel.stats.tugasTotal
  const tugasSelesai = mapel.stats.tugasSelesai
  const pctTugas     = tugasTotal > 0 ? Math.round((tugasSelesai / tugasTotal) * 100) : null
  const totalMateri  = mapel.stats.totalMateri
  const materiDibaca = mapel.stats.materiDibaca
  const pctMateri    = totalMateri > 0 ? Math.round((materiDibaca / totalMateri) * 100) : null

  return (
    <SlideOver open={!!mapel} onClose={onClose} title={mapel.namaMapel} width="lg">
      <div className="space-y-6">

        {/* Badge info */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">{mapel.kategori}</Badge>
          <Badge variant="default">{mapel.kodeMapel}</Badge>
          <Badge variant="default">KKM {mapel.kkm}</Badge>
        </div>

        {/* Jadwal */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Jadwal</p>
          {mapel.jadwal && mapel.jadwal.length > 0 ? (
            mapel.jadwal.map((j, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                <span>{formatHariJam(j.hari, j.jamMulai)}</span>
                <span className="text-gray-400 dark:text-gray-500">–</span>
                <span>{formatJam(j.jamSelesai)}</span>
                {j.ruangan && (
                  <span className="text-gray-400 dark:text-gray-500">· {j.ruangan}</span>
                )}
              </div>
            ))
          ) : (
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
              <span className="text-amber-500 dark:text-amber-400 italic">Jadwal belum ditentukan</span>
            </div>
          )}
        </div>

        {/* Pengajar */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Pengajar</p>
          {mapel.timPengajar.map((p) => (
            <div
              key={p.id}
              className={[
                'flex items-center gap-2 rounded-lg border px-3 py-2',
                p.isKoordinator
                  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-200 dark:border-gray-700',
              ].join(' ')}
            >
              <div className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                p.isKoordinator ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
              ].join(' ')}>
                {p.nama.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{p.nama}</p>
                {p.isKoordinator && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Koordinator</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Statistik — tiles bergaya guru */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Statistik</p>
          <div className="grid grid-cols-3 gap-2">

            {/* Kehadiran */}
            <div className={[
              'rounded-xl border px-3 py-2.5',
              pctHadir >= 75
                ? 'border-emerald-100 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/20'
                : 'border-amber-100 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/20',
            ].join(' ')}>
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Kehadiran</p>
              <p className={[
                'text-xl font-bold',
                pctHadir >= 75 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
              ].join(' ')}>
                {pctHadir}%
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                {pctHadir >= 75 ? 'Kehadiran baik' : 'Perlu ditingkatkan'}
              </p>
            </div>

            {/* Tugas */}
            <div className={[
              'rounded-xl border px-3 py-2.5',
              tugasTotal === 0
                ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                : pctTugas! >= 70
                  ? 'border-emerald-100 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/20'
                  : 'border-amber-100 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/20',
            ].join(' ')}>
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tugas</p>
              <p className={[
                'text-xl font-bold',
                tugasTotal === 0
                  ? 'text-gray-800 dark:text-gray-200'
                  : pctTugas! >= 70 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
              ].join(' ')}>
                {tugasSelesai}/{tugasTotal}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                {tugasTotal > 0 ? `${pctTugas}% terkumpul` : 'belum ada tugas'}
              </p>
            </div>

            {/* Materi */}
            <div className={[
              'rounded-xl border px-3 py-2.5',
              totalMateri === 0
                ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                : pctMateri! >= 50
                  ? 'border-blue-100 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20'
                  : 'border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800',
            ].join(' ')}>
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Materi</p>
              <p className={[
                'text-xl font-bold',
                totalMateri === 0
                  ? 'text-gray-800 dark:text-gray-200'
                  : pctMateri! >= 50 ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300',
              ].join(' ')}>
                {materiDibaca}/{totalMateri}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                {totalMateri > 0 ? `${pctMateri}% terbaca` : 'belum ada materi'}
              </p>
            </div>

          </div>
        </div>

        {/* To Do */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">To Do</p>
            {totalTodo > 0 && <Badge variant="danger">{totalTodo} perlu aksi</Badge>}
          </div>

          {loadingTodo && (
            <div className="space-y-2">
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
            </div>
          )}

          {!loadingTodo && totalTodo === 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400">Semua tugas dan absensi sudah lengkap</p>
            </div>
          )}

          {/* Tugas Pending */}
          {!loadingTodo && tugasPending.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tugas Belum Dikumpulkan</p>
              {tugasPending
                .filter((t) => !dismissedTodo.has('tugas-' + t.id))
                .map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5 space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">{t.judul}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="warning">{t.tipe}</Badge>
                        <button
                          type="button"
                          onClick={() => dismissTodo('tugas-' + t.id)}
                          className="w-4 h-4 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                          title="Dismiss"
                        >
                          <X className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>Deadline: {formatTanggalLengkap(t.deadline)}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Absensi Pending */}
          {!loadingTodo && absensiPending.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Absensi</p>
              {absensiPending
                .filter((a) => !dismissedTodo.has('absen-' + a.jadwalId))
                .map((a) => (
                  <div
                    key={a.jadwalId}
                    className={[
                      'rounded-xl border px-3 py-2.5 space-y-1',
                      a.status === 'AKSI_DIBUTUHKAN'
                        ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                        <Clock className="w-3 h-3" />
                        <span>{formatJam(a.jamMulai)} – {formatJam(a.jamSelesai)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StatusAbsenBadge status={a.status} />
                        <button
                          type="button"
                          onClick={() => dismissTodo('absen-' + a.jadwalId)}
                          className="w-4 h-4 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                          title="Dismiss"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {a.status === 'MENUNGGU_GURU' && (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        Guru belum membuka sesi — tombol absen belum aktif
                      </p>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Navigasi */}
        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Navigasi</p>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="secondary"
              leftIcon={<CalendarDays className="w-3.5 h-3.5" />}
              onClick={() => nav(`/dashboard/absensi?mataPelajaranId=${mapel.id}`)}>
              Absensi
            </Button>
            <Button size="sm" variant="secondary"
              leftIcon={<BookOpen className="w-3.5 h-3.5" />}
              onClick={() => nav(`/dashboard/materi-pelajaran?mataPelajaranId=${mapel.id}`)}>
              Materi
            </Button>
            <Button size="sm" variant="secondary"
              leftIcon={<ClipboardList className="w-3.5 h-3.5" />}
              onClick={() => nav(`/dashboard/tugas?mataPelajaranId=${mapel.id}`)}>
              Tugas
            </Button>
            <Button size="sm" variant="secondary"
              leftIcon={<Users className="w-3.5 h-3.5" />}
              onClick={() => nav(`/dashboard/kelas/${kelasId}`)}>
              Teman Kelas
            </Button>
          </div>
        </div>

      </div>
    </SlideOver>
  )
}
