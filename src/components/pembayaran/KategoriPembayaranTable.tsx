'use client'

import { Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button, Badge, TableSkeleton } from '@/components/ui'
import type { KategoriPembayaran } from '@/types/pembayaran.types'

interface KategoriPembayaranTableProps {
  data: KategoriPembayaran[]
  isLoading: boolean
  onEdit: (item: KategoriPembayaran) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
}

export function KategoriPembayaranTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  onToggle,
}: KategoriPembayaranTableProps) {
  if (isLoading) return <TableSkeleton rows={5} cols={7} />

  if (!data.length) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 py-16 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">Tidak ada data</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40">
            {['Kode', 'Nama', 'Deskripsi', 'Berulang', 'Wajib', 'Status', 'Aksi'].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/40">
          {data.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors"
            >
              <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700 dark:text-gray-300">
                {item.kode}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                {item.nama}
              </td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                {item.deskripsi ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
              </td>
              <td className="px-4 py-3">
                <Badge variant={item.isRecurring ? 'info' : 'default'}>
                  {item.isRecurring ? 'Ya' : 'Tidak'}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant={item.isMandatory ? 'warning' : 'default'}>
                  {item.isMandatory ? 'Ya' : 'Tidak'}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant={item.isActive ? 'success' : 'default'}>
                  {item.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Pencil size={14} />}
                    onClick={() => onEdit(item)}
                    title="Edit"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={
                      item.isActive
                        ? <ToggleRight size={14} className="text-emerald-500" />
                        : <ToggleLeft size={14} className="text-gray-400" />
                    }
                    onClick={() => onToggle(item.id)}
                    title={item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    className={
                      item.isActive
                        ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  >
                    {item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 size={14} />}
                    onClick={() => onDelete(item.id)}
                    title="Hapus"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    Hapus
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
