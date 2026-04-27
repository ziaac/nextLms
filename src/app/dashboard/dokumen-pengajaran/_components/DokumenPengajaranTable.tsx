'use client'

import { Button } from '@/components/ui'
import { FileText, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { DokumenStatusBadge, DokumenJenisBadge } from './DokumenStatusBadge'
import type { DokumenPengajaranItem, DokumenPengajaranMeta } from '@/types/dokumen-pengajaran.types'

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function getNamaMapel(item: DokumenPengajaranItem) {
  return item.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama ?? '—'
}

interface Props {
  data:            DokumenPengajaranItem[]
  meta:            DokumenPengajaranMeta
  isLoading:       boolean
  page:            number
  onPageChange:    (p: number) => void
  onSelect:        (item: DokumenPengajaranItem) => void
  onEdit?:         (item: DokumenPengajaranItem) => void
  onDelete?:       (item: DokumenPengajaranItem) => void
  canEditItem?:    (item: DokumenPengajaranItem) => boolean
  canDeleteItem?:  (item: DokumenPengajaranItem) => boolean
  showGuru:        boolean
}

export function DokumenPengajaranTable({
  data, meta, isLoading, page, onPageChange, onSelect,
  onEdit, onDelete, canEditItem, canDeleteItem, showGuru,
}: Props) {
  if (isLoading) return <TableSkeleton />

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
        <FileText className="h-12 w-12 opacity-30" />
        <p className="text-sm">Tidak ada dokumen pengajaran.</p>
      </div>
    )
  }

  const colClass = showGuru
    ? 'grid-cols-[1.5fr_1.5fr_1fr_120px_110px_auto]'
    : 'grid-cols-[2fr_1fr_120px_110px_auto]'

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        {/* Header */}
        <div className={`grid gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide ${colClass}`}>
          {showGuru && <span>Guru</span>}
          <span>Judul / Mata Pelajaran</span>
          <span>Jenis</span>
          <span className="text-center">Status</span>
          <span className="text-center">Diajukan</span>
          <span />
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.map((item) => {
            const showEdit   = !!(onEdit   && canEditItem?.(item))
            const showDelete = !!(onDelete && canDeleteItem?.(item))

            return (
              <div
                key={item.id}
                className={`grid gap-4 px-5 py-3.5 items-center ${colClass}`}
              >
                {showGuru && (
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {item.guru?.profile?.namaLengkap ?? '—'}
                    </p>
                  </div>
                )}

                {/* Judul & Mapel — klik untuk detail */}
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="min-w-0 text-left hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
                >
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                    {item.judul}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {getNamaMapel(item)}
                    {item.mataPelajaran?.kelas?.namaKelas
                      ? ` · ${item.mataPelajaran.kelas.namaKelas}`
                      : ''}
                    {item.semester?.nama ? ` · ${item.semester.nama}` : ''}
                  </p>
                </button>

                {/* Jenis */}
                <DokumenJenisBadge jenis={item.jenisDokumen} />

                {/* Status */}
                <div className="flex justify-center">
                  <DokumenStatusBadge status={item.status} />
                </div>

                {/* Diajukan */}
                <p className="text-xs text-gray-400 text-center">
                  {formatTanggal(item.createdAt)}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onSelect(item)}>
                    Detail
                  </Button>
                  {showEdit && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onEdit(item) }}
                      title="Edit dokumen"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  {showDelete && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDelete(item) }}
                      title="Hapus dokumen"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pagination */}
      {meta.lastPage > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <p className="text-xs">
            {((page - 1) * meta.limit) + 1}–{Math.min(page * meta.limit, meta.total)} dari {meta.total} data
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs px-2">{page} / {meta.lastPage}</span>
            <Button variant="ghost" size="sm" disabled={page >= meta.lastPage} onClick={() => onPageChange(page + 1)}>
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
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="h-10 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="w-24 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="w-20 h-5 bg-gray-100 dark:bg-gray-700 rounded-full" />
          <div className="w-20 h-5 bg-gray-100 dark:bg-gray-700 rounded-full" />
          <div className="w-16 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="w-20 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
