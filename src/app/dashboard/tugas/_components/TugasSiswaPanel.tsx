'use client'

import { useState, useMemo }              from 'react'
import { useRouter }                      from 'next/navigation'
import { useTugasList, useMyNilaiRekap }  from '@/hooks/tugas/useTugas'
import { useActiveSemesterLabel }         from '@/hooks/semester/useSemester'
import {
  Archive, Library, Book, BookOpen,
  Clock, AlertCircle, Award, ArrowLeft,
  ClipboardList, CheckCircle2, Star,
} from 'lucide-react'
import { ProfilLulusanSiswa } from '@/components/dimensi-profil/ProfilLulusanSiswa'
import { cn }                             from '@/lib/utils'
import { format, isPast, isToday, differenceInHours } from 'date-fns'
import { id as localeId }                 from 'date-fns/locale'
import { TujuanTugas, BentukTugas }   from '@/types/tugas.types'
import type { TugasItem, NilaiRekapItem } from '@/types/tugas.types'
import { SiswaTugasArsipSlideOver }       from './SiswaTugasArsipSlideOver'

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const TUJUAN_STAT_CONFIG: { key: TujuanTugas; label: string; color: string }[] = [
  { key: TujuanTugas.TUGAS_HARIAN, label: 'Harian',     color: 'text-gray-700 dark:text-gray-300'      },
  { key: TujuanTugas.PENGAYAAN,    label: 'Pengayaan',  color: 'text-blue-600 dark:text-blue-400'      },
  { key: TujuanTugas.REMEDIAL,     label: 'Remedial',   color: 'text-amber-600 dark:text-amber-400'    },
  { key: TujuanTugas.PROYEK,       label: 'Proyek',     color: 'text-cyan-600 dark:text-cyan-400'      },
  { key: TujuanTugas.UTS,          label: 'UTS',        color: 'text-purple-600 dark:text-purple-400'  },
  { key: TujuanTugas.UAS,          label: 'UAS',        color: 'text-indigo-600 dark:text-indigo-400'  },
  { key: TujuanTugas.PORTOFOLIO,   label: 'Portofolio', color: 'text-teal-600 dark:text-teal-400'      },
  { key: TujuanTugas.PRAKTIKUM,    label: 'Praktikum',  color: 'text-emerald-600 dark:text-emerald-400'},
  { key: TujuanTugas.LAINNYA,      label: 'Lainnya',    color: 'text-gray-500 dark:text-gray-500'      },
]

const BENTUK_LABEL: Record<BentukTugas, string> = {
  FILE_SUBMISSION:       'File',
  RICH_TEXT:             'Tulis',
  HYBRID:                'Hybrid',
  QUIZ_MULTIPLE_CHOICE:  'Quiz MC',
  QUIZ_MIX:              'Quiz Mix',
  INTERACTIVE_WORKSHEET: 'Worksheet',
}

const TUJUAN_LABEL: Record<TujuanTugas, string> = {
  TUGAS_HARIAN: 'Harian',
  PENGAYAAN:    'Pengayaan',
  REMEDIAL:     'Remedial',
  PROYEK:       'Proyek',
  UTS:          'UTS',
  UAS:          'UAS',
  PORTOFOLIO:   'Portofolio',
  PRAKTIKUM:    'Praktikum',
  LAINNYA:      'Lainnya',
}

