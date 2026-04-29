'use client'

import { useQuery }                      from '@tanstack/react-query'
import { useRouter }                     from 'next/navigation'
import { useAuthStore }                  from '@/stores/auth.store'
import { useTahunAjaranActive }          from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useActiveSemesterLabel }        from '@/hooks/semester/useSemester'
import { reportApi }                     from '@/lib/api/report.api'
import {
  ArrowLeft, ListTodo, ClipboardList,
  AlertCircle, Clock, CheckCircle2,
  BookOpen, CalendarDays, ChevronRight,
} from 'lucide-react'
import { cn }                            from '@/lib/utils'
import { Spinner }                       from '@/components/ui/Spinner'
import { format, isPast, isToday, differenceInDays } from 'date-fns'
import { id as localeId }                from 'date-fns/locale'
import type {
  TugasPendingItem,
  AbsensiPendingItem,
  MateriPerMapelItem,
  TugasMenungguPenilaianItem,
} from '@/types/akademik.types'

const GURU_ROLES  = ['GURU', 'WALI_KELAS']
const SISWA_ROLES = ['SISWA']

// ── Deadline badge ────────────────────────────────────────────
function DeadlineBadge({ deadline }: { deadline: string }) {
  const d    = new Date(deadline)
  const past = isPast(d) && !isToday(d)
  const soon = !past && differenceInDays(d, new Date()) <= 2

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
      past ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
           : soon ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    )}>
      <Clock className="w-2.5 h-2.5" />
      {past ? 'Terlambat' : isToday(d) ? 'Hari ini' : format(d, 'd MMM', { locale: localeId })}
    </span>
  )
}

// ── Section header ────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, count }: {
  icon: React.ElementType; title: string; count: number
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-400" />
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
      {count > 0 && (
        <span className="text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  )
}

// ── Empty section ─────────────────────────────────────────────
function AllDone() {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 px-3 py-3">
      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
      <p className="text-xs text-emerald-700 dark:text-emerald-400">Semua sudah selesai</p>
    </div>
  )
}

