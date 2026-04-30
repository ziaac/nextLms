'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { isManajemen } from '@/lib/helpers/role'
import { useTahunAjaranActive } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran, useActiveSemesterLabel } from '@/hooks/semester/useSemester'
import { reportApi } from '@/lib/api/report.api'
import { Skeleton, Badge } from '@/components/ui'
import { Spinner } from '@/components/ui/Spinner'
import { getPublicFileUrl } from '@/lib/constants'
import { formatTanggalSaja } from '@/lib/helpers/timezone'
import {
  CalendarDays, ClipboardList, BookOpen, CheckCircle2,
  Clock, ChevronRight, ClipboardCheck,
  Users, BarChart3, FileText, ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePerizinanList } from '@/hooks/perizinan/usePerizinan'
import { getListPerizinan } from '@/lib/api/perizinan.api'
import { useKelasList } from '@/hooks/kelas/useKelas'
import type {
  JadwalHariIniItem,
  TugasMenungguPenilaianItem,
  StatistikGuruResponse,
  TugasStatsItem,
} from '@/types/akademik.types'
import type { PerizinanItem } from '@/types/perizinan.types'
import type { Kelas } from '@/types/kelas.types'

const SISWA_ROLES = new Set(['SISWA', 'ORANG_TUA'])

