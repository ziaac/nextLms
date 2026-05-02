'use client'

import { Badge, Skeleton, Pagination, Button } from '@/components/ui'
import { FileText, Edit2, Trash2, Send } from 'lucide-react'
import type { RppListItem, StatusRPP } from '@/types/rpp.types'

const STATUS_VARIANT: Record<StatusRPP, 'warning' | 'success'> = {
  DRAFT:     'warning',
  PUBLISHED: 'success',
}

const STATUS_LABEL: Record<StatusRPP, string> = {
  DRAFT:     'Draft',
  PUBLISHED: 'Dipublikasi',
}

interface RppTableProps {
  data:         RppListItem[]
  isLoading:    boolean
  page:         number
  totalPages:   number
  total:        number
  limit:        number
  onPageChange: (page: number) => void
  onEdit:       (item: RppListItem) => void
  onPublish:    (item: RppListItem) => void
  onDelete:     (item: RppListItem) => void
  onOpen:       (item: RppListItem) => void
}

export function RppTable({
  data,
  isLoading,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onEdit,
  onPublish,
  onDelete,
  onOpen,
}: RppTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <FileText className="mx-auto h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">Belum ada RPP. Buat RPP pertama Anda.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Judul / Topik
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Mata Pelajaran
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Semester
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
            {data.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                onClick={() => onOpen(item)}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate max-w-xs">
                    {item.judul}
                  </p>
                  <p className="text-xs text-gray-400 truncate max-w-xs">{item.topik}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {item.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama ?? '—'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {item.semester?.nama ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[item.status]}>
                    {STATUS_LABEL[item.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" title="Edit" onClick={() => onEdit(item)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {item.status === 'DRAFT' && (
                      <Button size="sm" variant="ghost" title="Publish" onClick={() => onPublish(item)}>
                        <Send className="h-4 w-4 text-emerald-500" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" title="Hapus" onClick={() => onDelete(item)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={onPageChange}
      />
    </div>
  )
}
