'use client'

import { useState } from 'react'
import { Input, Select, Skeleton } from '@/components/ui'
import { useRekapPembayaran } from '@/hooks/pembayaran/usePembayaran'
import { formatCurrency } from '@/lib/utils'
import { formatTanggalLengkap } from '@/lib/helpers/timezone'
import type { MetodePembayaran } from '@/types/enums'
import type { RekapQueryDto } from '@/types/pembayaran.types'

// ─── Helpers ──────────────────────────────────────────────────────

function getAwalBulanIni(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

function getHariIni(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ─── Constants ────────────────────────────────────────────────────

const METODE_OPTIONS: { value: string; label: string }[] = [
  { value: 'TUNAI', label: 'Tunai' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'VIRTUAL_ACCOUNT', label: 'Virtual Account' },
  { value: 'QRIS', label: 'QRIS' },
  { value: 'EDC', label: 'EDC' },
  { value: 'MOBILE_BANKING', label: 'Mobile Banking' },
]

const METODE_LABEL: Record<string, string> = {
  TUNAI: 'Tunai',
  TRANSFER: 'Transfer',
  VIRTUAL_ACCOUNT: 'Virtual Account',
  QRIS: 'QRIS',
  EDC: 'EDC',
  MOBILE_BANKING: 'Mobile Banking',
}

// ─── Component ────────────────────────────────────────────────────

export function RekapKeuangan() {
  const [tanggalMulai, setTanggalMulai] = useState<string>(getAwalBulanIni())
  const [tanggalSelesai, setTanggalSelesai] = useState<string>(getHariIni())
  const [metodePembayaran, setMetodePembayaran] = useState<string>('')

  const query: RekapQueryDto = {
    tanggalMulai,
    tanggalSelesai,
    ...(metodePembayaran ? { metodePembayaran: metodePembayaran as MetodePembayaran } : {}),
  }

  const { data, isLoading } = useRekapPembayaran(query)

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Filter Periode
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Tanggal Mulai"
            type="date"
            value={tanggalMulai}
            onChange={(e) => setTanggalMulai(e.target.value)}
          />
          <Input
            label="Tanggal Selesai"
            type="date"
            value={tanggalSelesai}
            onChange={(e) => setTanggalSelesai(e.target.value)}
          />
          <Select
            label="Metode Pembayaran"
            placeholder="Semua Metode"
            options={METODE_OPTIONS}
            value={metodePembayaran}
            onChange={(e) => setMetodePembayaran(e.target.value)}
          />
        </div>
      </div>

      {/* Ringkasan */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-48" />
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Kartu Ringkasan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Transaksi */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                Total Transaksi
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {data.jumlahTransaksi.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {formatTanggalLengkap(tanggalMulai + 'T00:00:00')} —{' '}
                {formatTanggalLengkap(tanggalSelesai + 'T23:59:59')}
              </p>
            </div>

            {/* Total Terkumpul */}
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/20 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                Total Terkumpul
              </p>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(data.totalTerkumpul)}
              </p>
              <p className="text-xs text-emerald-500 dark:text-emerald-500 mt-2">
                Dari semua metode pembayaran
              </p>
            </div>
          </div>

          {/* Breakdown per Metode */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Breakdown per Metode Pembayaran
            </h3>

            {Object.keys(data.perMetode).length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                Tidak ada data untuk periode ini
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      {['Metode', 'Jumlah Transaksi', 'Total'].map((h) => (
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
                    {Object.entries(data.perMetode).map(([metode, info]) => (
                      <tr
                        key={metode}
                        className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                          {METODE_LABEL[metode] ?? metode}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {info.count.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(info.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 py-16 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Pilih periode untuk melihat rekap keuangan
          </p>
        </div>
      )}
    </div>
  )
}
