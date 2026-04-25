'use client'

import { useState, useMemo, Suspense } from 'react'
import { Search, Users, Calendar, MapPin, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { useActiveSemesterLabel } from '@/hooks/semester/useSemester'
import { useTahunAjaranActive } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useEkskulList, useMyMemberships } from '@/hooks/ekskul/useEkskul'
import { Spinner } from '@/components/ui/Spinner'
import { EkskulDetailSheet } from './_components/EkskulDetailSheet'
import { HARI_LABEL, type HariEnum, type EkskulItem, type StatusAnggotaEkskul } from '@/types/ekskul.types'
import { format } from 'date-fns'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(iso: string) {
  try { return format(new Date(iso), 'HH:mm') } catch { return '' }
}

const HARI_LIST: HariEnum[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']

// ── Status chip ────────────────────────────────────────────────────────────────
function StatusChip({ status }: { status: StatusAnggotaEkskul }) {
  const cfg = {
    AKTIF:    { label: 'Aktif',   cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    NONAKTIF: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    KELUAR:   { label: 'Keluar',  cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800' },
  }[status]
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', cfg.cls)}>
      {cfg.label}
    </span>
  )
}

// ── Ekskul Card ────────────────────────────────────────────────────────────────
function EkskulCard({
  item, myStatus, onClick,
}: {
  item:     EkskulItem
  myStatus?: StatusAnggotaEkskul | null
  onClick:  () => void
}) {
  const anggota = item._count?.anggota ?? 0
  const full    = anggota >= item.kuotaMaksimal

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all"
    >
      {/* Logo/header area */}
      <div className="relative h-20 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 flex items-center justify-center">
        {item.logoUrl ? (
          <img src={item.logoUrl} alt={item.nama}
            className="w-12 h-12 rounded-xl object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center">
            <Star size={20} className="text-emerald-400" />
          </div>
        )}
        {myStatus && (
          <div className="absolute top-2 right-2">
            <StatusChip status={myStatus} />
          </div>
        )}
        {!item.isActive && (
          <div className="absolute inset-0 bg-gray-900/40 rounded-t-2xl flex items-center justify-center">
            <span className="text-xs text-white font-medium bg-gray-900/60 px-2 py-0.5 rounded-full">Tidak Aktif</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        {item.kategori && (
          <span className="text-[10px] text-gray-400">{item.kategori}</span>
        )}
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
          {item.nama}
        </p>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <Calendar size={10} className="shrink-0" />
            {HARI_LABEL[item.jadwalHari]}, {fmtTime(item.jadwalJam)}
          </div>
          {item.tempatKegiatan && (
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              <MapPin size={10} className="shrink-0" />
              <span className="truncate">{item.tempatKegiatan}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-[11px]">
            <Users size={10} className="shrink-0" />
            <span className={cn('tabular-nums', full ? 'text-red-500' : 'text-gray-500')}>
              {anggota} / {item.kuotaMaksimal}
            </span>
            {full && <span className="text-[10px] text-red-500">(Penuh)</span>}
          </div>
        </div>
      </div>
    </button>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function EkskulPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner /></div>}>
      <EkskulContent />
    </Suspense>
  )
}

function EkskulContent() {
  const { user } = useAuthStore()
  const semLabel = useActiveSemesterLabel()

  // ── All hooks must come before any conditional return ──────
  const [search,     setSearch]     = useState('')
  const [hariFilter, setHariFilter] = useState<HariEnum | ''>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: taListRaw = [] } = useTahunAjaranActive()
  const taList  = taListRaw as { id: string; nama: string }[]
  const taAktif = taList[0]

  const isSiswa = user?.role === 'SISWA'

  const { data: listData, isLoading: loadingList } = useEkskulList({
    isActive: true,
    ...(hariFilter ? { jadwalHari: hariFilter } : {}),
    ...(search     ? { search }                 : {}),
    limit: 100,
  })
  const allEkskul = listData?.data ?? []

  const { data: myMemberRaw, isLoading: loadingMy } = useMyMemberships(
    taAktif?.id,
    { enabled: isSiswa },
  )
  const myMemberships = myMemberRaw?.data ?? []

  // Map: ekskulId → status keanggotaan
  const myStatusMap = useMemo(() => {
    const map = new Map<string, StatusAnggotaEkskul>()
    for (const m of myMemberships) {
      map.set(m.ekstrakurikulerId, m.status)
    }
    return map
  }, [myMemberships])

  // Ekskul yang diikuti (AKTIF atau PENDING)
  const myActiveEkskul = useMemo(() =>
    myMemberships.filter((m) => m.status === 'AKTIF' || m.status === 'NONAKTIF'),
    [myMemberships],
  )

  const selectedStatus = selectedId ? myStatusMap.get(selectedId) ?? null : null

  // ── Stats bar ────────────────────────────────────────────
  const myAktif   = myMemberships.filter((m) => m.status === 'AKTIF').length
  const myPending = myMemberships.filter((m) => m.status === 'NONAKTIF').length

  // ── Guard ─────────────────────────────────────────────────
  if (!user) return <div className="flex justify-center py-12"><Spinner /></div>

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">Ekstrakurikuler</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{semLabel ?? 'Memuat...'}</p>
      </div>

      {/* ── Stats bar (siswa) ───────────────────────────────────── */}
      {isSiswa && !loadingMy && myMemberships.length > 0 && (
        <div
          className="overflow-x-auto -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          <div className="flex gap-2 items-stretch w-max pb-1">
            <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2.5 min-w-[64px]">
              <p className="text-sm font-bold tabular-nums text-gray-800 dark:text-gray-200">{myMemberships.length}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Diikuti</p>
            </div>
            {myAktif > 0 && (
              <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/30 rounded-xl px-4 py-2.5 min-w-[64px]">
                <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{myAktif}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Aktif</p>
              </div>
            )}
            {myPending > 0 && (
              <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-amber-100 dark:border-amber-900/30 rounded-xl px-4 py-2.5 min-w-[64px]">
                <p className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">{myPending}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Pending</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Ekskul Saya (siswa) ─────────────────────────────────── */}
      {isSiswa && myActiveEkskul.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Ekskul Saya
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4"
            style={{ scrollbarWidth: 'none' }}>
            {myActiveEkskul.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.ekstrakurikulerId)}
                className="shrink-0 flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors"
              >
                {m.ekstrakurikuler.logoUrl ? (
                  <img src={m.ekstrakurikuler.logoUrl} alt={m.ekstrakurikuler.nama}
                    className="w-8 h-8 rounded-lg object-cover shrink-0 bg-gray-100" />
                ) : (
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                    <Star size={14} className="text-emerald-400" />
                  </span>
                )}
                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                    {m.ekstrakurikuler.nama}
                  </p>
                  <div className="mt-0.5">
                    <StatusChip status={m.status} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Semua Ekskul ───────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Semua Ekskul
        </h2>

        {/* Search + Hari filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="text" placeholder="Cari ekskul..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="overflow-x-auto flex gap-1.5 shrink-0 max-w-[40%]"
            style={{ scrollbarWidth: 'none' }}>
            <button type="button" onClick={() => setHariFilter('')}
              className={cn('shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                hariFilter === ''
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500')}>
              Semua
            </button>
            {HARI_LIST.map((h) => (
              <button key={h} type="button" onClick={() => setHariFilter(h)}
                className={cn('shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  hariFilter === h
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500')}>
                {HARI_LABEL[h].slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loadingList ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : allEkskul.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <Star size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tidak ada ekskul ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {allEkskul.map((item) => (
              <EkskulCard
                key={item.id}
                item={item}
                myStatus={myStatusMap.get(item.id) ?? null}
                onClick={() => setSelectedId(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Detail Sheet ───────────────────────────────────────── */}
      <EkskulDetailSheet
        ekskulId={selectedId}
        onClose={() => setSelectedId(null)}
        myStatus={selectedStatus}
        isSiswa={isSiswa}
      />
    </div>
  )
}