// ── SISWA view ────────────────────────────────────────────────
function TodoSiswaView({
  tahunAjaranId, router,
}: { tahunAjaranId: string; router: ReturnType<typeof useRouter> }) {
  const { data, isLoading } = useQuery({
    queryKey: ['todo-siswa-global', tahunAjaranId],
    queryFn:  () => reportApi.getSiswaTodo({ tahunAjaranId }),
    enabled:  !!tahunAjaranId,
    staleTime: 1000 * 60,
  })

  const tugas        = data?.tugasPending   ?? []
  const absensi      = data?.absensiPending ?? []
  const materiMapel  = data?.materiPerMapel ?? []
  const absensiAksi  = absensi.filter((a) => a.status === 'AKSI_DIBUTUHKAN')

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner /></div>
  }

  const totalPending = tugas.length + absensiAksi.length + materiMapel.length

  if (totalPending === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Semua beres</p>
          <p className="text-xs text-gray-400 mt-1">Tidak ada tugas, absensi, atau materi yang perlu aksi.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Tugas Pending */}
      <div className="space-y-2">
        <SectionHeader icon={ClipboardList} title="Tugas Belum Dikumpul" count={tugas.length} />
        {tugas.length === 0 ? <AllDone /> : tugas.map((t: TugasPendingItem) => (
          <button
            key={t.id}
            type="button"
            onClick={() => router.push(`/dashboard/tugas/${t.id}`)}
            className="w-full flex items-start gap-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-3 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0 mt-0.5">
              <ClipboardList className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{t.judul}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                  <BookOpen className="w-2.5 h-2.5" />{t.namaMapel}
                </span>
                <DeadlineBadge deadline={t.deadline} />
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
          </button>
        ))}
      </div>

      {/* Absensi Perlu Aksi */}
      <div className="space-y-2">
        <SectionHeader icon={CalendarDays} title="Absensi Perlu Aksi" count={absensiAksi.length} />
        {absensiAksi.length === 0 ? <AllDone /> : absensiAksi.map((a: AbsensiPendingItem) => (
          <button
            key={a.jadwalId}
            type="button"
            onClick={() => router.push('/dashboard/jadwal/kelas')}
            className="w-full flex items-start gap-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-3 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{a.namaMapel}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{a.jamMulai} – {a.jamSelesai} · Belum absen</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
          </button>
        ))}

        {/* Menunggu Guru — informasi saja */}
        {absensi.filter((a) => a.status === 'MENUNGGU_GURU').map((a: AbsensiPendingItem) => (
          <div
            key={a.jadwalId}
            className="flex items-start gap-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 px-3.5 py-3 opacity-60"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{a.namaMapel}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{a.jamMulai} – {a.jamSelesai} · Menunggu guru</p>
            </div>
          </div>
        ))}
      </div>

      {/* Materi Belum Dibaca per Mapel */}
      {materiMapel.length > 0 && (
        <div className="space-y-2">
          <SectionHeader icon={BookOpen} title="Materi Belum Dibaca" count={materiMapel.length} />
          {materiMapel.map((m: MateriPerMapelItem) => (
            <button
              key={m.mataPelajaranId}
              type="button"
              onClick={() => router.push(`/dashboard/materi-pelajaran?mataPelajaranId=${m.mataPelajaranId}`)}
              className="w-full flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-3 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-blue-500" />
              </div>
              <p className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                {m.namaMapel}
              </p>
              <span className="text-[11px] font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full shrink-0">
                {m.belumDibaca} belum dibaca
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      )}

    </div>
  )
}

// ── GURU view ─────────────────────────────────────────────────
function TodoGuruView({
  router,
}: { router: ReturnType<typeof useRouter> }) {
  const { data, isLoading } = useQuery({
    queryKey: ['todo-guru-global'],
    queryFn:  () => reportApi.getGuruTodo({}),
    staleTime: 1000 * 60,
  })

  const menunggu = data?.menungguPenilaian ?? []
  // Filter out items without id to prevent navigation errors
  const validMenunggu = menunggu.filter((t) => t.id)

  // Debug log
  if (process.env.NODE_ENV === 'development') {
    console.log('Todo Guru Data:', { data, menunggu, validMenunggu })
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner /></div>
  }

  if (validMenunggu.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Semua beres</p>
          <p className="text-xs text-gray-400 mt-1">Tidak ada tugas yang menunggu penilaian.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Tugas Menunggu Penilaian */}
      <div className="space-y-2">
        <SectionHeader icon={ClipboardList} title="Menunggu Penilaian" count={validMenunggu.length} />
        {validMenunggu.length === 0 ? <AllDone /> : validMenunggu.map((t: TugasMenungguPenilaianItem, idx: number) => (
          <button
            key={t.id || `tugas-${idx}`}
            type="button"
            onClick={() => router.push(`/dashboard/tugas/${t.id}`)}
            className="w-full flex items-start gap-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-3 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 mt-0.5">
              <ClipboardList className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{t.judulTugas}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{t.namaMapel} · {t.kelas}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
          </button>
        ))}
      </div>

      {/* Jadwal Hari Ini */}
      {data?.jadwalHariIni && data.jadwalHariIni.length > 0 && (
        <div className="space-y-2">
          <SectionHeader icon={CalendarDays} title="Jadwal Hari Ini" count={data.jadwalHariIni.length} />
          {data.jadwalHariIni.map((j) => (
            <button
              key={j.jadwalId}
              type="button"
              onClick={() => router.push('/dashboard/jadwal/guru')}
              className="w-full flex items-start gap-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-3 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 mt-0.5">
                <CalendarDays className="w-4 h-4 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{j.namaMapel}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{j.kelas} · {j.jamMulai} – {j.jamSelesai}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function TodoPage() {
  const router   = useRouter()
  const { user } = useAuthStore()
  const semLabel = useActiveSemesterLabel()

  const { data: taListRaw = [] } = useTahunAjaranActive()
  const taList  = taListRaw as { id: string; nama: string }[]
  const taAktif = taList[0] ?? null

  const isGuru  = GURU_ROLES.includes(user?.role ?? '')
  const isSiswa = SISWA_ROLES.includes(user?.role ?? '')

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center shrink-0 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 shrink-0" />
        <div className="min-w-0">
          <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">To Do</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{semLabel ?? 'Memuat...'}</p>
        </div>
      </div>

      {/* ── Content ── */}
      {isSiswa && taAktif && (
        <TodoSiswaView tahunAjaranId={taAktif.id} router={router} />
      )}
      {isGuru && (
        <TodoGuruView router={router} />
      )}
      {!isSiswa && !isGuru && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <ListTodo className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm text-gray-400">Halaman ini untuk siswa dan guru.</p>
        </div>
      )}

    </div>
  )
}
