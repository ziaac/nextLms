'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  PageHeader,
  Button,
  Select,
  Input,
  Pagination,
  ConfirmModal,
  Modal,
} from '@/components/ui'
import { TagihanTable } from '@/components/pembayaran/TagihanTable'
import { TagihanModal } from '@/components/pembayaran/TagihanModal'
import { BulkGenerateModal } from '@/components/pembayaran/BulkGenerateModal'
import { StatusTagihanBadge } from '@/components/pembayaran/StatusTagihanBadge'
import { StatusPembayaranBadge } from '@/components/pembayaran/StatusPembayaranBadge'
import {
  useTagihanList,
  useTagihanDetail,
  useDeleteTagihan,
} from '@/hooks/pembayaran/useTagihan'
import { useKategoriPembayaranList } from '@/hooks/pembayaran/useKategoriPembayaran'
import api from '@/lib/axios'
import { getErrorMessage, formatCurrency, formatDate } from '@/lib/utils'
import type { Tagihan } from '@/types/pembayaran.types'
import type { StatusTagihan } from '@/types/enums'

// ─── Types ────────────────────────────────────────────────────────

interface TahunAjaranItem {
  id: string
  nama: string
}

// ─── Constants ───────────────────────────────────────────────────

const STATUS_OPTIONS: { value: StatusTagihan; label: string }[] = [
  { value: 'BELUM_BAYAR', label: 'Belum Bayar' },
  { value: 'CICILAN', label: 'Cicilan' },
  { value: 'LUNAS', label: 'Lunas' },
  { value: 'TERLAMBAT', label: 'Terlambat' },
]

const BULAN_LABEL: Record<number, string> = {
  1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April',
  5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
  9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember',
}

const LIMIT = 10

// ─── Detail Modal ─────────────────────────────────────────────────

interface TagihanDetailModalProps {
  open: boolean
  onClose: () => void
  tagihanId: string
}