const TUJUAN_COLOR: Partial<Record<TujuanTugas, string>> = {
  UTS:      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
  UAS:      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
  REMEDIAL: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  PROYEK:   'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
}
function getTujuanColor(tujuan: TujuanTugas) {
  return TUJUAN_COLOR[tujuan] ?? 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

// ── Deadline chip (tugas tab) ─────────────────────────────────
function DeadlineChip({ dateStr, allowLate }: { dateStr: string; allowLate: boolean }) {
  const date      = new Date(dateStr)
  const past      = isPast(date)
  const today     = isToday(date)
  const hoursLeft = differenceInHours(date, new Date())

  if (past && !allowLate)
    return <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium whitespace-nowrap"><AlertCircle size={10} /> Ditutup</span>
  if (past && allowLate)
    return <span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium whitespace-nowrap"><Clock size={10} /> Terlambat</span>
  if (today || hoursLeft <= 24)
    return <span className="flex items-center gap-1 text-[11px] text-orange-500 font-medium whitespace-nowrap"><Clock size={10} /> Hari ini · {format(date, 'HH:mm')}</span>
  return <span className="flex items-center gap-1 text-[11px] text-gray-400 whitespace-nowrap"><Clock size={10} /> {format(date, 'd MMM yyyy', { locale: localeId })}</span>
}

// ── Tugas card ────────────────────────────────────────────────
function TugasCard({ item, onClick }: { item: TugasItem; onClick: () => void }) {
  const mapelNama = item.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama ?? 'Mata Pelajaran'
  const guruNama  = item.guru?.profile?.namaLengkap ?? ''
  const past      = isPast(new Date(item.tanggalSelesai))

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-2xl border p-5 flex flex-col overflow-hidden',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30',
        past && !item.allowLateSubmission
          ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800/80 opacity-70'
          : 'bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700/80',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${getTujuanColor(item.tujuan)}`}>
          {TUJUAN_LABEL[item.tujuan]}
        </span>
        <DeadlineChip dateStr={item.tanggalSelesai} allowLate={item.allowLateSubmission} />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-1.5 text-left">
        {item.judul}
      </h3>
      <div className="flex-1" />
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate mb-1">{mapelNama}</p>
        <div className="flex items-center justify-between gap-2">
          {guruNama
            ? <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{guruNama}</span>
            : <span />
          }
          <span className="flex items-center gap-1 text-[10px] text-gray-400 shrink-0">
            <Award size={10} /> {item.bobot} poin
          </span>
        </div>
      </div>
    </button>
  )
}

// ── Skeleton ──────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-16 bg-gray-100 dark:bg-gray-700 rounded-full" />
        <div className="h-3.5 w-20 bg-gray-100 dark:bg-gray-700 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded-md" />
        <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-700 rounded-md" />
      </div>
      <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
        <div className="h-3 w-24 bg-gray-100 dark:bg-gray-700 rounded" />
        <div className="h-3 w-16 bg-gray-50 dark:bg-gray-700/60 rounded" />
      </div>
    </div>
  )
}

// ── Bentuk badge (nilai tab) ──────────────────────────────────
function BentukBadge({ bentuk }: { bentuk: BentukTugas }) {
  return (
    <span className="inline-flex items-center text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-1.5 py-0.5 rounded whitespace-nowrap">
      {BENTUK_LABEL[bentuk]}
    </span>
  )
}

// ── Status chip (nilai tab) ───────────────────────────────────
function NilaiStatusChip({ item }: { item: NilaiRekapItem }) {
  const { pengumpulan, tanggalSelesai, allowLateSubmission } = item
  if (!pengumpulan) {
    const closed = isPast(new Date(tanggalSelesai)) && !allowLateSubmission
    return closed
      ? <span className="inline-flex text-[10px] font-semibold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded-full whitespace-nowrap">Ditutup</span>
      : <span className="inline-flex text-[10px] font-semibold bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 px-2 py-0.5 rounded-full whitespace-nowrap">Belum</span>
  }
  const { status, isLate } = pengumpulan
  if (status === 'DINILAI')
    return (
      <span className={cn(
        'inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap',
        isLate
          ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
      )}>
        {isLate ? 'Terlambat' : 'Dinilai'}
      </span>
    )
  if (status === 'SUBMITTED')
    return <span className="inline-flex text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 px-2 py-0.5 rounded-full whitespace-nowrap">Menunggu</span>
  if (status === 'REVISI')
    return <span className="inline-flex text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded-full whitespace-nowrap">Revisi</span>
  return <span className="inline-flex text-[10px] font-semibold bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded-full whitespace-nowrap">Draft</span>
}

// ── Nilai table ───────────────────────────────────────────────
function NilaiTable({ items, showMapel }: { items: NilaiRekapItem[]; showMapel: boolean }) {
  if (items.length === 0) {
    return (
      <div className="py-20 text-center text-gray-400">
        <ClipboardList className="w-8 h-8 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">Belum ada data nilai</p>
        <p className="text-xs mt-1 opacity-70">Pilih mata pelajaran atau tunggu tugas dipublikasikan</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[480px] text-left">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            <th className="pb-2 pr-3 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Nama Tugas</th>
            <th className="pb-2 pr-3 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Bentuk</th>
            <th className="pb-2 pr-3 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Tujuan</th>
            <th className="pb-2 pr-3 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide text-right">Nilai</th>
            <th className="pb-2 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
          {items.map((item) => (
            <tr key={item.tugasId} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/20 transition-colors">
              <td className="py-2.5 pr-3">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug line-clamp-2">
                  {item.judul}
                </p>
                {showMapel && (
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.namaMapel}</p>
                )}
              </td>
              <td className="py-2.5 pr-3 align-top pt-[13px]">
                <BentukBadge bentuk={item.bentuk} />
              </td>
              <td className="py-2.5 pr-3 align-top pt-[11px]">
                <span className={cn(
                  'inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap',
                  getTujuanColor(item.tujuan),
                )}>
                  {TUJUAN_LABEL[item.tujuan]}
                </span>
              </td>
              <td className="py-2.5 pr-3 text-right align-top pt-[11px]">
                {item.pengumpulan?.status === 'DINILAI' && item.pengumpulan.nilai !== null
                  ? <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {item.pengumpulan.nilai}
                    </span>
                  : <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
                }
              </td>
              <td className="py-2.5 text-right align-top pt-[11px]">
                <NilaiStatusChip item={item} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Skeleton rows (nilai loading) ─────────────────────────────
function SkeletonRows() {
  return (
    <div className="space-y-1 animate-pulse">
      {[1,2,3,4,5].map((i) => (
        <div key={i} className="flex gap-3 py-2.5 border-b border-gray-50 dark:border-gray-800/50">
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-3/4 bg-gray-100 dark:bg-gray-700 rounded" />
            <div className="h-3 w-1/3 bg-gray-50 dark:bg-gray-700/60 rounded" />
          </div>
          <div className="h-5 w-12 bg-gray-100 dark:bg-gray-700 rounded shrink-0" />
          <div className="h-5 w-14 bg-gray-100 dark:bg-gray-700 rounded shrink-0" />
          <div className="h-5 w-8 bg-gray-50 dark:bg-gray-700/60 rounded shrink-0" />
          <div className="h-5 w-16 bg-gray-100 dark:bg-gray-700 rounded shrink-0" />
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PANEL
// ═══════════════════════════════════════════════════════════════

interface Props { userId: string; semesterId?: string }

export function TugasSiswaPanel({ userId, semesterId }: Props) {
  const router   = useRouter()
  const semLabel = useActiveSemesterLabel()

  const [tab,             setTab]             = useState<'tugas' | 'nilai' | 'dimensi'>('tugas')
  const [selectedMapelId, setSelectedMapelId] = useState('')
  const [arsipOpen,       setArsipOpen]       = useState(false)

  // ── Tugas list ────────────────────────────────────────────────
  const { data: rawData, isLoading } = useTugasList(
    { isSemesterAktif: true, isPublished: true, limit: 100 },
    { enabled: !!userId },
  )
  const allTugas = useMemo(() => (rawData?.data ?? []) as TugasItem[], [rawData])

  // ── Nilai rekap ───────────────────────────────────────────────
  const { data: nilaiRaw, isLoading: nilaiLoading } = useMyNilaiRekap({ enabled: !!userId })
  const allNilai = useMemo(() => nilaiRaw?.data ?? [], [nilaiRaw])

  // ── Mapel groups (from allTugas — shared sidebar for both tabs) ──
  const mapelGroups = useMemo(() => {
    const map = new Map<string, { id: string; nama: string; items: TugasItem[] }>()
    for (const item of allTugas) {
      const id   = item.mataPelajaranId
      const nama = item.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama ?? 'Lainnya'
      if (!map.has(id)) map.set(id, { id, nama, items: [] })
      map.get(id)!.items.push(item)
    }
    return Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama))
  }, [allTugas])

  // ── Filtered display items ────────────────────────────────────
  const displayTugas = useMemo(() => {
    const items = selectedMapelId
      ? (mapelGroups.find((g) => g.id === selectedMapelId)?.items ?? [])
      : allTugas
    return [...items].sort((a, b) => {
      const now   = Date.now()
      const aPast = new Date(a.tanggalSelesai).getTime() < now
      const bPast = new Date(b.tanggalSelesai).getTime() < now
      if (aPast !== bPast) return aPast ? 1 : -1
      return new Date(a.tanggalSelesai).getTime() - new Date(b.tanggalSelesai).getTime()
    })
  }, [selectedMapelId, mapelGroups, allTugas])

  const displayNilai = useMemo(() => {
    if (!selectedMapelId) return allNilai
    return allNilai.filter((n) => n.mataPelajaranId === selectedMapelId)
  }, [allNilai, selectedMapelId])

  // ── Stats ─────────────────────────────────────────────────────
  const tugasStats = useMemo(() => {
    return allTugas.reduce<Partial<Record<TujuanTugas, number>>>((acc, t) => {
      acc[t.tujuan] = (acc[t.tujuan] ?? 0) + 1
      return acc
    }, {})
  }, [allTugas])

  const nilaiStats = useMemo(() => {
    const total    = allNilai.length
    const dikumpul = allNilai.filter((n) => n.pengumpulan && n.pengumpulan.status !== 'DRAFT').length
    const menunggu = allNilai.filter((n) => n.pengumpulan?.status === 'SUBMITTED').length
    const dinilai  = allNilai.filter((n) => n.pengumpulan?.status === 'DINILAI').length
    const nilaiArr = allNilai
      .filter((n) => n.pengumpulan?.status === 'DINILAI' && n.pengumpulan.nilai !== null)
      .map((n) => n.pengumpulan!.nilai!)
    const rataRata = nilaiArr.length > 0
      ? (nilaiArr.reduce((a, b) => a + b, 0) / nilaiArr.length).toFixed(1)
      : null
    return { total, dikumpul, menunggu, dinilai, rataRata }
  }, [allNilai])

  // ── Sidebar count (tab-aware) ─────────────────────────────────
  const getSidebarCount = (mapelId: string) => {
    if (tab === 'tugas' || tab === 'dimensi') return mapelGroups.find((g) => g.id === mapelId)?.items.length ?? 0
    return allNilai.filter((n) => n.mataPelajaranId === mapelId).length
  }
  const totalCount = tab === 'nilai' ? allNilai.length : allTugas.length

  const showSidebar = !isLoading && mapelGroups.length > 1 && tab !== 'dimensi'

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.push('/dashboard/pembelajaran/siswa')}
            className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center shrink-0 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">Tugas, Nilai dan Dimensi Profil</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{semLabel ?? 'Memuat...'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setArsipOpen(true)}
          title="Arsip Tugas"
          className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center hover:border-gray-300 dark:hover:border-gray-600 transition-colors shrink-0"
        >
          <Archive className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* ── Tab switcher ── */}
      <div
        className="flex border-b border-gray-200 dark:border-gray-800"
        style={{ scrollbarWidth: 'none' } as React.CSSProperties}
      >
        {/* Tugas */}
        <button
          onClick={() => setTab('tugas')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
            tab === 'tugas'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
          )}
        >
          <ClipboardList size={14} />
          Tugas
          {!isLoading && allTugas.length > 0 && (
            <span className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums',
              tab === 'tugas'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
            )}>
              {allTugas.length}
            </span>
          )}
        </button>

        {/* Nilai */}
        <button
          onClick={() => setTab('nilai')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
            tab === 'nilai'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
          )}
        >
          <CheckCircle2 size={14} />
          Nilai
          {!nilaiLoading && nilaiStats.dinilai > 0 && (
            <span className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums',
              tab === 'nilai'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
            )}>
              {nilaiStats.dinilai}
            </span>
          )}
        </button>

        {/* Dimensi Profil */}
        <button
          onClick={() => setTab('dimensi')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
            tab === 'dimensi'
              ? 'border-violet-500 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
          )}
        >
          <Star size={14} />
          Dimensi Profil
        </button>
      </div>

      {/* ── Mini stats (context-aware) ── */}
      {tab === 'tugas' && !isLoading && allTugas.length > 0 && (
        <div
          className="overflow-x-auto -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          <div className="flex gap-2 items-stretch w-max pb-1">
            <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-3.5 py-2 min-w-[56px]">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 tabular-nums">{allTugas.length}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Total</p>
            </div>
            <div className="w-px bg-gray-100 dark:bg-gray-800 self-stretch my-1" />
            {TUJUAN_STAT_CONFIG.map(({ key, label, color }) => {
              const count = tugasStats[key] ?? 0
              if (count === 0) return null
              return (
                <div key={key} className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-3.5 py-2 min-w-[56px]">
                  <p className={`text-sm font-bold tabular-nums ${color}`}>{count}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">{label}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'nilai' && !nilaiLoading && allNilai.length > 0 && (() => {
        const NILAI_STATS = [
          { value: nilaiStats.dikumpul.toString(), label: 'Dikumpul',  color: 'text-blue-600 dark:text-blue-400'    },
          { value: nilaiStats.menunggu.toString(), label: 'Menunggu',  color: 'text-amber-600 dark:text-amber-400'  },
          { value: nilaiStats.dinilai.toString(),  label: 'Dinilai',   color: 'text-emerald-600 dark:text-emerald-400' },
          ...(nilaiStats.rataRata ? [{ value: nilaiStats.rataRata, label: 'Rata-rata', color: 'text-indigo-600 dark:text-indigo-400' }] : []),
        ]
        return (
          <div
            className="overflow-x-auto -mx-4 px-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
          >
            <div className="flex gap-2 items-stretch w-max pb-1">
              <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-3.5 py-2 min-w-[56px]">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 tabular-nums">{nilaiStats.total}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Total</p>
              </div>
              <div className="w-px bg-gray-100 dark:bg-gray-800 self-stretch my-1" />
              {NILAI_STATS.map(({ value, label, color }) => (
                <div key={label} className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-3.5 py-2 min-w-[56px]">
                  <p className={`text-sm font-bold tabular-nums ${color}`}>{value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── Mobile: horizontal mapel pills ── */}
      {showSidebar && (
        <div
          className="flex md:hidden gap-1.5 overflow-x-auto pb-1 -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          <button
            type="button"
            onClick={() => setSelectedMapelId('')}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap',
              !selectedMapelId
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600',
            )}
          >
            Semua ({totalCount})
          </button>
          {mapelGroups.map((group) => {
            const count = getSidebarCount(group.id)
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedMapelId(selectedMapelId === group.id ? '' : group.id)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap',
                  selectedMapelId === group.id
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600',
                )}
              >
                {group.nama} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* ── Two-panel layout ── */}
      <div className="flex gap-5 items-start pb-12">

        {/* Left sidebar — desktop only */}
        {showSidebar && (
          <aside className="hidden md:block w-44 lg:w-48 shrink-0 sticky top-20">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pl-4 mb-2">Mapel</p>
            <nav className="flex flex-col gap-0.5">

              {/* Semua */}
              <button
                type="button"
                onClick={() => setSelectedMapelId('')}
                className={cn(
                  'flex items-center gap-2.5 w-full text-left px-2.5 py-2 rounded-lg transition-all duration-150',
                  !selectedMapelId ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60',
                )}
              >
                <Library className={cn('w-4 h-4 shrink-0', !selectedMapelId ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500')} />
                <span className={cn('flex-1 text-sm truncate', !selectedMapelId ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'font-medium text-gray-500 dark:text-gray-400')}>
                  Semua
                </span>
                <span className={cn('shrink-0 text-[11px] tabular-nums', !selectedMapelId ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-gray-600')}>
                  {totalCount}
                </span>
              </button>

              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

              {/* Per mapel */}
              {mapelGroups.map((group) => {
                const count  = getSidebarCount(group.id)
                const active = selectedMapelId === group.id
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setSelectedMapelId(active ? '' : group.id)}
                    className={cn(
                      'flex items-center gap-2.5 w-full text-left px-2.5 py-2 rounded-lg transition-all duration-150',
                      active ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60',
                    )}
                  >
                    {active
                      ? <BookOpen className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      : <Book    className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" />
                    }
                    <span className={cn('flex-1 text-sm truncate leading-snug', active ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'font-medium text-gray-500 dark:text-gray-400')}>
                      {group.nama}
                    </span>
                    <span className={cn('shrink-0 text-[11px] tabular-nums', active ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-gray-600')}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </nav>
          </aside>
        )}

        {/* Right panel */}
        <div className="flex-1 min-w-0">

          {/* ── Tab: Tugas ── */}
          {tab === 'tugas' && (
            isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : displayTugas.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayTugas.map((item) => (
                  <TugasCard
                    key={item.id}
                    item={item}
                    onClick={() => router.push(`/dashboard/tugas/${item.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-gray-400">
                <p className="text-sm font-medium">Belum ada tugas</p>
                <p className="text-xs mt-1 opacity-70">
                  {selectedMapelId ? 'Belum ada tugas untuk mata pelajaran ini' : 'Tugas semester aktif akan muncul di sini'}
                </p>
                {selectedMapelId && (
                  <button type="button" onClick={() => setSelectedMapelId('')} className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                    Lihat semua
                  </button>
                )}
              </div>
            )
          )}

          {/* ── Tab: Nilai ── */}
          {tab === 'nilai' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3 grid grid-cols-1">
              {nilaiLoading
                ? <SkeletonRows />
                : <NilaiTable items={displayNilai} showMapel={!selectedMapelId} />
              }
            </div>
          )}

        </div>
      </div>

      {/* ── Tab: Dimensi Profil ── */}
      {tab === 'dimensi' && (
        semesterId
          ? <ProfilLulusanSiswa siswaId={userId} semesterId={semesterId} />
          : (
            <div className="py-20 text-center text-gray-400">
              <Star className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Semester aktif tidak ditemukan</p>
              <p className="text-xs mt-1 opacity-70">Data dimensi profil tidak dapat dimuat</p>
            </div>
          )
      )}

      <SiswaTugasArsipSlideOver open={arsipOpen} onClose={() => setArsipOpen(false)} />
    </div>
  )
}
