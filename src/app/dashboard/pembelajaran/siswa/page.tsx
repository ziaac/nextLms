'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery }                      from '@tanstack/react-query'
import { Archive, Users, BookOpen, ClipboardList, CalendarDays } from 'lucide-react'
import { Button }                        from '@/components/ui'
import { useAuthStore }                  from '@/stores/auth.store'
import { isSiswaOrtu }                   from '@/lib/helpers/role'
import { reportApi }                     from '@/lib/api/report.api'
import { useSemesterByTahunAjaran }      from '@/hooks/semester/useSemester'
import { MapelCardSiswa }                from './_components/mapel-card-siswa'
import { MapelSlideoverSiswa }           from './_components/mapel-slideover-siswa'
import { MapelArsipSiswaSlideover }      from './_components/mapel-arsip-siswa-slideover'
import { useRouter }                     from 'next/navigation'
import type { MapelSiswaItem }           from '@/types/akademik.types'

// ── Day constants ────────────────────────────────────────────────────────────
const DAY_ORDER  = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']
const DAY_SHORT: Record<string, string> = {
  SENIN: 'Sen', SELASA: 'Sel', RABU: 'Rab',
  KAMIS: 'Kam', JUMAT: 'Jum', SABTU: 'Sab',
}
const JS_TO_HARI = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']

// ── Data hooks ───────────────────────────────────────────────────────────────
function useKelasSiswa(siswaId: string | null) {
  return useQuery({
    queryKey: ['kelas-siswa-history', siswaId],
    queryFn:  async () => {
      const { default: api } = await import('@/lib/axios')
      const res = await api.get(`/kelas/siswa/${siswaId}/history`)
      return res.data as Array<{
        kelasId:       string
        tahunAjaranId: string
        kelas: {
          id:          string
          namaKelas:   string
          tahunAjaran: { nama: string; isActive: boolean }
        }
      }>
    },
    enabled:   !!siswaId,
    staleTime: 1000 * 60 * 5,
  })
}

function useAnakOrangTua(enabled: boolean) {
  return useQuery({
    queryKey: ['orang-tua-anak'],
    queryFn:  () => reportApi.getAnakOrangTua(),
    enabled,
    staleTime: 1000 * 60 * 10,
  })
}

