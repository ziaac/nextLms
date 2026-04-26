'use client'

import { Pencil, Trash2, Eye } from 'lucide-react'
import { Badge, Pagination, Skeleton } from '@/components/ui'
import type { SiswaLulus } from '@/types/pendaftaran.types'
import type { PaginatedResponse } from '@/types'

const JALUR_LABEL: Record<string, string> = {
  ZONASI: 'Zonasi', PRESTASI: 'Prestasi', AFIRMASI: 'Afirmasi',
  PERPINDAHAN: 'Perpindahan', REGULER: 'Reguler',
}

const STATUS_BIODATA_VARIANT: Record<string, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  DRAFT:    'default',
  DIAJUKAN: 'info',
  DITERIMA: 'success',
  DITOLAK:  'danger',
}

const STATUS_BIODATA_LABEL: Record<string, string> = {
  DRAFT: 'Draf', DIAJUKAN: 'Diajukan', DITERIMA: 'Diterima', DITOLAK: 'Ditolak',
}

interface Props {
  data: PaginatedResponse<SiswaLulus> | undefined
  isLoading: boolean
  page: number
  onPageChange: (p: number) => void
  onRowClick: (item: SiswaLulus) => void
  onEdit: (item: SiswaLulus) => void
  onDelete: (item: SiswaLulus) => void
}

export function SiswaLulusTable({ data, isLoading, page, onPageChange, onRowClick, onEdit, onDelete }: Props) {
  const rows = data?.data ?? []

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
              <th className="pb-3 pr-4 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">No. Pendaftaran</th>
              <th className="pb-3 pr-4 font-medium text-gray-500 dark:text-gray-400">Nama Lengkap / NISN</th>
              <th className="pb-3 pr-4 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Jalur</th>
              <th className="pb-3 pr-4 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Status Biodata</th>
              <th className="pb-3 font-medium text-gray-500 dark:text-gray-400 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-3 pr-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-3 pr-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="py-3 pr-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-3 pr-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  </tr>
                ))
              : rows.length === 0
              ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                      Tidak ada data
                    </td>
                  </tr>
                )
              : rows.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onRowClick(item)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {item.noPendaftaran}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{item.nama}</p>
                      {item.biodata?.nisn && (
                        <p className="text-xs text-gray-400 font-mono">{item.biodata.nisn}</p>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {item.jalurPendaftaran
                        ? <Badge variant="info" size="sm">{JALUR_LABEL[item.jalurPendaftaran]}</Badge>
                        : <span className="text-gray-400">-</span>
                      }
                    </td>
                    <td className="py-3 pr-4">
                      {item.biodata
                        ? <Badge variant={STATUS_BIODATA_VARIANT[item.biodata.status]} size="sm">
                            {STATUS_BIODATA_LABEL[item.biodata.status]}
                          </Badge>
                        : <Badge variant="default" size="sm">Belum Isi</Badge>
                      }
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onRowClick(item)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                          title="Detail"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            page={page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            limit={data.meta.limit}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  )
}
