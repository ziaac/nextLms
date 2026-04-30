'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Select, Skeleton } from '@/components/ui'
import { useRekapKelas } from '@/hooks/pembayaran/useTagihan'
import { useKategoriPembayaranList } from '@/hooks/pembayaran/useKategoriPembayaran'
import { formatCurrency } from '@/lib/utils'
import api from '@/lib/axios'
import type { TahunAjaran } from '@/types/tahun-ajaran.types'
import type { Kelas } from '@/types/kelas.types'
import type { KategoriPembayaran, RekapKelasResponse, QueryRekapKelasDto } from '@/types/pembayaran.types'
import type { PaginatedResponse } from '@/types/api.types'

// ─── Component ────────────────────────────────────────────────────

export function RekapTagihanKelas() {
  const [tahunAjaranId, setTahunAjaranId] = useState<string>('')
  const [kategoriPembayaranId, setKategoriPembayaranId] = useState<string>('')
  const [kelasId, setKelasId] = useState<string>('')

  // ── Fetch Tahun Ajaran ──────────────────────────────────────────
  const { data: tahunAjaranData, isLoading: loadingTahunAjaran } = useQuery<TahunAjaran[]>({
    queryKey: ['tahun-ajaran'],
    queryFn: async () => {
      const res = await api.get<TahunAjaran[]>('/tahun-ajaran')
      return res.data
    },
  })

  // ── Fetch Kategori Pembayaran ───────────────────────────────────
  const { data: kategoriData, isLoading: loadingKategori } = useKategoriPembayaranList()
  const kategoriList: KategoriPembayaran[] = (kategoriData as PaginatedResponse<KategoriPembayaran> | undefined)?.data ?? []

  // ── Fetch Kelas ─────────────────────────────────────────────────
  const { data: kelasData, isLoading: loadingKelas } = useQuery<Kelas[]>({
    queryKey: ['kelas'],
    queryFn: async () => {
      const res = await api.get<Kelas[]>('/kelas')
      return res.data
    },
  })

  // ── Rekap Kelas ─────────────────────────────────────────────────
  const params: QueryRekapKelasDto = {
    tahunAjaranId,
    ...(kategoriPembayaranId ? { kategoriPembayaranId } : {}),
    ...(kelasId ? { kelasId } : {}),
  }

  const { data: rekapData, isLoading: loadingRekap } = useRekapKelas(params)

  // ── Options ─────────────────────────────────────────────────────
  const tahunAjaranOptions = (tahunAjaranData ?? []).map((ta) => ({
    value: ta.id,
    label: ta.nama,
  }))

  const kategoriOptions = kategoriList.map((k) => ({
    value: k.id,
    label: k.nama,
  }))

  const kelasOptions = (kelasData ?? []).map((k) => ({
    value: k.id,
    label: k.namaKelas,
  }))

  const isFilterLoading = loadingTahunAjaran || loadingKategori || loadingKelas

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Filter Rekap Kelas
        </h3>

        {isFilterLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Tahun Ajaran *"
              placeholder="Pilih Tahun Ajaran"
              options={tahunAjaranOptions}
              value={tahunAjaranId}
              onChange={(e) => setTahunAjaranId(e.target.value)}
            />
            <Select
              label="Kategori Pembayaran"
              placeholder="Semua Kategori"
              options={kategoriOptions}
              value={kategoriPembayaranId}
              onChange={(e) => setKategoriPembayaranId(e.target.value)}
            />
            <Select
              label="Kelas"
              placeholder="Semua Kelas"
              options={kelasOptions}
              value={kelasId}
              onChange={(e) => setKelasId(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Tabel Rekap */}
      {!tahunAjaranId ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 py-16 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Pilih tahun ajaran untuk melihat rekap tagihan per kelas
          </p>
        </div>
      ) : loadingRekap ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-10 flex-1" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <RekapKelasTable data={rekapData ?? []} />
      )}
    </div>
  )
}

// ─── Sub-component: Tabel ─────────────────────────────────────────

interface RekapKelasTableProps {
  data: RekapKelasResponse[]
}

function RekapKelasTable({ data }: RekapKelasTableProps) {
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
              'Nama Kelas',
              'Total Tagihan',
              'Total Terkumpul',
              'Jumlah Siswa',
              'Jumlah Lunas',
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
          {data.map((item) => (
            <tr
              key={item.kelasId}
              className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors"
            >
              {/* Nama Kelas */}
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                {item.namaKelas}
              </td>

              {/* Total Tagihan */}
              <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap font-medium">
                {formatCurrency(item.totalTagihan)}
              </td>

              {/* Total Terkumpul */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(item.totalTerkumpul)}
                </span>
              </td>

              {/* Jumlah Siswa */}
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {item.jumlahSiswa.toLocaleString('id-ID')}
              </td>

              {/* Jumlah Lunas */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={
                    item.jumlahLunas === item.jumlahSiswa && item.jumlahSiswa > 0
                      ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300'
                  }
                >
                  {item.jumlahLunas.toLocaleString('id-ID')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
