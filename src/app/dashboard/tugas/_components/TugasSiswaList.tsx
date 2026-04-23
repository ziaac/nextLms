'use client'

import { useMemo }          from 'react'
import { useRouter }        from 'next/navigation'
import { ClipboardList, Clock, AlertCircle, BookOpen, Award } from 'lucide-react'
import { useTugasList }     from '@/hooks/tugas/useTugas'
import { Spinner }          from '@/components/ui/Spinner'
import { Badge }            from '@/components/ui/Badge'
import { format, isPast, isToday, differenceInHours } from 'date-fns'
import { id as localeId }   from 'date-fns/locale'
import type { TugasItem, TujuanTugas } from '@/types/tugas.types'

// ── Label helpers ────────────────────────────────────────────────────
const TUJUAN_LABEL: Record<TujuanTugas, string> = {
  TUGAS_HARIAN:  'Tugas Harian',
  PENGAYAAN:     'Pengayaan',
  REMEDIAL:      'Remedial',
  PROYEK:        'Proyek',
  UTS:           'UTS',
  UAS:           'UAS',
  PORTOFOLIO:    'Portofolio',
  PRAKTIKUM:     'Praktikum',
  LAINNYA:       'Lainnya',
}

const TUJUAN_COLOR: Partial<Record<TujuanTugas, string>> = {
  UTS:     'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
  UAS:     'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
  REMEDIAL:'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
}

function getTujuanColor(tujuan: TujuanTugas) {
  return TUJUAN_COLOR[tujuan] ?? 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
}

// ── Deadline helper ──────────────────────────────────────────────────
function DeadlineChip({ dateStr, allowLate }: { dateStr: string; allowLate: boolean }) {
  const date    = new Date(dateStr)
  const past    = isPast(date)
  const today   = isToday(date)
  const hoursLeft = differenceInHours(date, new Date())

  if (past && !allowLate)
    return (
      <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
        <AlertCircle size={11} /> Ditutup
      </span>
    )
  if (past && allowLate)
    return (
      <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
        <Clock size={11} /> Terlambat
      </span>
    )
  if (today || hoursLeft <= 24)
    return (
      <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
        <Clock size={11} /> Hari ini · {format(date, 'HH:mm')}
      </span>
    )
  return (
    <span className="flex items-center gap-1 text-xs text-gray-400">
      <Clock size={11} /> {format(date, 'd MMM yyyy, HH:mm', { locale: localeId })}
    </span>
  )
}

// ── Tugas Card ───────────────────────────────────────────────────────
function TugasCard({ item, onClick }: { item: TugasItem; onClick: () => void }) {
  const mapelNama  = item.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama ?? 'Mata Pelajaran'
  const kelasNama  = item.kelas?.namaKelas ?? ''
  const guruNama   = item.guru?.profile?.namaLengkap ?? ''
  const past       = isPast(new Date(item.tanggalSelesai))

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left flex items-start gap-4 p-4 rounded-2xl border transition-all',
        'bg-white dark:bg-gray-900 hover:shadow-md hover:-translate-y-0.5',
        past && !item.allowLateSubmission
          ? 'border-gray-100 dark:border-gray-800 opacity-70'
          : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700',
      ].join(' ')}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 mt-0.5">
        <ClipboardList size={18} className="text-emerald-600 dark:text-emerald-400" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Top: tujuan chip */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getTujuanColor(item.tujuan)}`}>
            {TUJUAN_LABEL[item.tujuan]}
          </span>
          <span className="text-[10px] text-gray-400">{mapelNama}</span>
          {kelasNama && <span className="text-[10px] text-gray-400">· {kelasNama}</span>}
        </div>

        {/* Judul */}
        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 mb-1.5">
          {item.judul}
        </p>

        {/* Bottom: deadline + bobot */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <DeadlineChip dateStr={item.tanggalSelesai} allowLate={item.allowLateSubmission} />
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <Award size={10} /> {item.bobot} poin
          </span>
        </div>

        {guruNama && (
          <p className="text-[10px] text-gray-400 mt-1">Pengampu: {guruNama}</p>
        )}
      </div>
    </button>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────
interface Props {
  mataPelajaranId?: string
  materiId?:        string
  userId:           string
}

export function TugasSiswaList({ mataPelajaranId, materiId, userId }: Props) {
  const router = useRouter()

  const params = useMemo(() => ({
    isSemesterAktif: true,
    isPublished:     true,
    limit:           50,
    ...(materiId        ? { materiId }        : {}),
    ...(mataPelajaranId ? { mataPelajaranId } : {}),
  }), [materiId, mataPelajaranId])

  const { data, isLoading } = useTugasList(params, { enabled: !!userId })

  const items = useMemo(() => {
    const list = (data?.data ?? []) as TugasItem[]
    // Sort: belum lewat deadline dulu, diurutkan dari paling dekat
    return [...list].sort((a, b) => {
      const aDate = new Date(a.tanggalSelesai).getTime()
      const bDate = new Date(b.tanggalSelesai).getTime()
      const now   = Date.now()
      const aPast = aDate < now
      const bPast = bDate < now
      if (aPast !== bPast) return aPast ? 1 : -1
      return aDate - bDate
    })
  }, [data])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <BookOpen className="h-8 w-8 text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-sm text-gray-400">
          {mataPelajaranId ? 'Belum ada tugas untuk mata pelajaran ini.' : 'Belum ada tugas semester ini.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <TugasCard
          key={item.id}
          item={item}
          onClick={() => router.push(`/dashboard/tugas/${item.id}`)}
        />
      ))}
      <p className="text-center text-xs text-gray-400 pt-2">{items.length} tugas ditemukan</p>
    </div>
  )
}