function TagihanDetailModal({ open, onClose, tagihanId }: TagihanDetailModalProps) {
  const { data: tagihan, isLoading } = useTagihanDetail(tagihanId)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detail Tagihan"
      size="xl"
      footer={
        <Button variant="secondary" onClick={onClose} type="button">
          Tutup
        </Button>
      }
    >
      <div className="p-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          </div>
        ) : !tagihan ? (
          <p className="text-center text-sm text-gray-400">Data tidak ditemukan.</p>
        ) : (
          <>
            {/* Info Tagihan */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Informasi Tagihan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label="Nama Siswa" value={tagihan.siswa?.profile?.namaLengkap ?? '—'} />
                <InfoRow label="NISN" value={tagihan.siswa?.profile?.nisn ?? '—'} />
                <InfoRow label="Kategori" value={tagihan.kategoriPembayaran?.nama ?? '—'} />
                <InfoRow label="Tahun Ajaran" value={tagihan.tahunAjaran?.nama ?? '—'} />
                <InfoRow
                  label="Bulan/Tahun"
                  value={`${BULAN_LABEL[tagihan.bulan] ?? tagihan.bulan} ${tagihan.tahun}`}
                />
                <InfoRow
                  label="Jatuh Tempo"
                  value={tagihan.tanggalJatuhTempo ? formatDate(tagihan.tanggalJatuhTempo) : '—'}
                />
                <InfoRow label="Total Tagihan" value={formatCurrency(Number(tagihan.totalTagihan))} />
                <InfoRow label="Total Bayar" value={formatCurrency(Number(tagihan.totalBayar))} />
                <InfoRow
                  label="Sisa Bayar"
                  value={formatCurrency(Number(tagihan.sisaBayar))}
                  valueClassName={Number(tagihan.sisaBayar) > 0 ? 'text-red-600 dark:text-red-400 font-semibold' : undefined}
                />
                {tagihan.diskon && (
                  <InfoRow label="Diskon" value={formatCurrency(Number(tagihan.diskon))} />
                )}
                {tagihan.denda && (
                  <InfoRow label="Denda" value={formatCurrency(Number(tagihan.denda))} />
                )}
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <StatusTagihanBadge status={tagihan.status} />
                </div>
              </div>
            </div>

            {/* Riwayat Pembayaran */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Riwayat Pembayaran
              </h3>
              {!tagihan.pembayaran || tagihan.pembayaran.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                  Belum ada pembayaran.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40">
                        {['No. Transaksi', 'Tanggal', 'Jumlah', 'Metode', 'Status'].map((h) => (
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
                      {tagihan.pembayaran.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {p.nomorTransaksi}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {formatDate(p.tanggalBayar)}
                          </td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white font-medium whitespace-nowrap">
                            {formatCurrency(Number(p.jumlahBayar))}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {p.metodePembayaran}
                          </td>
                          <td className="px-4 py-3">
                            <StatusPembayaranBadge status={p.statusPembayaran} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

function InfoRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-sm font-medium text-gray-900 dark:text-white ${valueClassName ?? ''}`}>
        {value}
      </p>
    </div>
  )
}

// ─── Error Boundary ───────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class TagihanErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Terjadi kesalahan
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {this.state.error?.message ?? 'Silakan muat ulang halaman.'}
          </p>
          <Button onClick={() => this.setState({ hasError: false, error: null })}>
            Coba Lagi
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Main Content ─────────────────────────────────────────────────

function TagihanContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── Modal state ──────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editData, setEditData] = useState<Tagihan | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // ── Filter dari URL ──────────────────────────────────────────
  const statusParam = searchParams.get('status') as StatusTagihan | null
  const tahunAjaranIdParam = searchParams.get('tahunAjaranId') ?? ''
  const kategoriIdParam = searchParams.get('kategoriPembayaranId') ?? ''
  const searchParam = searchParams.get('search') ?? ''
  const pageParam = Number(searchParams.get('page') ?? '1')

  // ── Local search state (debounced ke URL) ────────────────────
  const [searchInput, setSearchInput] = useState(searchParam)

  // Sync searchInput jika URL berubah dari luar
  useEffect(() => {
    setSearchInput(searchParam)
  }, [searchParam])

  // ── Fetch data tagihan ───────────────────────────────────────
  const { data: tagihanResponse, isLoading, error } = useTagihanList({
    page: pageParam,
    limit: LIMIT,
    ...(statusParam ? { status: statusParam } : {}),
    ...(tahunAjaranIdParam ? { tahunAjaranId: tahunAjaranIdParam } : {}),
    ...(kategoriIdParam ? { kategoriPembayaranId: kategoriIdParam } : {}),
    ...(searchParam ? { search: searchParam } : {}),
  })

  // ── Fetch tahun ajaran ───────────────────────────────────────
  const { data: tahunAjaranData } = useQuery({
    queryKey: ['tahun-ajaran'],
    queryFn: () =>
      api.get<TahunAjaranItem[]>('/tahun-ajaran').then((res) => res.data),
  })

  // ── Fetch kategori pembayaran ────────────────────────────────
  const { data: kategoriData } = useKategoriPembayaranList({ isActive: true })

  // ── Mutations ────────────────────────────────────────────────
  const deleteMutation = useDeleteTagihan()

  // ── Error handling ───────────────────────────────────────────
  useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error))
    }
  }, [error])

  // ── URL helpers ──────────────────────────────────────────────
  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      // Reset ke halaman 1 saat filter berubah (kecuali update page itu sendiri)
      if (!('page' in updates)) {
        params.set('page', '1')
      }
      router.push(`?${params.toString()}`)
    },
    [searchParams, router],
  )

  // ── Handlers ─────────────────────────────────────────────────
  const handleStatusChange = useCallback(
    (value: string) => updateParams({ status: value }),
    [updateParams],
  )

  const handleTahunAjaranChange = useCallback(
    (value: string) => updateParams({ tahunAjaranId: value }),
    [updateParams],
  )

  const handleKategoriChange = useCallback(
    (value: string) => updateParams({ kategoriPembayaranId: value }),
    [updateParams],
  )

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        updateParams({ search: searchInput })
      }
    },
    [searchInput, updateParams],
  )

  const handleSearchBlur = useCallback(() => {
    if (searchInput !== searchParam) {
      updateParams({ search: searchInput })
    }
  }, [searchInput, searchParam, updateParams])

  const handlePageChange = useCallback(
    (page: number) => updateParams({ page: String(page) }),
    [updateParams],
  )

  const handleDetail = useCallback((item: Tagihan) => {
    setDetailId(item.id)
  }, [])

  const handleEdit = useCallback((item: Tagihan) => {
    setEditData(item)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Tagihan berhasil dihapus')
      setDeleteId(null)
    } catch (err) {
      toast.error(getErrorMessage(err))
      setDeleteId(null)
    }
  }, [deleteId, deleteMutation])

  // ── Derived data ─────────────────────────────────────────────
  const tagihanList = tagihanResponse?.data ?? []
  const meta = tagihanResponse?.meta

  const tahunAjaranOptions =
    tahunAjaranData?.map((t) => ({ value: t.id, label: t.nama })) ?? []

  const kategoriOptions =
    kategoriData?.data?.map((k) => ({ value: k.id, label: k.nama })) ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Tagihan"
        description={meta ? `Total ${meta.total} tagihan` : undefined}
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<Zap size={16} />}
              onClick={() => setBulkOpen(true)}
            >
              Bulk Generate
            </Button>
            <Button leftIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
              Buat Tagihan
            </Button>
          </>
        }
      />

      {/* Filter Panel */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status */}
          <Select
            label="Status Tagihan"
            placeholder="Semua Status"
            value={statusParam ?? ''}
            onChange={(e) => handleStatusChange(e.target.value)}
            options={STATUS_OPTIONS}
          />

          {/* Tahun Ajaran */}
          <Select
            label="Tahun Ajaran"
            placeholder="Semua Tahun Ajaran"
            value={tahunAjaranIdParam}
            onChange={(e) => handleTahunAjaranChange(e.target.value)}
            options={tahunAjaranOptions}
          />

          {/* Kategori Pembayaran */}
          <Select
            label="Kategori Pembayaran"
            placeholder="Semua Kategori"
            value={kategoriIdParam}
            onChange={(e) => handleKategoriChange(e.target.value)}
            options={kategoriOptions}
          />

          {/* Search */}
          <Input
            label="Cari Siswa"
            placeholder="Nama atau NISN..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={handleSearchBlur}
          />
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-6">
        <TagihanTable
          data={tagihanList}
          isLoading={isLoading}
          onDetail={handleDetail}
          onEdit={handleEdit}
          onDelete={(id) => setDeleteId(id)}
        />

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Modal Buat Tagihan */}
      <TagihanModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Modal Edit Tagihan */}
      <TagihanModal
        open={!!editData}
        onClose={() => setEditData(null)}
        initialData={editData ?? undefined}
      />

      {/* Modal Bulk Generate */}
      <BulkGenerateModal open={bulkOpen} onClose={() => setBulkOpen(false)} />

      {/* Modal Detail Tagihan */}
      {detailId && (
        <TagihanDetailModal
          open={!!detailId}
          onClose={() => setDetailId(null)}
          tagihanId={detailId}
        />
      )}

      {/* Konfirmasi Hapus */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Tagihan"
        description="Apakah Anda yakin ingin menghapus tagihan ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  )
}

// ─── Page Export ──────────────────────────────────────────────────

import React from 'react'

export default function TagihanPage() {
  return (
    <TagihanErrorBoundary>
      <Suspense fallback={<div className="flex justify-center py-12">Loading...</div>}>
        <TagihanContent />
      </Suspense>
    </TagihanErrorBoundary>
  )
}
