'use client'

import { Skeleton, Pagination, Button } from '@/components/ui'
import { Sparkles, Trash2, Eye, RefreshCw } from 'lucide-react'
import { DraftStatusBadge } from './DraftStatusBadge'
import type { DraftAIListItem, JenisKontenAI } from '@/types/ai-generator.types'

const JENIS_LABEL: Record<JenisKontenAI, string> = {
  RPP:              'RPP',
  MATERI_PELAJARAN: 'Materi',
  TUGAS:            'Tugas',
}

interface Props {
  data:         DraftAIListItem[]
  isLoading:    boolean
  page:         number
  totalPages:   number
  total:        number
  limit:        number
  onPageChange: (page: number) => void
  onOpen:       (item: DraftAIListItem) => void
  onRetry:      (item: DraftAIListItem) => void
  onDelete:     (item: DraftAIListItem) => void
}

export function DraftRiwayatTable({
  data, isLoading, page, totalPages, total, limit, onPageChange, onOpen, onRetry, onDelete,
}: Props) {
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
        <Sparkles className="mx-auto h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">Belum ada riwayat draft AI.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Judul / Topik</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jenis</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate max-w-xs">{item.judul}</p>
                  <p className="text-xs text-gray-400 truncate max-w-xs">{item.topik}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {JENIS_LABEL[item.jenisKonten]}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {item.provider ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <DraftStatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleString('id-ID', {
                    day:   '2-digit',
                    month: 'short',
                    year:  'numeric',
                    hour:  '2-digit',
                    minute:'2-digit',
                  })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {item.status === 'COMPLETED' && (
                      <Button size="sm" variant="ghost" title="Buka" onClick={() => onOpen(item)}>
                        <Eye className="h-4 w-4 text-emerald-500" />
                      </Button>
                    )}
                    {item.status === 'FAILED' && (
                      <Button size="sm" variant="ghost" title="Ulangi dengan provider lain" onClick={() => onRetry(item)}>
                        <RefreshCw className="h-4 w-4 text-amber-500" />
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
