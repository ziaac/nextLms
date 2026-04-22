'use client'

import { Button } from '@/components/ui'
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { PerizinanStatusBadge, PerizinanJenisBadge } from './PerizinanStatusBadge'
import type { PerizinanItem, PerizinanMeta } from '@/types/perizinan.types'

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

interface Props {
  data:      PerizinanItem[]
  meta:      PerizinanMeta
  isLoading: boolean
  page:      number
  onPageChange: (p: number) => void
  onSelect:     (item: PerizinanItem) => void
  showNama:     boolean   // false jika siswa (tidak perlu kolom nama)
}

export function PerizinanTable({
  data, meta, isLoading, page, onPageChange, onSelect, showNama,
}: Props) {
  if (isLoading) return <TableSkeleton />

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
        <FileText className="h-12 w-12 opacity-30" />
        <p className="text-sm">Tidak ada data perizinan.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
        {/* Header */}
        <div className={[
          'grid gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
          'text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide',
          showNama
            ? 'grid-cols-[1.5fr_1fr_1fr_120px_100px_80px]'
            : 'grid-cols-[2fr_1fr_120px_100px_80px]',
        ].join(' ')}>
          {showNama && <span>Siswa</span>}
          <span>Tanggal</span>
          <span>Jenis</span>
          <span className="text-center">Status</span>
          <span className="text-center">Diajukan</span>
          <span />
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className={[
                'grid gap-4 px-5 py-3.5 items-center cursor-pointer',
                'hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10 transition-colors',
                showNama
                  ? 'grid-cols-[1.5fr_1fr_1fr_120px_100px_80px]'
                  : 'grid-cols-[2fr_1fr_120px_100px_80px]',
              ].join(' ')}
            >
              {showNama && (
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {item.user?.profile?.namaLengkap ?? '—'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {item.user?.profile?.nisn ?? ''}
                  </p>
                </div>
              )}

              {/* Tanggal */}
              <div className="min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {formatTanggal(item.tanggalMulai)}
                </p>
                {item.tanggalMulai !== item.tanggalSelesai && (
                  <p className="text-xs text-gray-400">
                    s/d {formatTanggal(item.tanggalSelesai)}
                  </p>
                )}
              </div>

              {/* Jenis */}
              <PerizinanJenisBadge jenis={item.jenis} />

              {/* Status */}
              <div className="flex justify-center">
                <PerizinanStatusBadge status={item.status} />
              </div>

              {/* Diajukan */}
              <p className="text-xs text-gray-400 text-center">
                {formatTanggal(item.createdAt)}
              </p>

              {/* Detail */}
              <div className="flex justify-end">
                <Button variant="ghost" size="sm">
                  Detail
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {meta.lastPage > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <p className="text-xs">
            {((page - 1) * meta.limit) + 1}–{Math.min(page * meta.limit, meta.total)} dari {meta.total} data
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs px-2">
              {page} / {meta.lastPage}
            </span>
            <Button
              variant="ghost" size="sm"
              disabled={page >= meta.lastPage}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
      <div className="h-10 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="w-24 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="w-20 h-5 bg-gray-100 dark:bg-gray-700 rounded-full" />
          <div className="w-20 h-5 bg-gray-100 dark:bg-gray-700 rounded-full" />
          <div className="w-16 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="w-14 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
