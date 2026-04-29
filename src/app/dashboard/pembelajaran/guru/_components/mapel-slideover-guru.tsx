'use client'

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import { useQuery }            from '@tanstack/react-query'
import {
  BookOpen, ClipboardList, BarChart2, CalendarDays,
  Users, AlertCircle, CheckCircle2, Clock,
  CalendarCheck, X,
} from 'lucide-react'
import { SlideOver, Button, Badge, Skeleton } from '@/components/ui'
import { formatJam }  from '@/lib/helpers/timezone'
import { reportApi }  from '@/lib/api/report.api'
import api            from '@/lib/axios'
import type { MataPelajaran, StatusSesiGuru, MapelOverviewItem } from '@/types/akademik.types'

interface Props {
  mapel:         MataPelajaran | null
  onClose:       () => void
  tahunAjaranId: string
  semesterId:    string
}

const STATUS_COLOR: Record<StatusSesiGuru, string> = {
  AKSI_DIBUTUHKAN:    'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  BELUM_WAKTUNYA:     'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
  KELAS_SUDAH_DIBUKA: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  TERLEWAT:           'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
}

const STATUS_LABEL: Record<StatusSesiGuru, string> = {
  AKSI_DIBUTUHKAN:    'Perlu Buka Absen',
  BELUM_WAKTUNYA:     'Belum Waktunya',
  KELAS_SUDAH_DIBUKA: 'Sudah Dibuka',
  TERLEWAT:           'Terlewat',
}

