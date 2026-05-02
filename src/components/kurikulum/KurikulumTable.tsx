'use client'

import { Badge, Button, Skeleton } from '@/components/ui'
import { BookOpen, Edit2, Trash2, CheckCircle, Settings } from 'lucide-react'
import type { Kurikulum } from '@/types/kurikulum.types'

interface KurikulumTableProps {
  data:       Kurikulum[]
  isLoading:  boolean
  onEdit:     (item: Kurikulum) => void
  onActivate: (item: Kurikulum) => void
  onDelete:   (item: Kurikulum) => void
  onFormatBaku: (item: Kurikulum) => void
}

export function KurikulumTable({
  data,
  isLoading,
  onEdit,
  onActivate,
  onDelete,
  onFormatBaku,
}: KurikulumTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <BookOpen className="mx-auto h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">Belum ada kurikulum. Tambahkan kurikulum pertama.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Nama Kurikulum
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Deskripsi
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
            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td className="px-4 py-3">
                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  {item.nama}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                {item.deskripsi ?? <span className="italic text-gray-300">—</span>}
              </td>
              <td className="px-4 py-3">
                {item.isActive ? (
                  <Badge variant="success">Aktif</Badge>
                ) : (
                  <Badge variant="default">Nonaktif</Badge>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Format Baku"
                    onClick={() => onFormatBaku(item)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Edit"
                    onClick={() => onEdit(item)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  {!item.isActive && (
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Aktifkan"
                      onClick={() => onActivate(item)}
                    >
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Hapus"
                    onClick={() => onDelete(item)}
                    disabled={item.isActive}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
