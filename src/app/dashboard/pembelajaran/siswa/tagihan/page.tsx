'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CreditCard, FileText, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  PageHeader,
  Button,
  Select,
  Modal,
  Skeleton,
} from '@/components/ui'
import { StatusTagihanBadge } from '@/components/pembayaran/StatusTagihanBadge'
import { StatusPembayaranBadge } from '@/components/pembayaran/StatusPembayaranBadge'
import { PaymentGatewayModal } from '@/components/pembayaran/PaymentGatewayModal'
import {
  useTagihanList,
  useTagihanDetail,
  useRekapSiswa,
} from '@/hooks/pembayaran/useTagihan'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/lib/axios'
import { getErrorMessage, formatCurrency, formatDate } from '@/lib/utils'
import type { Tagihan } from '@/types/pembayaran.types'
import type { StatusTagihan } from '@/types/enums'
import React from 'react'

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

// ─── Detail Modal ─────────────────────────────────────────────────

interface TagihanDetailModalProps {
  open: boolean
  onClose: () => void
  tagihanId: string
  onBayar: (tagihan: Tagihan) => void
}

function TagihanDetailModal({ open, onClose, tagihanId, onBayar }: TagihanDetailModalProps) {
  const { data: tagihan, isLoading } = useTagihanDetail(tagihanId)

  const handleBayar = useCallback(() => {
    if (tagihan) {
      onBayar(tagihan)
      onClose()
    }
  }, [tagihan, onBayar, onClose])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detail Tagihan"
      size="xl"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} type="button">
            Tutup
          </Button>
          {tagihan && tagihan.status !== 'LUNAS' && (
            <Button
              type="button"
              leftIcon={<CreditCard size={16} />}
              onClick={handleBayar}
            >
              Bayar Digital
            </Button>
          )}
        </div>
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

class TagihanSiswaErrorBoundary extends React.Component<
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
          <AlertCircle className="w-12 h-12 text-red-500" />
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

function TagihanSiswaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()

  // ── Modal state ──────────────────────────────────────────────
  const [detailId, setDetailId] = useState<string | null>(null)
  const [paymentTagihan, setPaymentTagihan] = useState<Tagihan | null>(null)

  // ── Filter dari URL ──────────────────────────────────────────
  const statusParam = searchParams.get('status') as StatusTagihan | null
  const tahunAjaranIdParam = searchParams.get('tahunAjaranId') ?? ''

  // ── Fetch data tagihan ───────────────────────────────────────
  const { data: tagihanResponse, isLoading, error } = useTagihanList({
    ...(statusParam ? { status: statusParam } : {}),
    ...(tahunAjaranIdParam ? { tahunAjaranId: tahunAjaranIdParam } : {}),
  })

  // ── Fetch tahun ajaran ───────────────────────────────────────
  const { data: tahunAjaranData } = useQuery({
    queryKey: ['tahun-ajaran'],
    queryFn: () =>
      api.get<TahunAjaranItem[]>('/tahun-ajaran').then((res) => res.data),
  })

  // ── Fetch rekap siswa ────────────────────────────────────────
  const { data: rekap } = useRekapSiswa(
    user?.id ?? '',
    tahunAjaranIdParam || undefined
  )

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

  const handleDetail = useCallback((item: Tagihan) => {
    setDetailId(item.id)
  }, [])

  const handleBayar = useCallback((item: Tagihan) => {
    setPaymentTagihan(item)
  }, [])

  // ── Derived data ─────────────────────────────────────────────
  const tagihanList = tagihanResponse?.data ?? []

  const tahunAjaranOptions =
    tahunAjaranData?.map((t) => ({ value: t.id, label: t.nama })) ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tagihan Saya"
        description="Lihat dan bayar tagihan pembayaran sekolah"
      />

      {/* Rekap Tagihan Siswa */}
      {rekap && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Total Tagihan
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(rekap.totalTagihan)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {rekap.jumlahTagihan} tagihan
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Total Terbayar
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(rekap.totalBayar)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {rekap.jumlahLunas} lunas
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Sisa Tagihan
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(rekap.sisaTagihan)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {rekap.jumlahBelumBayar} belum lunas
            </p>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>
      </div>

      {/* Daftar Tagihan */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : tagihanList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <FileText className="w-10 h-10 opacity-40" />
            <p className="text-sm font-medium">Tidak ada tagihan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tagihanList.map((tagihan) => (
              <div
                key={tagihan.id}
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                        {tagihan.kategoriPembayaran?.nama ?? 'Tagihan'}
                      </h3>
                      <StatusTagihanBadge status={tagihan.status} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Periode</p>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {BULAN_LABEL[tagihan.bulan]} {tagihan.tahun}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Tagihan</p>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {formatCurrency(Number(tagihan.totalTagihan))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Sisa Bayar</p>
                        <p className={`font-semibold ${
                          Number(tagihan.sisaBayar) > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {formatCurrency(Number(tagihan.sisaBayar))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Jatuh Tempo</p>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {tagihan.tanggalJatuhTempo ? formatDate(tagihan.tanggalJatuhTempo) : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDetail(tagihan)}
                    >
                      Detail
                    </Button>
                    {tagihan.status !== 'LUNAS' && (
                      <Button
                        size="sm"
                        leftIcon={<CreditCard size={14} />}
                        onClick={() => handleBayar(tagihan)}
                      >
                        Bayar Digital
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Detail Tagihan */}
      {detailId && (
        <TagihanDetailModal
          open={!!detailId}
          onClose={() => setDetailId(null)}
          tagihanId={detailId}
          onBayar={handleBayar}
        />
      )}

      {/* Modal Pembayaran Digital */}
      {paymentTagihan && (
        <PaymentGatewayModal
          open={!!paymentTagihan}
          onClose={() => setPaymentTagihan(null)}
          tagihan={paymentTagihan}
        />
      )}
    </div>
  )
}

// ─── Page Export ──────────────────────────────────────────────────

export default function TagihanSiswaPage() {
  return (
    <TagihanSiswaErrorBoundary>
      <Suspense fallback={<div className="flex justify-center py-12">Loading...</div>}>
        <TagihanSiswaContent />
      </Suspense>
    </TagihanSiswaErrorBoundary>
  )
}
