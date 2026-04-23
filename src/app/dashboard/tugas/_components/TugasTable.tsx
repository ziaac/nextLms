
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
      {[1,2,3,4,5,6].map((i) => (
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
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tugas & Kelas</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tujuan</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bentuk</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deadline</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : data.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400 italic">
                      Belum ada tugas yang dibuat
                    </td>
                  </tr>
                )
                : data.map((item) => {
                    const namaKelas = item.kelas?.namaKelas ?? item.mataPelajaran?.kelas?.namaKelas ?? item.kelasId
                    const deadline  = item.tanggalSelesai
                      ? format(new Date(item.tanggalSelesai), 'd MMM yyyy, HH:mm', { locale: localeId })
                      : '—'
                    const isPassed  = new Date(item.tanggalSelesai) < new Date()

                    return (
                      <tr
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                      >
                        {/* Tugas & Kelas */}
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-[250px]">
                            {item.judul}
                          </p>
                          <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <span className="truncate max-w-[150px]">{item.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama ?? 'Mapel'}</span>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{namaKelas}</span>
                            {showGuru && item.guru && (
                              <>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <span className="font-medium text-blue-600 dark:text-blue-400 truncate max-w-[100px]">{item.guru.profile?.namaLengkap}</span>
                              </>
                            )}
                          </p>
                        </td>

                        {/* Tujuan */}
                        <td className="px-4 py-3">
                          <TujuanBadge tujuan={item.tujuan} />
                        </td>

                        {/* Bentuk */}
                        <td className="px-4 py-3">
                          <BentukBadge bentuk={item.bentuk} />
                        </td>

                        {/* Deadline */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className={`text-sm ${isPassed ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                            {deadline}
                          </p>
                          {isPassed && <p className="text-[10px] text-red-500">Berakhir</p>}
                        </td>

                        {/* Status Publikasi */}
                        <td className="px-4 py-3 text-center">
                          {item.isPublished ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              Draft
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onSelect(item) }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              title="Detail"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onEdit(item) }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onDelete(item) }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={15} />
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
