'use client'

import { useState, useMemo }         from 'react'
import { useRouter }                 from 'next/navigation'
import { useTugasList }             from '@/hooks/tugas/useTugas'
import { useActiveSemesterLabel }   from '@/hooks/semester/useSemester'
import { PageHeader, Button }       from '@/components/ui'
import {
  Archive, Search, Library, Book, BookOpen,
  Clock, AlertCircle, Award, ArrowLeft,
} from 'lucide-react'
import { cn }                       from '@/lib/utils'
import { format, isPast, isToday, differenceInHours } from 'date-fns'
import { id as localeId }           from 'date-fns/locale'
import type { TugasItem, TujuanTugas } from '@/types/tugas.types'
import { SiswaTugasArsipSlideOver } from './SiswaTugasArsipSlideOver'

// ── Label & warna tujuan ─────────────────────────────────────────────
const TUJUAN_LABEL: Record<TujuanTugas, string> = {
  TUGAS_HARIAN: 'Tugas Harian',
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

// ── Deadline chip ────────────────────────────────────────────────────
function DeadlineChip({ dateStr, allowLate }: { dateStr: string; allowLate: boolean }) {
  const date      = new Date(dateStr)
  const past      = isPast(date)
  const today     = isToday(date)
  const hoursLeft = differenceInHours(date, new Date())

  if (past && !allowLate)
    return (
      <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium whitespace-nowrap">
        <AlertCircle size={10} /> Ditutup
      </span>
    )
  if (past && allowLate)
    return (
      <span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium whitespace-nowrap">
        <Clock size={10} /> Terlambat
      </span>
    )
  if (today || hoursLeft <= 24)
    return (
      <span className="flex items-center gap-1 text-[11px] text-orange-500 font-medium whitespace-nowrap">
        <Clock size={10} /> Hari ini · {format(date, 'HH:mm')}
      </span>
    )
  return (
    <span className="flex items-center gap-1 text-[11px] text-gray-400 whitespace-nowrap">
      <Clock size={10} /> {format(date, 'd MMM yyyy', { locale: localeId })}
    </span>
  )
}

// ── Tugas card — vertical, 2-col friendly ────────────────────────────
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
      {/* Top row: tujuan badge + deadline */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${getTujuanColor(item.tujuan)}`}>
          {TUJUAN_LABEL[item.tujuan]}
        </span>
        <DeadlineChip dateStr={item.tanggalSelesai} allowLate={item.allowLateSubmission} />
      </div>

      {/* Judul */}
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-1.5 text-left">
        {item.judul}
      </h3>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate mb-1">
          {mapelNama}
        </p>
        <div className="flex items-center justify-between gap-2">
          {guruNama ? (
            <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{guruNama}</span>
          ) : <span />}
          <span className="flex items-center gap-1 text-[10px] text-gray-400 shrink-0">
            <Award size={10} /> {item.bobot} poin
          </span>
        </div>
      </div>
    </button>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────
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

// ── Main panel ───────────────────────────────────────────────────────
interface Props {
  userId: string
}

export function TugasSiswaPanel({ userId }: Props) {
  const router   = useRouter()
  const semLabel = useActiveSemesterLabel()

  const [search,          setSearch]          = useState('')
  const [selectedMapelId, setSelectedMapelId] = useState('')
  const [arsipOpen,       setArsipOpen]       = useState(false)

  const { data: rawData, isLoading } = useTugasList(
    { isSemesterAktif: true, isPublished: true, limit: 100 },
    { enabled: !!userId },
  )

  const allTugas = useMemo(() => (rawData?.data ?? []) as TugasItem[], [rawData])

  const mapelGroups = useMemo(() => {
    const map = new Map<string, { id: string; nama: string; items: TugasItem[] }>()
    for (const item of allTugas) {
      const id   = item.mataPelajaran?.mataPelajaranTingkat?.id   ?? '__other__'
      const nama = item.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama ?? 'Lainnya'
      if (!map.has(id)) map.set(id, { id, nama, items: [] })
      map.get(id)!.items.push(item)
    }
    return Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama))
  }, [allTugas])

  const searchQ = search.trim().toLowerCase()

  const displayTugas = useMemo(() => {
    let items = selectedMapelId
      ? (mapelGroups.find((g) => g.id === selectedMapelId)?.items ?? [])
      : allTugas
    if (searchQ) {
      items = items.filter((item) =>
        item.judul.toLowerCase().includes(searchQ) ||
        (item.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama ?? '').toLowerCase().includes(searchQ),
      )
    }
    return [...items].sort((a, b) => {
      const aDate = new Date(a.tanggalSelesai).getTime()
      const bDate = new Date(b.tanggalSelesai).getTime()
      const now   = Date.now()
      const aPast = aDate < now
      const bPast = bDate < now
      if (aPast !== bPast) return aPast ? 1 : -1
      return aDate - bDate
    })
  }, [selectedMapelId, mapelGroups, allTugas, searchQ])

  const filteredMapelGroups = useMemo(() => {
    if (!searchQ) return mapelGroups
    return mapelGroups.filter((group) =>
      group.nama.toLowerCase().includes(searchQ) ||
      group.items.some((item) => item.judul.toLowerCase().includes(searchQ)),
    )
  }, [mapelGroups, searchQ])

  const matchCount = (group: (typeof mapelGroups)[0]) => {
    if (!searchQ) return group.items.length
    return group.items.filter((item) => item.judul.toLowerCase().includes(searchQ)).length
  }

  return (
    <div className="space-y-5">

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
            <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">Tugas</h1>
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

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari tugas atau mata pelajaran..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
        />
      </div>

      {/* Total count */}
      <p className="text-xs text-gray-400 -mt-1">
        {isLoading ? 'Memuat...' : (
          <>
            Menampilkan{' '}
            <span className="font-medium text-gray-600 dark:text-gray-300">{displayTugas.length} tugas</span>
            {selectedMapelId && (
              <> dari <span className="font-medium text-gray-600 dark:text-gray-300">{allTugas.length}</span> total</>
            )}
          </>
        )}
      </p>

      {/* Mobile: horizontal mapel pills */}
      {!isLoading && filteredMapelGroups.length > 1 && (
        <div className="flex md:hidden gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
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
            Semua ({allTugas.length})
          </button>
          {filteredMapelGroups.map((group) => (
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
              {group.nama}{searchQ ? ` (${matchCount(group)})` : ''}
            </button>
          ))}
        </div>
      )}

      {/* Two-panel layout */}
      <div className="flex gap-5 items-start pb-12">

        {/* Left sidebar — desktop only */}
        {!isLoading && filteredMapelGroups.length > 1 && (
          <aside className="hidden md:block w-44 lg:w-48 shrink-0 sticky top-20">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pl-4 mb-2">
              Mapel
            </p>
            <nav className="flex flex-col gap-0.5">
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
                  {allTugas.length}
                </span>
              </button>

              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

              {filteredMapelGroups.map((group) => {
                const count  = matchCount(group)
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

        {/* Right panel — 2-col grid cards */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
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
            <div className="py-24 text-center text-gray-400">
              <p className="font-medium">Belum ada tugas ditemukan</p>
              <p className="text-xs mt-1 opacity-70">
                {searchQ
                  ? 'Coba kata kunci lain atau pilih mata pelajaran berbeda'
                  : selectedMapelId
                    ? 'Belum ada tugas untuk mata pelajaran ini'
                    : 'Tugas semester aktif akan muncul di sini'}
              </p>
              {(searchQ || selectedMapelId) && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setSelectedMapelId('') }}
                  className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Reset filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <SiswaTugasArsipSlideOver
        open={arsipOpen}
        onClose={() => setArsipOpen(false)}
      />
    </div>
  )
}