// ── Glass stat card ──────────────────────────────────────────────────────────
function GlassStatCard({
  label, value, sub, accent = 'emerald',
}: {
  label:   string
  value:   string | number
  sub:     string
  accent?: 'emerald' | 'blue' | 'amber'
}) {
  const accentMap = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    blue:    'text-blue-600 dark:text-blue-400',
    amber:   'text-amber-600 dark:text-amber-400',
  }
  return (
    <div className="bg-white/55 dark:bg-white/[0.06] backdrop-blur-md rounded-2xl border border-white/70 dark:border-white/10 px-3 py-3.5 space-y-0.5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 truncate">
        {label}
      </p>
      <p className={`text-xl font-bold leading-tight ${accentMap[accent]}`}>
        {value}
      </p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{sub}</p>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function PembelajaranSiswaPage() {
  const { user }  = useAuthStore()
  const router     = useRouter()
  const bolehAkses = isSiswaOrtu(user?.role)

  const [arsipOpen,   setArsipOpen]   = useState(false)
  const [slideTarget, setSlideTarget] = useState<MapelSiswaItem | null>(null)
  const [selectedDay, setSelectedDay] = useState<string>(
    () => JS_TO_HARI[new Date().getDay()] ?? 'SENIN',
  )

  const isOrangTua = user?.role === 'ORANG_TUA'

  const { data: anakList = [] }                   = useAnakOrangTua(isOrangTua)
  const anakPertama = anakList[0]
  const siswaId     = isOrangTua ? (anakPertama?.id ?? null) : (user?.id ?? null)

  const { data: kelasHistory = [], isLoading: loadingKelas } = useKelasSiswa(siswaId)

  const kelasAktif = kelasHistory.find((k) => k.kelas.tahunAjaran.isActive)
  const kelasArsip = kelasHistory
    .filter((k) => !k.kelas.tahunAjaran.isActive)
    .map((k) => ({
      kelasId:       k.kelas.id,
      namaKelas:     k.kelas.namaKelas,
      tahunAjaran:   k.kelas.tahunAjaran.nama,
      tahunAjaranId: k.tahunAjaranId,
    }))

  const { data: semListRaw } = useSemesterByTahunAjaran(kelasAktif?.tahunAjaranId ?? null)
  const semesterList = (
    semListRaw as { id: string; nama: string; urutan?: number; isActive?: boolean }[] | undefined
  ) ?? []

  const activeSemList = useMemo(
    () =>
      semesterList
        .filter((s) => s.isActive)
        .slice()
        .sort((a, b) => (b.urutan ?? 0) - (a.urutan ?? 0)),
    [semesterList],
  )
  const semesterAktif = activeSemList[0] ?? null

  const { data: overview, isLoading: loadingMapel } = useQuery({
    queryKey: ['siswa-overview', siswaId, kelasAktif?.tahunAjaranId, semesterAktif?.id],
    queryFn:  () => reportApi.getSiswaOverview({
      tahunAjaranId: kelasAktif!.tahunAjaranId,
      semesterId:    semesterAktif!.id,
      siswaId:       isOrangTua ? siswaId! : undefined,
    }),
    enabled:   !!siswaId && !!kelasAktif?.tahunAjaranId && !!semesterAktif?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: todoAll } = useQuery({
    queryKey: ['siswa-todo-all', siswaId, kelasAktif?.tahunAjaranId, semesterAktif?.id],
    queryFn:  () => reportApi.getSiswaTodo({
      tahunAjaranId: kelasAktif!.tahunAjaranId,
      siswaId:       isOrangTua ? siswaId! : undefined,
    }),
    enabled:   !!siswaId && !!kelasAktif?.tahunAjaranId && !!semesterAktif?.id,
    staleTime: 1000 * 60 * 2,
  })

  const todoCountMap = useMemo(() => {
    const map: Record<string, number> = {}
    todoAll?.tugasPending.forEach((t) => {
      if (t.mataPelajaranId) map[t.mataPelajaranId] = (map[t.mataPelajaranId] ?? 0) + 1
    })
    todoAll?.absensiPending.forEach((a) => {
      if (a.status === 'AKSI_DIBUTUHKAN') {
        map[a.mataPelajaranId] = (map[a.mataPelajaranId] ?? 0) + 1
      }
    })
    return map
  }, [todoAll])

  const mapelList = overview?.mapel ?? []
  const isLoading = loadingKelas || loadingMapel

  // ── Aggregated stats ──────────────────────────────────────────────────────
  const aggStats = useMemo(() => {
    if (mapelList.length === 0) return null
    const sumKehadiran    = mapelList.reduce((s, m) => s + m.stats.absensiPercentage, 0)
    const sumMateri       = mapelList.reduce((s, m) => s + m.stats.totalMateri, 0)
    const sumMateriDibaca = mapelList.reduce((s, m) => s + m.stats.materiDibaca, 0)
    const sumTugas        = mapelList.reduce((s, m) => s + m.stats.tugasTotal, 0)
    const sumTugasSelesai = mapelList.reduce((s, m) => s + m.stats.tugasSelesai, 0)
    return {
      kehadiran:     Math.round(sumKehadiran / mapelList.length),
      materiDibaca:  sumMateriDibaca,
      totalMateri:   sumMateri,
      tugasSelesai:  sumTugasSelesai,
      tugasTotal:    sumTugas,
    }
  }, [mapelList])

  // ── Day pills data ────────────────────────────────────────────────────────
  // Count mapel per day
  const mapelPerDay = useMemo(() => {
    const map: Record<string, number> = {}
    DAY_ORDER.forEach((d) => { map[d] = 0 })
    mapelList.forEach((m) => {
      const seen = new Set<string>()
      m.jadwal.forEach((j) => {
        if (!seen.has(j.hari)) { seen.add(j.hari); map[j.hari] = (map[j.hari] ?? 0) + 1 }
      })
    })
    return map
  }, [mapelList])

  // Filtered mapel for selected day
  const filteredMapel = useMemo(
    () => mapelList.filter((m) => m.jadwal.some((j) => j.hari === selectedDay)),
    [mapelList, selectedDay],
  )

  // ── Access guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (user && !bolehAkses) {
      const t = setTimeout(() => router.back(), 2000)
      return () => clearTimeout(t)
    }
  }, [user, bolehAkses, router])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!bolehAkses) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <p className="text-sm">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }

  if (isOrangTua && !loadingKelas && anakList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400 dark:text-gray-500">
        <Users className="w-10 h-10 opacity-40" />
        <p className="text-sm font-medium">Data anak belum tersedia</p>
        <p className="text-xs text-center max-w-xs text-gray-400 dark:text-gray-500">
          Hubungi admin untuk menghubungkan akun Anda dengan data siswa.
        </p>
      </div>
    )
  }

  const taDisplay  = kelasAktif?.kelas.tahunAjaran.nama ?? ''
  const semDisplay = semesterAktif
    ? `Sem. ${semesterAktif.nama.charAt(0) + semesterAktif.nama.slice(1).toLowerCase()}`
    : ''
  const sectionLabel =
    taDisplay ? `Pelajaran Saya · ${taDisplay}${semDisplay ? ` · ${semDisplay}` : ''}` : 'Pelajaran Saya'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">

      {/* ── Action buttons row ── */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          {isOrangTua && anakPertama && (
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">
              {anakPertama.profile?.namaLengkap ?? 'Anak'}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="secondary"
            leftIcon={<Archive className="w-4 h-4" />}
            onClick={() => setArsipOpen(true)}
            className="whitespace-nowrap"
          >
            Arsip
          </Button>
        </div>
      </div>

      {/* ── No active class banner ── */}
      {!isLoading && !kelasAktif && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3">
          <p className="text-sm text-amber-700 dark:text-amber-400">Tidak ada kelas aktif saat ini.</p>
        </div>
      )}

      {/* ── Gradient stats section ── */}
      <div className="relative -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-7">
        {/* gradient overlay — fade in from both ends so it blends with sections above & below */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-to-b from-transparent via-emerald-50/90 to-transparent dark:from-transparent dark:via-emerald-950/25 dark:to-transparent" />
        {/* subtle warm tint layer */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-to-b from-transparent via-orange-50/30 to-transparent dark:via-amber-900/8 dark:from-transparent dark:to-transparent" />

        {isLoading ? (
          <div className="relative grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[76px] rounded-2xl bg-white/50 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : aggStats ? (
          <div className="relative grid grid-cols-3 gap-3">
            <GlassStatCard
              label="Kehadiran"
              value={`${aggStats.kehadiran}%`}
              sub="rata-rata"
              accent="emerald"
            />
            <GlassStatCard
              label="Materi Akses"
              value={`${aggStats.materiDibaca}/${aggStats.totalMateri}`}
              sub={aggStats.totalMateri > 0
                ? `${Math.round((aggStats.materiDibaca / aggStats.totalMateri) * 100)}% terbaca`
                : 'belum ada materi'}
              accent="blue"
            />
            <GlassStatCard
              label="Tugas Selesai"
              value={`${aggStats.tugasSelesai}/${aggStats.tugasTotal}`}
              sub={aggStats.tugasTotal > 0
                ? `${Math.round((aggStats.tugasSelesai / aggStats.tugasTotal) * 100)}% selesai`
                : 'belum ada tugas'}
              accent="amber"
            />
          </div>
        ) : null}
      </div>

      {/* ── Section title ── */}
      <div className="space-y-2.5 -mt-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {sectionLabel}
        </p>

        {/* ── Day pills ── */}
        {!isLoading && mapelList.length > 0 && (
          <div
            className="flex gap-1.5 overflow-x-auto pb-0.5"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {DAY_ORDER.map((day) => {
              const count   = mapelPerDay[day] ?? 0
              const isToday = day === JS_TO_HARI[new Date().getDay()]
              const active  = day === selectedDay
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={[
                    'relative shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                    active
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/35 dark:text-emerald-400'
                      : 'bg-gray-100/80 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-gray-700',
                  ].join(' ')}
                >
                  {DAY_SHORT[day]}
                  {count > 0 && (
                    <span className={[
                      'ml-1.5 text-[10px] font-semibold tabular-nums',
                      active ? 'text-emerald-400 dark:text-emerald-500' : 'text-gray-400 dark:text-gray-500',
                    ].join(' ')}>
                      {count}
                    </span>
                  )}
                  {/* today dot */}
                  {isToday && !active && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-emerald-500" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Loading skeleton (mapel cards) ── */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
              <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* ── Empty: no mapel at all ── */}
      {!isLoading && mapelList.length === 0 && kelasAktif && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400 dark:text-gray-500">
          <CalendarDays className="w-10 h-10 opacity-40" />
          <p className="text-sm font-medium">Belum ada mata pelajaran</p>
        </div>
      )}

      {/* ── Empty: no mapel on selected day ── */}
      {!isLoading && mapelList.length > 0 && filteredMapel.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400 dark:text-gray-500">
          <CalendarDays className="w-8 h-8 opacity-30" />
          <p className="text-sm">Tidak ada pelajaran hari {DAY_SHORT[selectedDay] ?? selectedDay}</p>
        </div>
      )}

      {/* ── Mapel grid (filtered by day) ── */}
      {!isLoading && filteredMapel.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMapel.map((mapel) => (
            <MapelCardSiswa
              key={`${mapel.id}-${selectedDay}`}
              mapel={mapel}
              kelasId={kelasAktif?.kelas.id ?? ''}
              tahunAjaranId={kelasAktif?.tahunAjaranId ?? ''}
              siswaId={isOrangTua ? siswaId! : undefined}
              todoCount={todoCountMap[mapel.id] ?? 0}
              onKlik={setSlideTarget}
            />
          ))}
        </div>
      )}

      {/* ── Slideovers ── */}
      <MapelSlideoverSiswa
        mapel={slideTarget}
        onClose={() => setSlideTarget(null)}
        kelasId={kelasAktif?.kelas.id ?? ''}
        tahunAjaranId={kelasAktif?.tahunAjaranId ?? ''}
        siswaId={isOrangTua ? siswaId! : undefined}
      />

      <MapelArsipSiswaSlideover
        open={arsipOpen}
        onClose={() => setArsipOpen(false)}
        siswaId={siswaId ?? ''}
        kelasArsip={kelasArsip}
      />
    </div>
  )
}
