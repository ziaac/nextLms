'use client'

import { Eye, CheckCircle } from 'lucide-react'
import { Button, TableSkeleton } from '@/components/ui'
import { StatusPembayaranBadge } from '@/components/pembayaran/StatusPembayaranBadge'
import { formatCurrency } from '@/lib/utils'
import { formatTanggalLengkap } from '@/lib/helpers/timezone'
import type { Pembayaran } from '@/types/pembayaran.types'

const METODE_LABEL: Record<string, string> = {
  TUNAI: 'Tunai',
  TRANSFER: 'Transfer',
  VIRTUAL_ACCOUNT: 'Virtual Account',
  QRIS: 'QRIS',
  EDC: 'EDC',
  MOBILE_BANKING: 'Mobile Banking',
}

interface PembayaranTableProps {
  data: Pembayaran[]
  isLoading: boolean
  onDetail: (item: Pembayaran) => void
  onVerifikasi: (id: string) => void
}

export function PembayaranTable({
  data,
  isLoading,
  onDetail,
  onVerifikasi,
}: PembayaranTableProps) {
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
              'No. Transaksi',
              'Nama Siswa',
              'Kategori',
              'Jumlah Bayar',
              'Metode',
              'Tanggal Bayar',
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
            const namaSiswa =
              item.tagihan?.siswa?.profile?.namaLengkap ??
              item.creator?.profile?.namaLengkap ?? (
                <span className="text-gray-300 dark:text-gray-600 italic">—</span>
              )

            const namaKategori =
              item.tagihan?.kategoriPembayaran?.nama ?? (
                <span className="text-gray-300 dark:text-gray-600 italic">—</span>
              )

            return (
              <tr
                key={item.id}
                className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors"
              >
                {/* No. Transaksi */}
                <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {item.nomorTransaksi}
                </td>

                {/* Nama Siswa */}
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                  {namaSiswa}
                </td>

                {/* Kategori */}
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {namaKategori}
                </td>

                {/* Jumlah Bayar */}
                <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap font-medium">
                  {formatCurrency(Number(item.jumlahBayar))}
                </td>

                {/* Metode */}
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {METODE_LABEL[item.metodePembayaran] ?? item.metodePembayaran}
                </td>

                {/* Tanggal Bayar */}
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {formatTanggalLengkap(item.tanggalBayar)}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <StatusPembayaranBadge status={item.statusPembayaran} />
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
                    {item.statusPembayaran === 'PENDING' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<CheckCircle size={14} />}
                        onClick={() => onVerifikasi(item.id)}
                        title="Verifikasi"
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      >
                        Verifikasi
                      </Button>
                    )}
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