export function MapelSlideoverGuru({
  mapel, onClose, tahunAjaranId, semesterId,
}: Props) {
  const router = useRouter()
  const [dismissedTodo, setDismissedTodo] = useState<Set<string>>(new Set())

  const dismissTodo = (key: string) =>
    setDismissedTodo((prev) => new Set([...prev, key]))

  // Reset dismissed saat mapel berganti
  useEffect(() => {
    setDismissedTodo(new Set())
  }, [mapel?.id])

  // Stat guru saya per mapel
  const { data: stat, isLoading: loadingStat } = useQuery({
    queryKey: ['report-guru-saya', mapel?.id, semesterId],
    queryFn:  () => reportApi.getGuruSaya({ tahunAjaranId, semesterId, mataPelajaranId: mapel!.id }),
    enabled:  !!mapel?.id && !!tahunAjaranId && !!semesterId,
    staleTime: 1000 * 60 * 5,
  })

  // Todo guru per mapel
  const { data: todo, isLoading: loadingTodo } = useQuery({
    queryKey: ['guru-todo', mapel?.id],
    queryFn:  () => reportApi.getGuruTodo({ mataPelajaranId: mapel!.id }),
    enabled:  !!mapel?.id,
    staleTime: 1000 * 60 * 2,
  })

  // Rasio membaca materi (dari siswaMateriProgress)
  const { data: readStats } = useQuery({
    queryKey: ['materi-read-stats', mapel?.id],
    queryFn:  () => api.get<{ totalMateri: number; totalSiswa: number; uniquePembaca: number; rasio: number }>(
      '/materi-pelajaran/read-stats',
      { params: { mataPelajaranId: mapel!.id } },
    ).then((r) => r.data),
    enabled:  !!mapel?.id,
    staleTime: 1000 * 60 * 5,
  })

  // Mapel overview — untuk % kehadiran & % tugas selesai
  const { data: overviewList = [] } = useQuery({
    queryKey: ['mapel-overview-slideover', mapel?.kelasId, tahunAjaranId, semesterId],
    queryFn:  () => (api.get<MapelOverviewItem[]>('/report/mapel/overview', {
      params: { tahunAjaranId, kelasId: mapel!.kelasId, semesterId: semesterId || undefined },
    })).then((r) => r.data ?? []),
    enabled:  !!mapel?.id && !!tahunAjaranId,
    staleTime: 1000 * 60 * 5,
  })

  // Info siswa kelas
  const { data: kelasData } = useQuery({
    queryKey: ['kelas-detail-guru', mapel?.kelasId],
    queryFn:  async () => {
      const res = await api.get(`/kelas/${mapel!.kelasId}/statistik`)
      return res.data as { jumlahSiswa: number; siswaLaki: number; siswaPerempuan: number; kuotaMaksimal: number }
    },
    enabled:  !!mapel?.kelasId,
    staleTime: 1000 * 60 * 10,
  })

  if (!mapel) return null

  const namaMapel   = mapel.mataPelajaranTingkat.masterMapel.nama
  const koordinator = mapel.pengajar.find((p) => p.isKoordinator)
  const coTeacher   = mapel.pengajar.filter((p) => !p.isKoordinator)

  const jadwalText = mapel.jadwalPelajaran && mapel.jadwalPelajaran.length > 0
    ? mapel.jadwalPelajaran
        .map((j) => {
          const hari = j.hari.charAt(0) + j.hari.slice(1, 3).toLowerCase()
          const jam  = j.masterJam?.jamMulai ? formatJam(j.masterJam.jamMulai) : ''
          return jam ? `${hari} ${jam}` : hari
        })
        .join(' · ')
    : null

  const totalPending     = todo?.menungguPenilaian.filter(
    (t) => !dismissedTodo.has('tugas-' + t.id)
  ).length ?? 0
  const jadwalPerluAksi  = todo?.jadwalHariIni.filter(
    (j) => j.statusSesi === 'AKSI_DIBUTUHKAN' || j.statusSesi === 'TERLEWAT'
  ) ?? []
  const totalTodo        = totalPending + jadwalPerluAksi.length

  const totalTugas  = stat?.tugas.length ?? 0
  const totalSubmit = stat?.tugas.reduce((a, t) => a + t.sudahSubmit, 0) ?? 0
  const totalSiswa  = stat?.tugas.reduce((a, t) => a + t.totalSiswa, 0) ?? 0
  const pctSubmit   = totalSiswa > 0 ? Math.round((totalSubmit / totalSiswa) * 100) : 0

  // Overview: % kehadiran dari mapel/overview
  const perfItem = overviewList.find((o) => o.mataPelajaranId === mapel.id)
  const pctHadir = perfItem?.performaGlobal.rataRataKehadiranSiswa ?? null

  function nav(path: string) {
    router.push(path)
    onClose()
  }

  return (
    <SlideOver open={!!mapel} onClose={onClose} title={namaMapel} width="md">
      <div className="space-y-6">

        {/* Badge */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">{mapel.mataPelajaranTingkat.masterMapel.kategori}</Badge>
          <Badge variant="default">{mapel.mataPelajaranTingkat.masterMapel.kode}</Badge>
          <Badge variant="default">KKM {mapel.kkm}</Badge>
          <Badge variant="default">{mapel.kelas.namaKelas}</Badge>
        </div>

        {/* Jadwal */}
        <div className="flex items-center gap-1.5 text-xs">
          <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
          {jadwalText ? (
            <span className="text-gray-600 dark:text-gray-300">{jadwalText}</span>
          ) : (
            <span className="text-amber-500 dark:text-amber-400 italic">Jadwal belum ditentukan</span>
          )}
        </div>

        {/* Pengajar */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tim Pengajar</p>
          {koordinator && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                {koordinator.guru.profile.namaLengkap.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{koordinator.guru.profile.namaLengkap}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Koordinator</p>
              </div>
            </div>
          )}
          {coTeacher.map((p) => (
            <div key={p.guru.id} className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">
                {p.guru.profile.namaLengkap.charAt(0)}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{p.guru.profile.namaLengkap}</p>
            </div>
          ))}
        </div>

        {/* ── Stats 2x2: Siswa | Absensi | Materi | Tugas ── */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ringkasan Kelas</p>
          {loadingStat ? (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {/* Siswa — L/P breakdown */}
              <div className="rounded-xl border border-blue-100 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20 px-3 py-2.5">
                <p className="text-[10px] font-medium text-blue-500 dark:text-blue-400 uppercase tracking-wide">Siswa</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                  {kelasData?.jumlahSiswa ?? '–'}
                </p>
                <p className="text-[10px] text-blue-400 dark:text-blue-500 mt-0.5">
                  {kelasData
                    ? `L ${kelasData.siswaLaki} · P ${kelasData.siswaPerempuan}`
                    : 'Memuat...'}
                </p>
              </div>

              {/* Kehadiran — big: N sesi, small: % kehadiran */}
              <div className={[
                'rounded-xl border px-3 py-2.5',
                pctHadir !== null
                  ? pctHadir >= 80 ? 'border-emerald-100 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/20' : 'border-amber-100 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/20'
                  : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800',
              ].join(' ')}>
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sesi Absensi</p>
                <p className={[
                  'text-xl font-bold',
                  pctHadir !== null
                    ? pctHadir >= 80 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-800 dark:text-gray-200',
                ].join(' ')}>
                  {stat?.totalSesiAbsensi ?? '–'}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {pctHadir !== null ? `${pctHadir}% kehadiran` : 'sesi dilaksanakan'}
                </p>
              </div>

              {/* Materi — big: jumlah materi, small: % terbaca */}
              <div className={[
                'rounded-xl border px-3 py-2.5',
                readStats && readStats.rasio >= 50
                  ? 'border-blue-100 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20'
                  : 'border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800',
              ].join(' ')}>
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Materi</p>
                <p className={[
                  'text-xl font-bold',
                  readStats && readStats.rasio >= 50 ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200',
                ].join(' ')}>
                  {mapel._count.materiPelajaran}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {readStats
                    ? `${readStats.rasio}% terbaca · ${readStats.uniquePembaca}/${readStats.totalSiswa} siswa`
                    : 'materi dibuat'}
                </p>
              </div>

              {/* Tugas — big: jumlah tugas, small: % terkumpul */}
              <div className={[
                'rounded-xl border px-3 py-2.5',
                totalTugas > 0
                  ? pctSubmit >= 70 ? 'border-emerald-100 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/20' : 'border-amber-100 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/20'
                  : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800',
              ].join(' ')}>
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tugas</p>
                <p className={[
                  'text-xl font-bold',
                  totalTugas > 0
                    ? pctSubmit >= 70 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-800 dark:text-gray-200',
                ].join(' ')}>
                  {mapel._count.tugas}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {totalTugas > 0
                    ? `${pctSubmit}% terkumpul · ${totalSubmit}/${kelasData?.jumlahSiswa ?? totalSiswa} siswa`
                    : 'tugas dibuat'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* To Do */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">To Do</p>
            {totalTodo > 0 && <Badge variant="warning">{totalTodo} item</Badge>}
          </div>

          {loadingTodo && <Skeleton className="h-14 rounded-lg" />}

          {!loadingTodo && totalTodo === 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-400">Tidak ada to do saat ini</p>
            </div>
          )}

          {!loadingTodo && todo?.jadwalHariIni
            .filter((j) =>
              !dismissedTodo.has('sesi-' + j.jadwalId) &&
              (j.statusSesi === 'AKSI_DIBUTUHKAN' || j.statusSesi === 'TERLEWAT')
            )
            .map((j) => (
              <div
                key={j.jadwalId}
                role="button"
                tabIndex={0}
                onClick={() => nav(`/dashboard/absensi/guru?mataPelajaranId=${mapel.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && nav(`/dashboard/absensi/guru?mataPelajaranId=${mapel.id}`)}
                className={'w-full rounded-xl border px-3 py-2.5 space-y-1 cursor-pointer hover:opacity-90 transition-opacity ' + (STATUS_COLOR[j.statusSesi] ?? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{j.kelas}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{STATUS_LABEL[j.statusSesi]}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); dismissTodo('sesi-' + j.jadwalId) }}
                      className="w-4 h-4 rounded-full hover:bg-black/10 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                      title="Dismiss"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-xs opacity-70">
                  {formatJam(j.jamMulai)} – {formatJam(j.jamSelesai)}
                  {(j.ruangan as any)?.nama ? ` · ${(j.ruangan as any).nama}` : ''}
                </p>
              </div>
            ))}

          {!loadingTodo && totalPending > 0 && !dismissedTodo.has('penilaian') && (
            <div className="space-y-2">
              {todo!.menungguPenilaian
                .filter((t) => !dismissedTodo.has('tugas-' + t.id))
                .map((t) => (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => nav(`/dashboard/tugas/${t.id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && nav(`/dashboard/tugas/${t.id}`)}
                    className="w-full flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2.5 cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400 truncate">
                        {t.judulTugas}
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-500">
                        {t.kelas} · {t.namaSiswa} · {t.statusLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); dismissTodo('tugas-' + t.id) }}
                      className="w-5 h-5 rounded-full hover:bg-amber-100 dark:hover:bg-amber-800 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity shrink-0"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Navigasi */}
        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Navigasi</p>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="secondary" leftIcon={<CalendarDays className="w-3.5 h-3.5" />}
              onClick={() => nav('/dashboard/absensi/guru?mataPelajaranId=' + mapel.id)}>
              Absensi
            </Button>
            <Button size="sm" variant="secondary" leftIcon={<BookOpen className="w-3.5 h-3.5" />}
              onClick={() => nav('/dashboard/materi-pelajaran?mataPelajaranId=' + mapel.id)}>
              Materi
            </Button>
            <Button size="sm" variant="secondary" leftIcon={<ClipboardList className="w-3.5 h-3.5" />}
              onClick={() => nav('/dashboard/tugas?mataPelajaranId=' + mapel.id)}>
              Tugas
            </Button>
            <Button size="sm" variant="secondary" leftIcon={<BarChart2 className="w-3.5 h-3.5" />}
              onClick={() => nav('/dashboard/penilaian?mataPelajaranId=' + mapel.id)}>
              Penilaian
            </Button>
            <Button size="sm" variant="secondary" leftIcon={<Users className="w-3.5 h-3.5" />}
              onClick={() => nav('/dashboard/kelas/' + mapel.kelasId + '/siswa')}>
              Daftar Siswa
            </Button>
            <Button size="sm" variant="secondary" leftIcon={<CalendarCheck className="w-3.5 h-3.5 text-blue-500" />}
              onClick={() => nav('/dashboard/jadwal/guru?kelasId=' + mapel.kelasId + '&semesterId=' + mapel.semesterId)}>
              Jadwal
            </Button>
          </div>
        </div>

      </div>
    </SlideOver>
  )
}
