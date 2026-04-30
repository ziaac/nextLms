'use client'

import { Eye, Pencil, Trash2 } from 'lucide-react'
import { Button, TableSkeleton } from '@/components/ui'
import { StatusTagihanBadge } from '@/components/pembayaran/StatusTagihanBadge'
import { formatCurrency } from '@/lib/utils'
import type { Tagihan } from '@/types/pembayaran.types'

const BULAN_LABEL: Record<number, string> = {
  1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr',
  5: 'Mei', 6: 'Jun', 7: 'Jul', 8: 'Agu',
  9: 'Sep', 10: 'Okt', 11: 'Nov', 12: 'Des',
}

interface TagihanTableProps {
  data: Tagihan[]
  isLoading: boolean
  onDetail: (item: Tagihan) => void
  onEdit: (item: Tagihan) => void
  onDelete: (id: string) => void
}

export function TagihanTable({
  data,
  isLoading,
  onDetail,
  onEdit,
  onDelete,
}: TagihanTableProps) {
  if (isLoading) return <TableSkeleton rows={5} cols={8} />

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
            {[
              'Nama Siswa',
              'Kategori',
              'Bulan/Tahun',
              'Total Tagihan',
              'Total Bayar',
              'Sisa Bayar',
              'Status',
              'Aksi',
            ].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/40">
          {data.map((item) => {
            const isLunas = item.status === 'LUNAS'
            return (
              <tr
                key={item.id}
                className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors"
              >
                {/* Nama Siswa */}
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                  {item.siswa?.profile?.namaLengkap ?? (
                    <span className="text-gray-300 dark:text-gray-600 italic">—</span>
                  )}
                </td>

                {/* Kategori */}
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {item.kategoriPembayaran?.nama ?? (
                    <span className="text-gray-300 dark:text-gray-600 italic">—</span>
                  )}
                </td>

                {/* Bulan/Tahun */}
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {BULAN_LABEL[item.bulan] ?? item.bulan}/{item.tahun}
                </td>

                {/* Total Tagihan */}
                <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap font-medium">
                  {formatCurrency(Number(item.totalTagihan))}
                </td>

                {/* Total Bayar */}
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {formatCurrency(Number(item.totalBayar))}
                </td>

                {/* Sisa Bayar */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={
                      Number(item.sisaBayar) > 0
                        ? 'text-red-600 dark:text-red-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300'
                    }
                  >
                    {formatCurrency(Number(item.sisaBayar))}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <StatusTagihanBadge status={item.status} />
                </td>

                {/* Aksi */}
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Eye size={14} />}
                      onClick={() => onDetail(item)}
                      title="Detail"
                    >
                      Detail
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Pencil size={14} />}
                      onClick={() => onEdit(item)}
                      title="Edit"
                      disabled={isLunas}
                    >
                      Edit
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
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
