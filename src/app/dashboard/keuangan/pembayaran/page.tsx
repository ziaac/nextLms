'use client'

import React, { useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  PageHeader,
  Button,
  Select,
  Input,
  Pagination,
  Modal,
} from '@/components/ui'
import { PembayaranTable } from '@/components/pembayaran/PembayaranTable'
import { PembayaranModal } from '@/components/pembayaran/PembayaranModal'
import { VerifikasiModal } from '@/components/pembayaran/VerifikasiModal'
import { StatusPembayaranBadge } from '@/components/pembayaran/StatusPembayaranBadge'
import {
  usePembayaranList,
  usePembayaranDetail,
} from '@/hooks/pembayaran/usePembayaran'
import { getErrorMessage, formatCurrency, formatDate } from '@/lib/utils'
import type { Pembayaran } from '@/types/pembayaran.types'
import type { StatusPembayaran, MetodePembayaran } from '@/types/enums'

// ─── Constants ────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: StatusPembayaran; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'VERIFIED', label: 'Terverifikasi' },
  { value: 'REJECTED', label: 'Ditolak' },
]

const METODE_OPTIONS: { value: MetodePembayaran; label: string }[] = [
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

const LIMIT = 10

// ─── InfoRow Helper ───────────────────────────────────────────────

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

// ─── Detail Modal ─────────────────────────────────────────────────

interface PembayaranDetailModalProps {
  open: boolean
  onClose: () => void
  pembayaranId: string
}

function PembayaranDetailModal({
  open,
  onClose,
  pembayaranId,
}: PembayaranDetailModalProps) {
  const { data: pembayaran, isLoading } = usePembayaranDetail(pembayaranId)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detail Pembayaran"
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
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : !pembayaran ? (
          <p className="text-center text-sm text-gray-400">Data tidak ditemukan.</p>
        ) : (
          <>
            {/* Info Pembayaran */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Informasi Pembayaran
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow
                  label="Nomor Transaksi"
                  value={pembayaran.nomorTransaksi}
                />
                <InfoRow
                  label="Nama Siswa"
                  value={
                    pembayaran.tagihan?.siswa?.profile?.namaLengkap ?? '—'
                  }
                />
                <InfoRow
                  label="NISN"
                  value={
                    pembayaran.tagihan?.siswa?.profile?.nisn ?? '—'
                  }
                />
                <InfoRow
                  label="Kategori"
                  value={
                    pembayaran.tagihan?.kategoriPembayaran?.nama ?? '—'
                  }
                />
                <InfoRow
                  label="Jumlah Bayar"
                  value={formatCurrency(Number(pembayaran.jumlahBayar))}
                />
                <InfoRow
                  label="Metode Pembayaran"
                  value={
                    METODE_LABEL[pembayaran.metodePembayaran] ??
                    pembayaran.metodePembayaran
                  }
                />
                <InfoRow
                  label="Tanggal Bayar"
                  value={formatDate(pembayaran.tanggalBayar)}
                />
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <StatusPembayaranBadge status={pembayaran.statusPembayaran} />
                </div>
                {pembayaran.referensiBank && (
                  <InfoRow
                    label="Referensi Bank"
                    value={pembayaran.referensiBank}
                  />
                )}
                {pembayaran.catatanKasir && (
                  <InfoRow
                    label="Catatan Kasir"
                    value={pembayaran.catatanKasir}
                  />
                )}
                {pembayaran.buktiBayarUrl && (
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Bukti Bayar
                    </p>
                    <a
                      href={pembayaran.buktiBayarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      {pembayaran.buktiBayarUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Info Tagihan Terkait */}
            {pembayaran.tagihan && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Informasi Tagihan Terkait
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow
                    label="Total Tagihan"
                    value={formatCurrency(
                      Number(pembayaran.tagihan.totalTagihan),
                    )}
                  />
                  <InfoRow
                    label="Total Bayar"
                    value={formatCurrency(
                      Number(pembayaran.tagihan.totalBayar),
                    )}
                  />
                  <InfoRow
                    label="Sisa Bayar"
                    value={formatCurrency(
                      Number(pembayaran.tagihan.sisaBayar),
                    )}
                    valueClassName={
                      Number(pembayaran.tagihan.sisaBayar) > 0
                        ? 'text-red-600 dark:text-red-400 font-semibold'
                        : undefined
                    }
                  />
                  {pembayaran.tagihan.tanggalJatuhTempo && (
                    <InfoRow
                      label="Jatuh Tempo"
                      value={formatDate(pembayaran.tagihan.tanggalJatuhTempo)}
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}

// ─── Error Boundary ───────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class PembayaranErrorBoundary extends React.Component<
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
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Coba Lagi
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Main Content ─────────────────────────────────────────────────

function PembayaranContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── Modal state ──────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [verifikasiId, setVerifikasiId] = useState<string | null>(null)

  // ── Filter dari URL ──────────────────────────────────────────
  const statusParam = searchParams.get('status') as StatusPembayaran | null
  const metodeParam = searchParams.get('metodePembayaran') as MetodePembayaran | null
  const tanggalMulaiParam = searchParams.get('tanggalMulai') ?? ''
  const tanggalSelesaiParam = searchParams.get('tanggalSelesai') ?? ''
  const searchParam = searchParams.get('search') ?? ''
  const pageParam = Number(searchParams.get('page') ?? '1')

  // ── Local search state (debounced ke URL) ────────────────────
  const [searchInput, setSearchInput] = useState(searchParam)

  // Sync searchInput jika URL berubah dari luar
  useEffect(() => {
    setSearchInput(searchParam)
  }, [searchParam])

  // ── Fetch data pembayaran ────────────────────────────────────
  const { data: pembayaranResponse, isLoading, error } = usePembayaranList({
    page: pageParam,
    limit: LIMIT,
    ...(statusParam ? { statusPembayaran: statusParam } : {}),
    ...(metodeParam ? { metodePembayaran: metodeParam } : {}),
    ...(tanggalMulaiParam ? { tanggalMulai: tanggalMulaiParam } : {}),
    ...(tanggalSelesaiParam ? { tanggalSelesai: tanggalSelesaiParam } : {}),
  })

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

  const handleMetodeChange = useCallback(
    (value: string) => updateParams({ metodePembayaran: value }),
    [updateParams],
  )

  const handleTanggalMulaiChange = useCallback(
    (value: string) => updateParams({ tanggalMulai: value }),
    [updateParams],
  )

  const handleTanggalSelesaiChange = useCallback(
    (value: string) => updateParams({ tanggalSelesai: value }),
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

  const handleDetail = useCallback((item: Pembayaran) => {
    setDetailId(item.id)
  }, [])

  const handleVerifikasi = useCallback((id: string) => {
    setVerifikasiId(id)
  }, [])

  // ── Derived data ─────────────────────────────────────────────
  const pembayaranList = pembayaranResponse?.data ?? []
  const meta = pembayaranResponse?.meta

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pembayaran"
        description={meta ? `Total ${meta.total} pembayaran` : undefined}
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Input Pembayaran
          </Button>
        }
      />

      {/* Filter Panel */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Status Pembayaran */}
          <Select
            label="Status Pembayaran"
            placeholder="Semua Status"
            value={statusParam ?? ''}
            onChange={(e) => handleStatusChange(e.target.value)}
            options={STATUS_OPTIONS}
          />

          {/* Metode Pembayaran */}
          <Select
            label="Metode Pembayaran"
            placeholder="Semua Metode"
            value={metodeParam ?? ''}
            onChange={(e) => handleMetodeChange(e.target.value)}
            options={METODE_OPTIONS}
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

          {/* Tanggal Mulai */}
          <Input
            label="Tanggal Mulai"
            type="date"
            value={tanggalMulaiParam}
            onChange={(e) => handleTanggalMulaiChange(e.target.value)}
          />

          {/* Tanggal Selesai */}
          <Input
            label="Tanggal Selesai"
            type="date"
            value={tanggalSelesaiParam}
            onChange={(e) => handleTanggalSelesaiChange(e.target.value)}
          />
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-6">
        <PembayaranTable
          data={pembayaranList}
          isLoading={isLoading}
          onDetail={handleDetail}
          onVerifikasi={handleVerifikasi}
        />

        {/* Pagination */}
        {meta && (
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Modal Input Pembayaran */}
      <PembayaranModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Modal Detail Pembayaran */}
      {detailId && (
        <PembayaranDetailModal
          open={!!detailId}
          onClose={() => setDetailId(null)}
          pembayaranId={detailId}
        />
      )}

      {/* Modal Verifikasi Pembayaran */}
      {verifikasiId && (
        <VerifikasiModal
          open={!!verifikasiId}
          onClose={() => setVerifikasiId(null)}
          pembayaranId={verifikasiId}
        />
      )}
    </div>
  )
}

// ─── Page Export ──────────────────────────────────────────────────

export default function PembayaranPage() {
  return (
    <PembayaranErrorBoundary>
      <Suspense fallback={<div className="flex justify-center py-12">Loading...</div>}>
        <PembayaranContent />
      </Suspense>
    </PembayaranErrorBoundary>
  )
}
