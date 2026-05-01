'use client'

import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSemesterOptions, useActiveSemesterLabel } from '@/hooks/semester/useSemester'
import { useRekapSikapSiswa } from '@/hooks/sikap/useSikap'
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox'
import { Spinner } from '@/components/ui/Spinner'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import type { JenisSikap, RiwayatSikapItem } from '@/types/sikap.types'

// ── Sub-components ────────────────────────────────────────────────────────────

function JenisBadge({ jenis, point }: { jenis: JenisSikap; point: number }) {
  const isPos = jenis === 'POSITIF'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
        isPos
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      )}
    >
      {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {isPos ? `+${point}` : `-${Math.abs(point)}`}
    </span>
  )
}

function RiwayatCard({ item }: {
  item:     RiwayatSikapItem
  expanded: boolean
  onToggle: () => void
}) {
  const isPos   = item.masterSikap.jenis === 'POSITIF'
  const dateStr = (() => {
    try {
      return format(new Date(item.tanggal), 'd MMM yyyy', { locale: localeId })
    } catch {
      return item.tanggal
    }
  })()

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 border rounded-xl p-4 transition-all',
        isPos
          ? 'border-emerald-100 dark:border-emerald-900/40'
          : 'border-red-100 dark:border-red-900/40',
      )}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 w-2 h-2 rounded-full shrink-0',
            isPos ? 'bg-emerald-500' : 'bg-red-500',
          )}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">
              {item.masterSikap.nama}
            </span>
            <JenisBadge jenis={item.masterSikap.jenis} point={item.masterSikap.point} />
            {item.masterSikap.kategori && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                {item.masterSikap.kategori}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span>{dateStr}</span>
            {item.lokasi && (
              <>
                <span>·</span>
                <span className="truncate">{item.lokasi}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Semester chip */}
      {item.semester && (
        <p className="mt-2 text-[10px] text-gray-400">
          Semester: {item.semester.nama}
        </p>
      )}
      {/* Guru pencatat */}
      {item.guru?.profile?.namaLengkap && (
        <p className="mt-1 text-[10px] text-gray-400">
          Dicatat oleh: <span className="font-medium">{item.guru.profile.namaLengkap}</span>
        </p>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 mt-0.5 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

interface Props {
  userId: string
}

export function SikapSiswaView({ userId }: Props) {
  const semLabel = useActiveSemesterLabel()

  const { options: semOptionsRaw } = useSemesterOptions()
  const semFilterOptions: ComboboxOption[] = useMemo(() => [
    { value: '', label: 'Semua Semester' },
    ...semOptionsRaw,
  ], [semOptionsRaw])

  const [selectedSemId, setSelectedSemId] = useState<string>('') // '' = semua

  const { data: rekap, isLoading } = useRekapSikapSiswa(userId, selectedSemId || undefined)

  const stats   = rekap?.rekap
  const riwayat = rekap?.riwayat ?? []

  // Net point color
  const netPoint  = stats?.netPoint ?? 0
  const netColor  = netPoint > 0
    ? 'text-emerald-600 dark:text-emerald-400'
    : netPoint < 0
      ? 'text-red-600 dark:text-red-400'
      : 'text-gray-500 dark:text-gray-400'
  const NetIcon = netPoint > 0 ? TrendingUp : netPoint < 0 ? TrendingDown : Minus

  // Filter jenis
  const [jenisFilter, setJenisFilter] = useState<JenisSikap | ''>('')
  const filtered = useMemo(() =>
    jenisFilter ? riwayat.filter((r) => r.masterSikap.jenis === jenisFilter) : riwayat,
    [riwayat, jenisFilter],
  )

  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="space-y-5">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
            Sikap &amp; Disiplin
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {semLabel ?? 'Memuat...'}
          </p>
        </div>

        {/* Semester selector */}
        <div className="w-48 shrink-0">
          <Combobox
            options={semFilterOptions}
            value={selectedSemId}
            onChange={setSelectedSemId}
            size="sm"
          />
        </div>
      </div>

      {/* ── Stats bar ─────────────────────────────────────────── */}
      {!isLoading && stats && (
        <div
          className="overflow-x-auto -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          <div className="flex gap-2 items-stretch w-max pb-1">

            {/* Net Point */}
            <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2.5 min-w-[72px]">
              <div className={cn('flex items-center gap-1', netColor)}>
                <NetIcon size={12} />
                <p className="text-sm font-bold tabular-nums">
                  {netPoint > 0 ? `+${netPoint}` : netPoint}
                </p>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">Net Poin</p>
            </div>

            <div className="w-px bg-gray-100 dark:bg-gray-800 self-stretch my-1" />

            {/* Positif */}
            <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/30 rounded-xl px-4 py-2.5 min-w-[72px]">
              <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {stats.jumlahPositif}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">
                Positif &middot; <span className="text-emerald-600 dark:text-emerald-400">+{stats.totalPointPositif}</span>
              </p>
            </div>

            {/* Negatif */}
            <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900/30 rounded-xl px-4 py-2.5 min-w-[72px]">
              <p className="text-sm font-bold tabular-nums text-red-600 dark:text-red-400">
                {stats.jumlahNegatif}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">
                Negatif &middot; <span className="text-red-600 dark:text-red-400">-{stats.totalPointNegatif}</span>
              </p>
            </div>

            <div className="w-px bg-gray-100 dark:bg-gray-800 self-stretch my-1" />

            {/* Total */}
            <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2.5 min-w-[56px]">
              <p className="text-sm font-bold tabular-nums text-gray-700 dark:text-gray-300">
                {stats.totalCatatan}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">Total</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter Jenis ───────────────────────────────────────── */}
      {!isLoading && riwayat.length > 0 && (
        <div className="flex gap-2">
          {(['', 'POSITIF', 'NEGATIF'] as const).map((j) => (
            <button
              key={j}
              type="button"
              onClick={() => setJenisFilter(j)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                jenisFilter === j
                  ? j === 'POSITIF'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : j === 'NEGATIF'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
              )}
            >
              {j === '' ? `Semua (${riwayat.length})` : j === 'POSITIF' ? `Positif (${stats?.jumlahPositif ?? 0})` : `Negatif (${stats?.jumlahNegatif ?? 0})`}
            </button>
          ))}
        </div>
      )}

      {/* ── Timeline ──────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
            <TrendingUp size={22} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Belum ada catatan</p>
          <p className="text-xs text-gray-400 mt-1">
            {jenisFilter ? `Tidak ada catatan ${jenisFilter.toLowerCase()}` : 'Belum ada catatan sikap yang dicatat'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <RiwayatCard
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
