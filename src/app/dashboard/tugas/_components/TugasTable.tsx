
'use client'

import { Pencil, Trash2, Eye }         from 'lucide-react'
import { Pagination, Skeleton }        from '@/components/ui'
import { TujuanBadge, BentukBadge }    from './TugasBadge'
import type { TugasItem }              from '@/types/tugas.types'
import { format }                      from 'date-fns'
import { id as localeId }              from 'date-fns/locale'

interface Props {
  data:         TugasItem[]
  meta:         { total: number; page: number; lastPage?: number; totalPages?: number; limit: number }
  isLoading:    boolean
  page:         number
  showGuru?:    boolean
  onPageChange: (p: number) => void
  onEdit:       (item: TugasItem) => void
  onDelete:     (item: TugasItem) => void
  onSelect:     (item: TugasItem) => void
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      {[1,2,3,4,5].map((i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 rounded w-full" />
        </td>
      ))}
    </tr>
  )
}

export function TugasTable({
  data, meta, isLoading, page, showGuru = false, onPageChange, onEdit, onDelete, onSelect,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm grid grid-cols-1">
        <div className="overflow-x-auto touch-pan-x">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40">
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tugas & Kelas</th>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tujuan</th>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deadline</th>
                <th className="px-3 sm:px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-3 sm:px-4 py-3 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : data.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400 italic">
                      Belum ada tugas yang dibuat
                    </td>
                  </tr>
                )
                : data.map((item) => {
                    const namaKelas = item.kelas?.namaKelas ?? item.mataPelajaran?.kelas?.namaKelas ?? item.kelasId
                    const deadline  = item.tanggalSelesai
                      ? format(new Date(item.tanggalSelesai), 'd MMM yy, HH:mm', { locale: localeId })
                      : '—'
                    const isPassed  = new Date(item.tanggalSelesai) < new Date()

                    return (
                      <tr
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                      >
                        {/* Tugas & Kelas */}
                        <td className="px-3 sm:px-4 py-3">
                          <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[160px] sm:max-w-[240px]">
                            {item.judul}
                          </p>
                          <p className="text-[11px] text-gray-500 flex flex-wrap items-center gap-x-1 mt-0.5">
                            <span className="truncate max-w-[100px] sm:max-w-[150px]">{item.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama ?? 'Mapel'}</span>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{namaKelas}</span>
                            {showGuru && item.guru && (
                              <>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <span className="font-medium text-blue-600 dark:text-blue-400 truncate max-w-[80px]">{item.guru.profile?.namaLengkap}</span>
                              </>
                            )}
                          </p>
                        </td>

                        {/* Tujuan (Bentuk dihapus — hemat kolom di mobile) */}
                        <td className="px-3 sm:px-4 py-3">
                          <TujuanBadge tujuan={item.tujuan} />
                          <div className="mt-1">
                            <BentukBadge bentuk={item.bentuk} />
                          </div>
                        </td>

                        {/* Deadline */}
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                          <p className={`text-xs sm:text-sm font-medium ${isPassed ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {deadline}
                          </p>
                          {isPassed && <p className="text-[10px] text-red-500">Berakhir</p>}
                        </td>

                        {/* Status Publikasi */}
                        <td className="px-3 sm:px-4 py-3 text-center">
                          {item.isPublished ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 whitespace-nowrap">
                              Publik
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              Draft
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="px-3 sm:px-4 py-3">
                          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onSelect(item) }}
                              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              title="Detail"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onEdit(item) }}
                              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onDelete(item) }}
                              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      {((meta?.lastPage ?? meta?.totalPages ?? 0) > 1) && (
        <Pagination
          page={page}
          totalPages={meta.lastPage ?? meta.totalPages ?? 1}
          total={meta.total}
          limit={meta.limit}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}
