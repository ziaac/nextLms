'use client'

import { useRouter } from 'next/navigation'
import { Eye, CheckCircle2, Clock, Minus } from 'lucide-react'
import { Skeleton, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { getPublicFileUrl } from '@/lib/constants'
import type { GuruLckhSummaryItem } from '@/types/guru-log.types'

interface GuruLckhTableProps {
  data:            GuruLckhSummaryItem[]
  isLoading:       boolean
  selectedIds:     Set<string>
  onToggleSelect:  (guruId: string) => void
  onToggleAll:     () => void
  bulan:           number
  tahun:           number
}

function StatusBadge({ item }: { item: GuruLckhSummaryItem }) {
  if (item.totalHariAktif === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 dark:text-gray-500">
        <Minus className="w-3 h-3" />
        Belum ada aktivitas
      </span>
    )
  }
  if (item.hariPending === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Semua disetujui
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
      <Clock className="w-3.5 h-3.5" />
      {item.hariPending} hari pending
    </span>
  )
}

export function GuruLckhTable({
  data, isLoading, selectedIds, onToggleSelect, onToggleAll, bulan, tahun,
}: GuruLckhTableProps) {
  const router = useRouter()

  const allSelectable = data.filter((g) => g.hariPending > 0)
  const allSelected   = allSelectable.length > 0 && allSelectable.every((g) => selectedIds.has(g.guruId))

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-gray-400">Tidak ada data guru ditemukan.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                disabled={allSelectable.length === 0}
                className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500 disabled:opacity-40"
                aria-label="Pilih semua"
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Guru
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Hari Aktif
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Aktivitas
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Disetujui
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.map((guru) => {
            const isSelected  = selectedIds.has(guru.guruId)
            const isSelectable = guru.hariPending > 0

            return (
              <tr
                key={guru.guruId}
                className={cn(
                  'transition-colors',
                  isSelected
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                    : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/40',
                )}
              >
                {/* Checkbox */}
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(guru.guruId)}
                    disabled={!isSelectable}
                    className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500 disabled:opacity-30"
                    aria-label={`Pilih ${guru.namaLengkap}`}
                  />
                </td>

                {/* Nama Guru */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {guru.fotoUrl ? (
                      <img
                        src={getPublicFileUrl(guru.fotoUrl)}
                        alt={guru.namaLengkap}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {guru.namaLengkap.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {guru.namaLengkap}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {guru.nip && (
                          <span className="text-[11px] text-gray-400">{guru.nip}</span>
                        )}
                        <Badge
                          variant={guru.role === 'WALI_KELAS' ? 'info' : 'default'}
                          size="sm"
                        >
                          {guru.role === 'WALI_KELAS' ? 'Wali Kelas' : 'Guru'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Hari Aktif */}
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {guru.totalHariAktif}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">hari</span>
                </td>

                {/* Total Aktivitas */}
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {guru.totalAktivitas}
                  </span>
                </td>

                {/* Disetujui */}
                <td className="px-4 py-3 text-center">
                  <span className={cn(
                    'text-sm font-semibold',
                    guru.hariDisetujui > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-400',
                  )}>
                    {guru.hariDisetujui}
                  </span>
                  {guru.totalHariAktif > 0 && (
                    <span className="text-xs text-gray-400 ml-1">
                      / {guru.totalHariAktif}
                    </span>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <StatusBadge item={guru} />
                </td>

                {/* Aksi */}
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/dashboard/log-lckh?guruId=${guru.guruId}&bulan=${bulan}&tahun=${tahun}`,
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Lihat
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
