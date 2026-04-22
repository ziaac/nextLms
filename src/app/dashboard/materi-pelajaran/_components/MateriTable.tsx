'use client'

import { Eye, Clock }              from 'lucide-react'
import { Pagination, Skeleton }    from '@/components/ui'
import { MateriStatusBadge }       from './MateriStatusBadge'
import { MateriTipeBadge }         from './MateriTipeBadge'
import { getStatusMateri }         from '@/types/materi-pelajaran.types'
import type { MateriItem }         from '@/types/materi-pelajaran.types'
import type { MateriListMeta }     from '@/types/materi-pelajaran.types'
import { format }                  from 'date-fns'
import { id as localeId }          from 'date-fns/locale'

interface Props {
  data:        MateriItem[]
  meta:        MateriListMeta
  isLoading:   boolean
  page:        number
  onPageChange: (p: number) => void
  onSelect:    (item: MateriItem) => void
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

export function MateriTable({ data, meta, isLoading, page, onPageChange, onSelect }: Props) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Judul</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mata Pelajaran</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Guru</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tipe</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Publikasi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : data.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400 italic">
                    Tidak ada materi ditemukan
                  </td>
                </tr>
              )
              : data.map((item) => {
                  const status   = getStatusMateri(item)
                  const namaMapel = item.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama ?? (item.mataPelajaran as any)?.masterMapel?.nama ?? (item.mataPelajaran as any)?.nama
                  const namaKelas = item.kelas?.namaKelas ?? item.mataPelajaran?.kelas?.namaKelas
                  const namaGuru  = item.guru?.profile?.namaLengkap
                  const pubAt     = item.tanggalPublikasi
                    ? format(new Date(item.tanggalPublikasi), 'd MMM yyyy, HH:mm', { locale: localeId })
                    : '—'

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelect(item)}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    >
                      {/* Judul */}
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2 min-w-0">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate max-w-[220px]">
                              {item.judul}
                            </p>
                            {item.pertemuanKe && (
                              <p className="text-[10px] text-gray-400">Pertemuan ke-{item.pertemuanKe}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Mata Pelajaran */}
                      <td className="px-4 py-3">
                        <p className="text-gray-800 dark:text-gray-200 truncate max-w-[160px]">
                          {namaMapel ?? '—'}
                        </p>
                        <p className="text-[10px] text-gray-400">{namaKelas ?? '—'}</p>
                      </td>

                      {/* Guru */}
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 truncate max-w-[140px]">
                        {namaGuru ?? '—'}
                      </td>

                      {/* Tipe */}
                      <td className="px-4 py-3">
                        <MateriTipeBadge tipe={item.tipeMateri} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <MateriStatusBadge status={status} />
                      </td>

                      {/* Tanggal Publikasi */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {status !== 'DRAFT' && <Clock size={11} />}
                          {pubAt}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                          <Eye size={10} /> {item.viewCount}
                        </div>
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={meta.limit}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}