// ── Status sesi badge ─────────────────────────────────────────
function SesiStatusBadge({ status }: { status: JadwalHariIniItem['statusSesi'] }) {
  const map = {
    AKSI_DIBUTUHKAN:    { label: 'Buka Absensi',  cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    KELAS_SUDAH_DIBUKA: { label: 'Sudah Dibuka',  cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    BELUM_WAKTUNYA:     { label: 'Belum Waktunya', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
    TERLEWAT:           { label: 'Terlewat',       cls: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  }
  const { label, cls } = map[status] ?? map.BELUM_WAKTUNYA
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0', cls)}>
      {label}
    </span>
  )
}

// ── Stat card kecil ───────────────────────────────────────────
function MiniStatCard({
  label, value, icon: Icon, color, loading,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: 'emerald' | 'blue' | 'amber' | 'purple'
  loading: boolean
}) {
  const colorMap = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
    blue:    'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
    amber:   'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
    purple:  'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400',
  }
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colorMap[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
        {loading
          ? <Skeleton className="h-6 w-12 rounded mt-0.5" />
          : <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        }
      </div>
    </div>
  )
}

// ── Progress bar sederhana ────────────────────────────────────
function ProgressBar({ value, max, color = 'emerald' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded-full bg-${color}-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  )
}

// ── Dashboard Guru ────────────────────────────────────────────
function DashboardGuru() {
  const router   = useRouter()
  const { user } = useAuthStore()
  const semLabel = useActiveSemesterLabel()

  // Ambil tahun ajaran & semester aktif
  const { data: taListRaw = [] } = useTahunAjaranActive()
  const taList  = taListRaw as { id: string; nama: string }[]
  const taAktif = taList[0] ?? null

  const { data: semListRaw = [] } = useSemesterByTahunAjaran(taAktif?.id ?? null)
  const semAktif = (semListRaw as { id: string; nama: string; isActive?: boolean; urutan?: number }[])
    .filter((s) => s.isActive)
    .sort((a, b) => (b.urutan ?? 0) - (a.urutan ?? 0))[0] ?? null

  const hasContext = !!taAktif?.id && !!semAktif?.id

  // Todo guru: jadwal hari ini + tugas menunggu penilaian
  const { data: todoData, isLoading: todoLoading } = useQuery({
    queryKey: ['dashboard-guru-todo'],
    queryFn:  () => reportApi.getGuruTodo({}),
    staleTime: 1000 * 60,
    enabled:  true,
  })

  // Statistik guru semester ini
  const { data: statData, isLoading: statLoading } = useQuery({
    queryKey: ['dashboard-guru-stat', taAktif?.id, semAktif?.id],
    queryFn:  () => reportApi.getGuruSaya({
      tahunAjaranId: taAktif!.id,
      semesterId:    semAktif!.id,
    }),
    staleTime: 1000 * 60 * 5,
    enabled:  hasContext,
  })

  const jadwalHariIni    = todoData?.jadwalHariIni     ?? []
  const menungguPenilaian = todoData?.menungguPenilaian ?? []
  const tugasStats        = (statData as StatistikGuruResponse | undefined)?.tugas ?? []

  // Cek apakah guru ini adalah wali kelas di tahun ajaran aktif
  // (tidak bergantung pada role — cek langsung dari data kelas)
  const { data: kelasList = [] } = useKelasList(
    taAktif?.id ? { tahunAjaranId: taAktif.id } : undefined,
    !!taAktif?.id,
  )
  const isWaliKelas = (kelasList as Kelas[]).some(
    (k) => k.waliKelasId === user?.id,
  )

  // Perizinan pending — hanya untuk yang menjabat wali kelas
  const { data: perizinanData, isLoading: perizinanLoading } = useQuery({
    queryKey: ['perizinan', 'list', { status: 'PENDING', page: 1, limit: 10 }],
    queryFn:  () => getListPerizinan({ status: 'PENDING', page: 1, limit: 10 }),
    enabled:  isWaliKelas,
    staleTime: 0,
  })
  const perizinanPending = perizinanData?.data ?? []

  const firstName = user?.namaLengkap?.split(' ')[0] ?? 'Guru'
  const now       = new Date()
  const hariIni   = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">

      {/* ── Greeting ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Selamat datang, {firstName}!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{hariIni}</p>
          {semLabel && (
            <span className="inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              {semLabel}
            </span>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStatCard
          label="Sesi Absensi"
          value={(statData as StatistikGuruResponse | undefined)?.totalSesiAbsensi ?? 0}
          icon={CalendarDays}
          color="emerald"
          loading={statLoading}
        />
        <MiniStatCard
          label="Nilai Diinput"
          value={(statData as StatistikGuruResponse | undefined)?.totalNilaiDiinput ?? 0}
          icon={BarChart3}
          color="blue"
          loading={statLoading}
        />
        <MiniStatCard
          label="Tugas Aktif"
          value={tugasStats.length}
          icon={ClipboardList}
          color="amber"
          loading={statLoading}
        />
        <MiniStatCard
          label="Menunggu Nilai"
          value={menungguPenilaian.length}
          icon={ClipboardCheck}
          color="purple"
          loading={todoLoading}
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Jadwal Hari Ini */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-500" />
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Jadwal Hari Ini</p>
              {jadwalHariIni.length > 0 && (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                  {jadwalHariIni.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => router.push('/dashboard/jadwal/guru')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Lihat semua
            </button>
          </div>

          {todoLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
            </div>
          ) : jadwalHariIni.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <p className="text-sm text-gray-400">Tidak ada jadwal hari ini</p>
            </div>
          ) : (
            <div className="space-y-2">
              {jadwalHariIni.map((j: JadwalHariIniItem) => (
                <button
                  key={j.jadwalId}
                  type="button"
                  onClick={() => router.push('/dashboard/jadwal/guru')}
                  className="w-full flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 px-3 py-2.5 hover:border-gray-200 dark:hover:border-gray-700 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{j.namaMapel}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {j.kelas} · {j.jamMulai}–{j.jamSelesai}
                      {j.ruangan ? ` · ${j.ruangan}` : ''}
                    </p>
                  </div>
                  <SesiStatusBadge status={j.statusSesi} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tugas Menunggu Penilaian */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-purple-500" />
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Menunggu Penilaian</p>
              {menungguPenilaian.length > 0 && (
                <span className="text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                  {menungguPenilaian.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => router.push('/dashboard/todo')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Lihat semua
            </button>
          </div>

          {todoLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
            </div>
          ) : menungguPenilaian.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <p className="text-sm text-gray-400">Semua tugas sudah dinilai</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {menungguPenilaian.slice(0, 6).map((t: TugasMenungguPenilaianItem) => (
                <button
                  key={`${t.id}-${t.namaSiswa}`}
                  type="button"
                  onClick={() => t.id ? router.push(`/dashboard/tugas/${t.id}`) : undefined}
                  className="w-full flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 px-3 py-2.5 hover:border-gray-200 dark:hover:border-gray-700 transition-colors text-left"
                >
                  {t.fotoSiswa ? (
                    <img
                      src={getPublicFileUrl(t.fotoSiswa)}
                      alt={t.namaSiswa}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-purple-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{t.judulTugas}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                      {t.namaSiswa} · {t.namaMapel} · {t.kelas}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </button>
              ))}
              {menungguPenilaian.length > 6 && (
                <p className="text-xs text-center text-gray-400 pt-1">
                  +{menungguPenilaian.length - 6} lainnya
                </p>
              )}
            </div>
          )}
        </div>

        {/* Rekap Tugas Semester Ini */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Rekap Tugas</p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/dashboard/tugas')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Kelola tugas
            </button>
          </div>

          {statLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            </div>
          ) : tugasStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400">Belum ada tugas semester ini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tugasStats.slice(0, 5).map((t: TugasStatsItem, i: number) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{t.judul}</p>
                      <p className="text-[11px] text-gray-400">{t.mapel} · {t.kelas}</p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                      {t.sudahSubmit}/{t.totalSiswa}
                    </span>
                  </div>
                  <ProgressBar value={t.sudahSubmit} max={t.totalSiswa} color="amber" />
                </div>
              ))}
              {tugasStats.length > 5 && (
                <p className="text-xs text-center text-gray-400">+{tugasStats.length - 5} tugas lainnya</p>
              )}
            </div>
          )}
        </div>

        {/* Perizinan Pending — hanya untuk WALI_KELAS */}
        {isWaliKelas && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Perizinan Menunggu</p>
                {perizinanPending.length > 0 && (
                  <span className="text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                    {perizinanPending.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => router.push('/dashboard/perizinan')}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Kelola perizinan
              </button>
            </div>

            {perizinanLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : perizinanPending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <p className="text-sm text-gray-400">Tidak ada perizinan yang menunggu</p>
              </div>
            ) : (
              <div className="space-y-2">
                {perizinanPending.map((p: PerizinanItem) => {
                  const tglMulai = (() => {
                    try { return formatTanggalSaja(new Date(p.tanggalMulai)) } catch { return p.tanggalMulai }
                  })()
                  const tglSelesai = (() => {
                    try { return formatTanggalSaja(new Date(p.tanggalSelesai)) } catch { return p.tanggalSelesai }
                  })()
                  const isSameDay = p.tanggalMulai.slice(0, 10) === p.tanggalSelesai.slice(0, 10)
                  const jenisLabel: Record<string, string> = {
                    SAKIT: 'Sakit', IZIN: 'Izin', CUTI: 'Cuti',
                    DINAS: 'Dinas', KEPERLUAN_KELUARGA: 'Keperluan Keluarga',
                  }
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => router.push('/dashboard/perizinan')}
                      className="w-full flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 px-3 py-2.5 hover:border-blue-200 dark:hover:border-blue-800 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {p.user?.profile?.namaLengkap ?? 'Siswa'}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {jenisLabel[p.jenis] ?? p.jenis} ·{' '}
                          {isSameDay ? tglMulai : `${tglMulai} – ${tglSelesai}`}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full shrink-0">
                        Pending
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Shortcut navigasi */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Akses Cepat</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Pembelajaran',      href: '/dashboard/pembelajaran/guru',  icon: BookOpen,       color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' },
              { label: 'Materi Pelajaran',  href: '/dashboard/materi-pelajaran',   icon: FileText,       color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' },
              { label: 'Tugas & Nilai',     href: '/dashboard/tugas',              icon: ClipboardList,  color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' },
              { label: 'Dokumen Pengajaran',href: '/dashboard/dokumen-pengajaran', icon: FileText,       color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400' },
              { label: 'Jadwal & Absensi',  href: '/dashboard/jadwal/guru',        icon: CalendarDays,   color: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' },
              { label: 'Log LCKH',          href: '/dashboard/log-lckh',           icon: ClipboardCheck, color: 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400' },
            ].map(({ label, href, icon: Icon, color }) => (
              <button
                key={href}
                type="button"
                onClick={() => router.push(href)}
                className="flex items-center gap-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 px-3 py-2.5 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm transition-all text-left"
              >
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', color)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const user   = useAuthStore((s) => s.user)
  const router = useRouter()

  useEffect(() => {
    if (!user) return
    if (SISWA_ROLES.has(user.role)) {
      router.replace('/dashboard/pembelajaran/siswa')
    } else if (isManajemen(user.role)) {
      router.replace('/dashboard/report')
    }
  }, [user, router])

  if (!user) return null

  // Redirect spinner untuk siswa & manajemen
  if (SISWA_ROLES.has(user.role) || isManajemen(user.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    )
  }

  // Dashboard untuk GURU / WALI_KELAS
  return <DashboardGuru />
}
